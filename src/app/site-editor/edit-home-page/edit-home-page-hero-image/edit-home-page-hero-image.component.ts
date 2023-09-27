import { SiteEditorConstants } from './../../site-editor.constants';
import { EventEmitter, Output, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Component, Injector, OnInit } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { OriginalAsset, ExtendedSchoolInfoResponse, CarouselDto } from '@app/shared/common/apis/generated/content';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { IframeService } from '@app/shared/common/services/iframe-service';
import { SiteEditorService } from '@app/site-editor/services/site-editor-service';
import { catchError, finalize } from 'rxjs/operators';
import { CarouselItemDto, SiteEditorServiceProxy } from '@shared/service-proxies/service-proxies';
import { combineLatest, of, throwError } from 'rxjs';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { environment } from '../../../../environments/environment';
import { CarouselItem } from './carouselItem';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-edit-home-page-hero-image',
    templateUrl: './edit-home-page-hero-image.component.html',
    styleUrls: ['./edit-home-page-hero-image.component.css'],
})
export class EditHomePageHeroImageComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('selectHeroImageModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('editHomeHeroTrigger') editHomeHeroTrigger: ElementRef;
    modalType = ModalType;
    iframe: ElementRef;
    iframeImageContainer: ElementRef;
    renditions: OriginalAsset[] = [];
    assets: OriginalAsset[] = [];
    _school: ExtendedSchoolInfoResponse;
    //Hero image types to allow filter renditions
    readonly customImageType = 'custom';
    readonly generalImageType = 'general';
    heroImagesAvailable: boolean;
    customImagesAvailable: boolean;
    requestSubject: String = this.l('HeroImageRequestSubject');
    maxSelectedHeroImages: number = 8;
    minSelectedCarouselImages: number = 3;
    minSelectedHeroImages: number = 1;
    draggedHeroImage: OriginalAsset;
    carouselHeroImages: Array<CarouselItem> = [];
    originalSelectedCarouselHeroImages: Array<CarouselItem> = [];
    carouselDto: CarouselDto;
    tooltips = AppConsts.TOOLTIPS;

    constructor(
        injector: Injector,
        private _contentAPI: ContentApiClientFacade,
        private renderer: Renderer2,
        private iframeService: IframeService,
        private _siteEditorService: SiteEditorService,
        private _siteEditorServiceProxy: SiteEditorServiceProxy,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        this.iframeService.currentIframe.subscribe((iframe) => {
            this.iframe = iframe;
        });

        this._contentAPI
            .getSchool(this.appSession.school.crmId)
            .pipe(
                catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
            )
            .subscribe((school) => {
                this._school = school;
            });

        //Adjust Subject for Petition Email based on Env
        if (!environment.production) {
            this.requestSubject = (environment.dev ? '[DEV]' : '[STAGE]') + ' ' + this.requestSubject;
        }
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    openHeroCarouselEditModal() {
        this.originalSelectedCarouselHeroImages = [];
        this.carouselHeroImages = [];
        this.spinnerService.show();
        this._siteEditorService.disableButton(true);

        this.addSubscription(
            combineLatest([
                this._contentAPI.getSchoolHeroImages().pipe(catchError((err) => this.handleGetImagesError(err))),
                this._contentAPI
                    .getImages(this._school?.customHeroImageDamPath)
                    .pipe(catchError((err) => this.handleGetImagesError(err))),
                this._contentAPI
                    .getHeroImageCarousel(this._school?.homePageHeroComponentPath)
                    .pipe(catchError((err) => this.handleGetImagesError(err))),
            ])
                .pipe(
                    finalize(() => {
                        this.spinnerService.hide();
                    })
                )
                .subscribe(
                    ([heroImages, customHeroImages, heroImageCarousel]) => {
                        this.setupEditHeroModal(heroImages, customHeroImages, heroImageCarousel as CarouselDto);
                        this.modal.show();
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }

    setupEditHeroModal(
        heroImages: OriginalAsset[],
        customHeroImages: OriginalAsset[],
        heroImageCarousel: CarouselDto
    ): void {
        this.carouselDto = heroImageCarousel;

        if (heroImages?.length || customHeroImages?.length) {
            this.assets = heroImages?.map((asset) => ({ ...asset, type: this.generalImageType }));
            if (heroImages?.length) {
                this.renditions = this._siteEditorService.filterRenditions(heroImages);
                this.renditions = this.renditions?.map((asset) => ({
                    ...asset,
                    type: this.generalImageType,
                }));
            }
            this.heroImagesAvailable = this.renditions.length > 0;

            if (customHeroImages?.length) {
                customHeroImages = customHeroImages?.map((asset) => ({
                    ...asset,
                    type: this.customImageType,
                }));

                let customRenditions = this._siteEditorService.filterRenditions(customHeroImages);
                customRenditions = customRenditions?.map((asset) => ({
                    ...asset,
                    type: this.customImageType,
                }));

                if (customRenditions.length) {
                    this.customImagesAvailable = customRenditions.length > 0;

                    this.assets = this.assets?.concat(customHeroImages);
                    this.renditions = this.renditions?.concat(customRenditions);
                }
            }

            //Fill Carousel with Selected Images
            this.populateCarousel();
        }
    }

    saveHeroImageCarousel() {
        if (!this.validateSelectedImages()) {
            //do nothing, error messages should already be displayed
            return;
        }

        //Validate if there any change to be saved
        if (!this.pendingChanges()) {
            abp.message.info(this.l('NoPendingChanges'));
            return;
        }

        let carousel = this.getSelectedCarouselItems();
        this._siteEditorService.showSpinner(true);
        this._siteEditorServiceProxy
            .updateSchoolCarousel(this.appSession.school.crmId, this._school.homePageHeroComponentPath, carousel)
            .pipe(
                finalize(() => {
                    this._siteEditorService.showSpinner(false);
                })
            )
            .subscribe(
                () => {
                    this.onSuccessSavingCarousel();
                },
                (error) => {
                    console.log(error);
                    abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                }
            );
    }

    private onSuccessSavingCarousel() {
        // analytics
        this._angulartics2.eventTrack.next({
            action: 'Home Page Hero',
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this._appSessionService.school?.advertisingName,
            },
        });

        this.modal.hide();

        //just display standard success message to allow reloading the page
        this.save.emit(true);
    }

    open() {
        this.modal.show();
    }

    closeOrShowDiscardWarning() {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.modal.hide();
        }
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        this.clearSelection();
        this.discardModal.hide();
        this.modal.hide();
    }

    adjustEditor(element) {
        if (!element) {
            return [];
        }

        var elementData = [];
        elementData['height'] = element.offsetHeight + 'px';
        elementData['width'] = element.offsetWidth + 'px';
        elementData['top'] = element.offsetTop + 'px';
        elementData['left'] = element.offsetLeft + 'px';
        this.renderer.setStyle(this.editHomeHeroTrigger.nativeElement, 'height', elementData['height']);
        this.renderer.setStyle(this.editHomeHeroTrigger.nativeElement, 'width', elementData['width']);
        this.renderer.setStyle(this.editHomeHeroTrigger.nativeElement, 'top', elementData['top']);
        this.renderer.setStyle(this.editHomeHeroTrigger.nativeElement, 'left', elementData['left']);
        this.renderer.removeClass(this.editHomeHeroTrigger.nativeElement, 'd-none');
    }

    clearSelection(): void {
        this.carouselHeroImages = [];
        for (let i = 0; i < this.originalSelectedCarouselHeroImages.length; i++) {
            this.carouselHeroImages.push({
                slideNumber: this.originalSelectedCarouselHeroImages[i].slideNumber,
                rendition: this.originalSelectedCarouselHeroImages[i].rendition,
            });
        }
        this.rearrangeImages();
    }

    getAssetName(contentPath: string): string {
        var parts = contentPath.split('/');
        return parts[parts.length - 1];
    }

    canSave(): boolean {
        return this.pendingChanges() && this.validateSelectedImages();
    }

    validateSelectedImages(): boolean {
        return this.validAmountOfImagesSelected();
    }

    validAmountOfImagesSelected(): boolean {
        let selectedImages = this.carouselHeroImages.filter((x) => x.rendition).length;
        return (
            selectedImages == this.minSelectedHeroImages ||
            (selectedImages >= this.minSelectedCarouselImages && selectedImages <= this.maxSelectedHeroImages)
        );
    }

    pendingChanges(): boolean {
        return JSON.stringify(this.carouselHeroImages) !== JSON.stringify(this.originalSelectedCarouselHeroImages);
    }

    isSelected(rendition: OriginalAsset): boolean {
        return this.carouselHeroImages?.some(
            (c) =>
                c.rendition?.properties[SiteEditorConstants.CONTENT_PATH_KEY] ===
                rendition?.properties[SiteEditorConstants.CONTENT_PATH_KEY]
        );
    }

    /**
     * Populates the carousel with any selected images
     */
    populateCarousel() {
        //loop though selected carousel items to find the correspondent rendition
        // **based on the asset's contentPath added to the rendition's properties list
        for (let i = 0; i < this.carouselDto?.items.length; i++) {
            const carouselItem = this.carouselDto?.items[i];
            for (let j = 0; j < this.renditions?.length; j++) {
                var rendition = this.renditions[j];
                if (carouselItem.fileReference === rendition.properties[SiteEditorConstants.CONTENT_PATH_KEY]) {
                    this.carouselHeroImages.push({
                        slideNumber: i + 1,
                        rendition: rendition,
                    });
                }
            }
        }

        this.rearrangeImages();
        this.populateOriginalCarousel();
    }

    private populateOriginalCarousel() {
        this.originalSelectedCarouselHeroImages = [];
        for (let i = 0; i < this.carouselHeroImages.length; i++) {
            this.originalSelectedCarouselHeroImages.push({
                slideNumber: this.carouselHeroImages[i].slideNumber,
                rendition: this.carouselHeroImages[i].rendition,
            });
        }
    }

    dropImage(i: number) {
        const currentImageIndex = this.imageIndexInCarousel(this.draggedHeroImage);
        const currentAssetInSpot = this.carouselHeroImages[i].rendition;

        //Place image on new spot on the carousel
        this.carouselHeroImages[i].rendition = this.draggedHeroImage;
        if (currentImageIndex != null) {
            //Image already exists in carousel
            if (currentAssetInSpot != null) {
                this.carouselHeroImages[currentImageIndex].rendition = currentAssetInSpot;
            } else {
                this.carouselHeroImages[currentImageIndex].rendition = null;
            }
        }
        this.rearrangeImages();
    }

    removeSelectedImage(i: number) {
        if (this.carouselHeroImages.length > this.minSelectedHeroImages) {
            this.carouselHeroImages[i].rendition = undefined;
            this.rearrangeImages();
        }
    }

    dragImageStart(e: Event, image: OriginalAsset) {
        this.draggedHeroImage = image;
    }

    dragImageEnd(e: Event, image: OriginalAsset) {
        this.draggedHeroImage = null;
    }

    rearrangeImages() {
        let selectedImageTemp: Array<CarouselItem> = [];
        this.carouselHeroImages.map((item, index: number) => {
            if (item.rendition) {
                selectedImageTemp.push({
                    slideNumber: index + 1,
                    rendition: item.rendition,
                });
            }
        });
        for (let i = selectedImageTemp.length + 1; i <= this.maxSelectedHeroImages; i++) {
            selectedImageTemp.push({
                slideNumber: i,
                rendition: undefined,
            });
        }
        this.carouselHeroImages = selectedImageTemp;
    }

    imageIndexInCarousel(image: OriginalAsset): number {
        let index = null;
        this.carouselHeroImages.map((item, i: number) => {
            if (item.rendition == image) {
                index = i;
            }
        });
        return index;
    }

    /**
        20220121: https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/13901
        find the asset containing the selected rendition

        Simplified example from an asset and its renditions:
        {
            "name": "GS_Classroom_1.tif",
            "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif",
            "publishUrl": null,
            "url": "https://author-p24717-e85656.adobeaemcloud.com/api/assets/gsi/default-classroom-images/GS_Classroom_1.tif",
            "renditions": [
                {
                    "name": "cq5dam.thumbnail.140.100.png",
                    "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.140.100.png",
                    "url": "https://author-p24717-e85656.adobeaemcloud.com/api/assets/gsi/default-classroom-images/GS_Classroom_1.tif/renditions/cq5dam.thumbnail.140.100.png",
                },
                {
                    "name": "cq5dam.thumbnail.319.319.png",
                    "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.319.319.png",
                    "url": "https://author-p24717-e85656.adobeaemcloud.com/api/assets/gsi/default-classroom-images/GS_Classroom_1.tif/renditions/cq5dam.thumbnail.319.319.png",
                },
                {
                    "name": "cq5dam.thumbnail.48.48.png",
                    "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.48.48.png",
                    "url": "https://author-p24717-e85656.adobeaemcloud.com/api/assets/gsi/default-classroom-images/GS_Classroom_1.tif/renditions/cq5dam.thumbnail.48.48.png",
                }
            ]
        },
    */
    private getSelectedCarouselItems(): Array<CarouselItemDto> {
        let carouselItems: Array<CarouselItemDto> = [];
        for (let index = 0; index < this.carouselHeroImages.length; index++) {
            if (this.carouselHeroImages[index].rendition) {
                carouselItems.push(
                    CarouselItemDto.fromJS({
                        name: this.carouselHeroImages[index].rendition.href,
                        fileReference:
                            this.carouselHeroImages[index].rendition?.properties[SiteEditorConstants.CONTENT_PATH_KEY],
                    })
                );
            }
        }
        return carouselItems;
    }

    private handleGetImagesError(err: any) {
        if (err.status === 404) {
            return of(new Array<OriginalAsset>());
        }
        return throwError(err);
    }
}

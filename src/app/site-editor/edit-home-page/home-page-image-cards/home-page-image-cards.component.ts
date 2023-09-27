import { OriginalAsset } from './../../../shared/common/apis/generated/content/model/originalAsset';
import { EventEmitter, Output, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Component, Injector, OnInit } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ImageCardDto, ExtendedSchoolInfoResponse } from '@app/shared/common/apis/generated/content';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { IframeService } from '@app/shared/common/services/iframe-service';
import { catchError, finalize } from 'rxjs/operators';
import { SiteEditorService } from '@app/site-editor/services';
import { environment } from '../../../../environments/environment';
import { SiteEditorServiceProxy, ImageCardUpdateDto } from '@shared/service-proxies/service-proxies';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { forkJoin } from 'rxjs';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-edit-home-image-cards',
    templateUrl: './home-page-image-cards.component.html',
    styleUrls: ['./home-page-image-cards.component.css'],
})
export class HomePageImageCardsComponent extends AppComponentBase implements OnInit {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('editCardModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('editCardsTrigger') editCardsTrigger: ElementRef;
    modalType = ModalType;
    iframe: ElementRef;
    iframeImageContainer: ElementRef;
    draggedCardID: string = null;
    maxSelectableCards: number = 2;
    maxCarouselCards: number = 3;
    school: ExtendedSchoolInfoResponse;
    imageCards: ImageCardDto[] = [];
    selectedImageCards: ImageCardDto[] = [];
    originalSelectedImageCards: ImageCardDto[] = [];
    requestSubject: String = this.l('HomePageImageRequestSubject');
    imageCardsLoaded = false; //Prevents to show content until all requests are finished
    tooltips = AppConsts.TOOLTIPS;

    constructor(
        injector: Injector,
        private renderer: Renderer2,
        private iframeService: IframeService,
        private _contentAPI: ContentApiClientFacade,
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
                this.school = school;
            });

        //Adjust Subject for Petition Email based on Env
        if (!environment.production) {
            let envPrefix = environment.dev ? '[DEV]' : '[STAGE]';
            this.requestSubject = envPrefix + ' ' + this.requestSubject;
        }
    }

    getImageCards() {
        this.imageCardsLoaded = false;
        this.selectedImageCards = [];
        this.spinnerService.show('content');

        // 1. Retrieve the image cards json
        this.addSubscription(
            this._contentAPI.getImageCards(this.school.homePageImageCardsPath).subscribe(
                (response) => {
                    this.imageCards = response?.sort((a, b) => (a.sortOverride > b.sortOverride ? 1 : -1));
                    //2. Parse out the files for the unique folder names
                    let uniqueFolders = this.getUniqueFolders(this.imageCards.map((x) => x.fileReference));
                    this.getImageCardsRenditionsAndShowModal(uniqueFolders);
                },
                (error) => {
                    console.log(error);
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            )
        );
    }

    getImageCardsRenditionsAndShowModal(uniqueFolders: string[]) {
        //3. Retrieve the renditions from the content api for each unique folder
        forkJoin(uniqueFolders.map((x) => this._contentAPI.getImages(x)))
            .pipe(
                finalize(() => {
                    this.spinnerService.hide('content');
                })
            )
            .subscribe(
                (assets: OriginalAsset[][]) => {
                    this.setImageCardFileReferences(assets);

                    this.selectedImageCards = this.imageCards?.filter((x) => x.sortOverride >= 0);

                    if (this.selectedImageCards.length < this.maxSelectableCards) {
                        //There could be no cards, so it would just show the first n cards in the UI/AEM control
                        //if we get less than n back, the last n - x cards can be picked in order from 1, 2, etc...
                        let cardsToComplete = this.maxSelectableCards - this.selectedImageCards.length;

                        //Find cards that do not exist in the selected cards
                        let cards = this.imageCards
                            .filter((item) => !this.selectedImageCards.some((x) => x.name === item.name))
                            .slice(0, cardsToComplete);

                        for (let i = 0; i < cards.length; i++) {
                            this.selectedImageCards.push(cards[i]);
                        }
                    }

                    this.originalSelectedImageCards = this.selectedImageCards.slice();

                    this.imageCardsLoaded = true;
                    this.open();
                },
                (error) => {
                    console.log(error);
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    private setImageCardFileReferences(assets: OriginalAsset[][]) {
        let tempAssets: OriginalAsset[] = [];
        //Concat results from the different folders
        for (let index = 0; index < assets.length; index++) {
            if (assets[index].length) {
                for (let j = 0; j < assets[index].length; j++) {
                    tempAssets.push(assets[index][j]);
                }
            }
        }

        //Filter only assets that matches any of the imageCards fileReference
        tempAssets = tempAssets.filter((x) =>
            this.imageCards.some((y) => decodeURIComponent(x.contentPath).includes(y.fileReference))
        );

        //filter renditions
        let renditions = this._siteEditorService.filterRenditions(
            tempAssets,
            SiteEditorConstants.imageCardsRenditionSizes
        );

        this.imageCards?.forEach((c) => {
            let found = false;
            for (let rendition of renditions) {
                //Remove the extension to compare with the fileReference, fileReference could be .tif and rendition jpeg

                const publishUrl = rendition?.publishUrl?.split('.').slice(0, -1).join('.');
                const fileReference = c.fileReference.split('.').slice(0, -1).join('.');

                //5. Use the .fileReference property to match with the rendition for each asset
                if (decodeURIComponent(publishUrl)?.includes(fileReference)) {
                    c.fileReference = rendition?.publishUrl;
                    found = true;
                }
                //break renditions loop
                if (found) {
                    break;
                }
            }
        });
    }

    getUniqueFolders(fileReferences: string[]): string[] {
        let arrFileReferences: string[] = [];
        for (let index = 0; index < fileReferences.length; index++) {
            let split = fileReferences[index].split('/');
            let fRerence = split.slice(0, split.length - 1).join('/');
            if (!arrFileReferences.some((x) => x === fRerence)) {
                arrFileReferences.push(fRerence);
            }
        }
        return arrFileReferences.filter((r, i, arr) => arr.findIndex((t) => t === r) === i);
    }

    open() {
        this.modal.show();
    }

    close() {
        this.modal.hide();
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
        this.modal.hide();
        this.discardModal.hide();
    }

    adjustEditor(element) {
        if (!element) {
            return [];
        }
        var elementData = [];
        elementData['height'] = element.offsetHeight + 'px';
        elementData['width'] = element.offsetWidth + 'px';
        elementData['top'] = element.getBoundingClientRect().top + 'px';
        elementData['left'] = element.offsetLeft + 'px';
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'height', elementData['height']);
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'width', elementData['width']);
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'top', elementData['top']);
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'left', elementData['left']);
        this.renderer.removeClass(this.editCardsTrigger.nativeElement, 'd-none');
    }

    dropSortCards(cardSpot) {
        let selectedCardID = this.draggedCardID;
        let selectedCardIndex;
        let selectedCard = this.selectedImageCards.find((item, index) => {
            selectedCardIndex = index;
            if (item) {
                return item.name === selectedCardID;
            } else {
                return false;
            }
        });
        let cardOnSpot = this.selectedImageCards[cardSpot];
        this.selectedImageCards[cardSpot] = selectedCard;
        this.selectedImageCards[selectedCardIndex] = cardOnSpot;
        this.animatedDroppedCard(selectedCardID);
    }

    dropNewCard(cardSpot) {
        let newCardID = this.draggedCardID;
        let selectedCard = this.imageCards.find((item) => {
            return item.name === newCardID;
        });
        if (!this.selectedImageCards.some((x) => x.name === selectedCard.name)) {
            this.selectedImageCards[cardSpot] = selectedCard;
            this.animatedDroppedCard(newCardID);
        } else {
            this.dropSortCards(cardSpot);
        }
    }

    dragStart(e: Event, homePageCard) {
        let target = e.currentTarget as HTMLTextAreaElement;
        let cardID = homePageCard.name;
        this.renderer.addClass(target, 'opacity-0');
        this.draggedCardID = cardID;
    }

    dragEnd(e: Event, homePageCard) {
        this.renderer.removeClass(e.currentTarget, 'opacity-0');
        this.draggedCardID = null;
    }

    animatedDroppedCard(cardId) {
        setTimeout(() => {
            let allCards = document.querySelectorAll('.gsi-home-page-cards [data-card-id]');
            let card = document.querySelectorAll('.gsi-home-page-cards [data-card-id="' + cardId + '"]')[0];
            allCards.forEach((item) => {
                this.renderer.removeClass(item, 'dropped');
            });

            this.renderer.addClass(card, 'dropped');
        }, 50);
    }

    pendingChanges(): boolean {
        return JSON.stringify(this.selectedImageCards) !== JSON.stringify(this.originalSelectedImageCards);
    }

    getCardClasses(cardColor: string): string {
        let baseClases: string = 'gsi-drop-card_content w-100 p-3';
        let textColorClass: string = cardColor == '#002855' ? 'text-white' : '';
        baseClases = baseClases + ' ' + textColorClass;
        return baseClases;
    }

    getCardTitleClasses(cardColor: string): string {
        let baseClases: string = 'gsi-drop-card_title font-ramona mb-0';
        let textColorClass: string = cardColor == '#002855' ? 'text-white' : 'text-primary';
        baseClases = baseClases + ' ' + textColorClass;
        return baseClases;
    }

    getCardLinkClasses(cardColor: string): string {
        let baseClases: string = 'border rounded-circle gsi-drop-card_icon';
        let borderColorClass: string = cardColor == '#002855' ? 'border-white' : 'border-primary';
        baseClases = baseClases + ' ' + borderColorClass;
        return baseClases;
    }

    /**
     * this will need to save through FBP API, temp. while wiring the cards to show correctly
     */
    saveImageCards(): void {
        let selectedCards: ImageCardUpdateDto[] = [];

        for (let index = 0; index < this.selectedImageCards?.length; index++) {
            selectedCards.push({
                name: this.selectedImageCards[index].name,
                sortOverride: index,
            } as ImageCardUpdateDto);
        }

        //Find image cards that are not selected
        let cards = this.imageCards.filter((item) => !this.selectedImageCards.some((x) => x.name === item.name));

        //Add remainig cards with negative sortOverride
        if (cards && cards.length > 0) {
            for (let index = 0; index < cards.length; index++) {
                selectedCards.push({ name: cards[index].name, sortOverride: -1 } as ImageCardUpdateDto);
            }
        }

        this._siteEditorService.showSpinner(true);

        this._siteEditorServiceProxy
            .updateSchoolImageCards(this.school.crmId, this.school.homePageImageCardsPath, selectedCards)
            .pipe(
                finalize(() => {
                    this._siteEditorService.showSpinner(false);
                })
            )
            .subscribe(
                () => {
                    this.close();
                    this.save.emit(true);

                    // analytics
                    this._angulartics2.eventTrack.next({
                        action: 'Home Page Image Cards',
                        properties: {
                            category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                            label: this._appSessionService.school?.advertisingName,
                        },
                    });
                },
                (error) => {
                    abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                }
            );
    }
}

import {
    Component,
    Injector,
    ViewChild,
    Output,
    EventEmitter,
    ElementRef,
    OnDestroy,
    OnInit,
    Renderer2,
} from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Angulartics2 } from 'angulartics2';
import { SiteEditorService } from '@app/site-editor/services';
import {
    AssetListDto as fbpAssetListDto,
    AssetsEditorServiceServiceProxy,
    SiteEditorServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import {
    AssetListDto,
    AssetListItemDto,
    ExtendedSchoolInfoResponse,
    OriginalAsset,
} from '@app/shared/common/apis/generated/content';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { catchError, concatMap, finalize } from 'rxjs/operators';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { SummerCampClientFacade } from '@shared/service-proxies/summer-camp-client-facade';
import { NgForm } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Rendition } from '@app/shared/common/extends/Rendition';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
    selector: 'app-edit-summer-camp-events',
    templateUrl: './edit-summer-camp-events.component.html',
    styleUrls: ['./edit-summer-camp-events.component.css'],
    animations: [appModuleAnimation()],
})
export class EditSummerCampEventsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('editSummerCampEventsModal', { static: true }) modal: ModalDirective;
    @ViewChild('newSummerCampEventModal', { static: true }) modalNewEvent: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('editSummerCampEventsTrigger') editSummerCampEventsTrigger: ElementRef;
    @ViewChild('summerCampEventForm') summerCampEventForm: NgForm;
    @ViewChild('summerCampEventFile') summerCampEventFile: ElementRef;
    @ViewChild('opIconSelection') opIconSelection: OverlayPanel;
    @ViewChild('removeSummerCampEventConfirmModal', { static: true })
    private removeSummerCampEventConfirmModal: GoddardConfirmationModalComponent;

    removeEventName = null;
    modalType = ModalType;
    _school: ExtendedSchoolInfoResponse;
    renditions: OriginalAsset[] = [];
    assets: OriginalAsset[] = [];
    _assetList: AssetListDto;
    _originalAssetList: AssetListDto;
    _assetListItemDto: AssetListItemDto | undefined;
    _originalAssetListItemDto: AssetListItemDto | undefined;
    selectedIcon: OriginalAsset = null;
    imageUrlOrBase64: string = '';
    selectedFile: File | undefined;
    blob: Blob;
    selectedFileName: string | undefined;
    PDF_EXTENSION = '.pdf';
    MAX_PDF_SIZE_MB = 1; //max file size in MB
    newPdfSelected = false;
    bytesToMegaBytes = (bytes: number) => bytes / 1024 ** 2;
    datePickerConfig = {
        ...SiteEditorConstants.DEFAULT_DATEPICKER_CONFIG,
    };
    refreshOnClose = false;
    displayEventAlways: boolean = false;
    //#region Constructor

    constructor(
        injector: Injector,
        private renderer: Renderer2,
        private _siteEditorService: SiteEditorService,
        private _contentAPI: ContentApiClientFacade,
        private _siteEditorServiceProxy: SiteEditorServiceProxy,
        private _angulartics2: Angulartics2,
        private _summerCampClientFacade: SummerCampClientFacade,
        private _assetsEditorServiceProxy: AssetsEditorServiceServiceProxy
    ) {
        super(injector);
    }

    //#endregion

    //=================================================================

    //#region angular pipeline life-cycle overrides

    ngOnInit(): void {
        this.addSubscription(
            this._siteEditorService.currentSchoolObservable.subscribe((school) => {
                this._school = school;
            })
        );
        this.getIconsLibrary();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    //#endregion

    //=================================================================

    //#region Edit SummerCampEvent List modal

    openModal() {
        this.refreshOnClose = false;
        this.getSummerCalendarAndDisplayListModal();
    }

    close() {
        this.modal.hide();

        if (this.refreshOnClose) {
            this._siteEditorService.refreshPage(true);
        }
    }

    getSummerCalendarAndDisplayListModal(reopenListModal: boolean = true): void {
        this.getAssetListObservable()
            .pipe(
                finalize(() => this.spinnerService.hide()),
                catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
            )
            .subscribe((assetList: AssetListDto) => {
                this._assetList = assetList;
                if (this._assetList.items === null) {
                    this._assetList.items = [];
                }
                this._originalAssetList = { ...this._assetList };
                if (reopenListModal) {
                    this.modal.show();
                }
            });
    }

    //#endregion

    //=================================================================

    //#region SummerCampEvent Item

    openNewEventModal(name: string | undefined) {
        this.newPdfSelected = false;
        this.selectedFile = undefined;
        this.selectedFileName = undefined;
        const assetListItemDto = name
            ? this._assetList?.items.find((x) => x.name === name)
            : {
                  name: null,
                  //set default icon full asset's contentPath stored in the properties[SiteEditorConstants.CONTENT_PATH_KEY]
                  icon: this.renditions?.find((x) =>
                      new Rendition(x).matchesIcon(SiteEditorConstants.DEFAULT_ICON_NAME)
                  )?.properties[SiteEditorConstants.CONTENT_PATH_KEY],
                  sortOverride: this._assetList?.items.length + 1,
                  offTime: null,
                  fileReference: null,
              };
        this._assetListItemDto = { ...assetListItemDto };
        this._originalAssetListItemDto = { ...this._assetListItemDto };
        this.displayEventAlways = this._assetListItemDto.offTime === null;
        this.selectedIcon = this.renditions.find(
            (x) => x?.properties[SiteEditorConstants.CONTENT_PATH_KEY] === assetListItemDto.icon
        );
        this.modalNewEvent.show();
    }

    closeNewEventModal() {
        this._assetListItemDto = undefined;
        this._originalAssetListItemDto = undefined;
        this.selectedIcon = undefined;
        this.modalNewEvent.hide();
    }

    saveSummerCampEvent(): void {
        this.summerCampEventForm.form.markAllAsTouched();
        if (!this.summerCampEventForm.form.valid || !this.eventFileSelected()) {
            return;
        }

        if (!this.pendingChanges()) {
            abp.message.info(this.l('NoPendingChanges'), '');
            return;
        }

        // If there is a pdf file to be uploaded:
        if (this.newPdfSelected) {
            this.uploadPdfAndSaveSummerCampEvent();
        } else {
            //run standard save SummerCamp Event pipeline
            this.saveCurrentSummerCampEvent();
        }
    }

    saveCurrentSummerCampEvent() {
        this.updateAssetListWithUpdatedCurrentEvent();
        this.saveSummerCamp();
    }

    saveSummerCamp(): void {
        this.spinnerService.show('content');
        this.saveSummerCampObservable()
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe((response) => {
                this.onSuccessSavingSummerCampEvent('SummerCamp Events Sorting Update');
            }, this.displayError);
    }

    private uploadPdfAndSaveSummerCampEvent() {
        /*
         * First upload the new pdf, delete the old one if any, and concatenate the responses so that if every call succeed
         * we update the SummerCamp Event
         */

        this.spinnerService.show('content');

        this._contentAPI
            .uploadAsset(
                this.appSession.school.crmId,
                this._school.summerCampsDamPath,
                this.selectedFileName,
                this.blob
            )
            .pipe(
                concatMap((value) => {
                    //event already exists and is an update of the file, replacing it
                    if (
                        this._originalAssetListItemDto.name !== null &&
                        this._originalAssetListItemDto.fileReference !== null
                    ) {
                        return this.deletePdfObservable(this._originalAssetListItemDto.fileReference);
                    }
                    return of({});
                }),
                concatMap((_): any => {
                    this._assetListItemDto.fileReference = `${this._school.summerCampsDamPath}/${this.selectedFileName}`;
                    return of({});
                }),
                concatMap((_) => {
                    this.updateAssetListWithUpdatedCurrentEvent();
                    return this.saveSummerCampObservable();
                }),
                finalize(() => {
                    this.spinnerService.hide('content');
                })
            )
            .subscribe(() => {
                this.onSuccessSavingSummerCampEvent();
            }, this.displayError);
    }

    onDeleteSummerCampEvent(name: string): void {
        this.removeEventName = name;
        this.removeSummerCampEventConfirmModal.show();
    }

    deleteSummerCampEvent(name: string): void {
        this.spinnerService.show('content');
        var item = this._assetList?.items?.find((x) => x.name === name);

        if (item && item.fileReference !== null) {
            this.deletePdfAndSaveSummerCampEvent(name);
            return;
        }

        this.deleteSummerCampObservable(name)
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe((response) => {
                this.onSuccessSavingSummerCampEvent('SummerCampEvent Delete');
                this.removeEventName = null;
            }, this.displayError);
    }

    private deletePdfAndSaveSummerCampEvent(name: string) {
        var item = this._assetList?.items.find((x) => x.name === name);
        this.deletePdfObservable(item.fileReference)
            .pipe(
                concatMap((resp) => {
                    return this.deleteSummerCampObservable(name);
                }),
                finalize(() => {
                    this.spinnerService.hide('content');
                })
            )
            .subscribe(() => {
                this.onSuccessSavingSummerCampEvent('SummerCampEvent Delete');
                this.removeEventName = null;
            }, this.displayError);
    }

    private getAssetListObservable() {
        return this._contentAPI.getAssetList(this._school.summerCampPageAssetListComponentPath).pipe(
            finalize(() => this.spinnerService.hide()),
            catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
        );
    }

    updateAssetListWithUpdatedCurrentEvent(): void {
        this.setConvertedSummerCampEvent();

        if (this._assetListItemDto.name === null) {
            this._assetList.items.push(this._assetListItemDto);
        } else {
            //Find index of specific current event
            let index = this._assetList?.items.findIndex((obj) => obj.name === this._assetListItemDto.name);

            //Update asset list
            this._assetList.items[index] = this._assetListItemDto;
        }
    }

    private setConvertedSummerCampEvent() {
        //Clear out any previously selected date
        if (this.displayEventAlways) {
            this._assetListItemDto.offTime = null;
        }

        let iconName = this._assetListItemDto.icon;
        if (iconName.includes('/')) {
            iconName = iconName.split('/').pop();
        }
        this._assetListItemDto.icon = this.assets.find((a) => a.name === iconName).contentPath;
    }

    private saveSummerCampObservable() {
        let data = fbpAssetListDto.fromJS({ items: this._assetList?.items });
        return this._summerCampClientFacade.saveSummerCampCalendar(
            this._school.crmId,
            this._school.summerCampPageAssetListComponentPath,
            data
        );
    }

    private deleteSummerCampObservable(name: string) {
        let data = fbpAssetListDto.fromJS({ items: this._assetList?.items?.filter((x) => x.name !== name) });
        return this._summerCampClientFacade.saveSummerCampCalendar(
            this._school.crmId,
            this._school.summerCampPageAssetListComponentPath,
            data
        );
    }

    private deletePdfObservable(fileName: string): Observable<any> {
        return this._siteEditorServiceProxy
            .validateSchoolPageExists(`${environment.schoolBaseSiteUrl}${fileName}`)
            .pipe(
                concatMap((response) => {
                    return response
                        ? this._assetsEditorServiceProxy.deleteAsset(
                              this._school.crmId,
                              this._school.summerCampsDamPath,
                              this.getFileNameFromPath(fileName)
                          )
                        : of({});
                })
            );
    }

    private onSuccessSavingSummerCampEvent(analyticsMessage: string = 'SummerCamp Calendar') {
        this.refreshOnClose = true;

        this.closeNewEventModal();
        // analytics
        this._angulartics2.eventTrack.next({
            action: analyticsMessage,
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this.appSession.school?.advertisingName,
            },
        });

        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.getSummerCalendarAndDisplayListModal();
        });
    }

    onReorderSummerCampEvents(reorderEvent: { dragIndex: number; dropIndex: number }): void {
        if (reorderEvent.dropIndex !== reorderEvent.dragIndex) {
            for (let i = 0; i < this._assetList.items.length; i++) {
                this._assetList.items[i].sortOverride = i + 1;
            }
            this.saveSummerCamp();
        }
    }

    //#endregion

    //=================================================================

    //#region Discard Changes (Event Item modal)

    closeOrShowDiscardChangesModal(): void {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.closeNewEventModal();
        }
    }

    pendingChanges(): boolean {
        //Compare to validate if changed
        return (
            this.newPdfSelected ||
            this.summerCampEventForm.form.dirty ||
            JSON.stringify(this._originalAssetListItemDto) !== JSON.stringify(this._assetListItemDto)
        );
        //return JSON.stringify(this._originalAssetList) !== JSON.stringify(this._assetList);
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        //RESET CHANGES
        this.closeDiscardChangesModal();
        this.closeNewEventModal();
    }

    //#endregion

    //=================================================================

    //#region Icons
    getIconsLibrary() {
        this._contentAPI
            .getImages(SiteEditorConstants.calendarEventsIconsPath)
            .pipe(finalize(() => this.spinnerService.hide()))
            .subscribe(
                (assets) => {
                    this.setupIcons(assets);
                },
                (error) => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    /**
     * filter renditions and set type and title properties for using them to identity selected Icon
     * @param assets: array of assets from content API
     */
    private setupIcons(assets: OriginalAsset[]) {
        this.assets = assets;
        this.renditions = this._siteEditorService.filterRenditions(
            assets,
            SiteEditorConstants.eventsCalendarIconsSizes,
            'png'
        );
        this.renditions = this.renditions.map((rendition) => ({
            ...rendition,
            type: this.assets.find((x) => rendition.contentPath.includes(x.contentPath))?.name,
            //Set rendition url to match for the icon since it stores the full asset contentPath
            url: this.assets.find((x) => rendition.contentPath.includes(x.contentPath))?.contentPath,
            title: this.assets
                .find((x) => rendition.contentPath.includes(x.contentPath))
                ?.name.split('.')
                .slice(0, -1)
                .join('.'),
        }));
    }

    findIconUrlByName(iconName: string | undefined): string | undefined {
        if (iconName.includes('/')) {
            iconName = iconName.split('/').pop();
        }
        return iconName ? this.renditions?.find((x) => x.href === iconName)?.publishUrl : '';
    }

    selectIcon(rendition: OriginalAsset = null) {
        this.selectedIcon = rendition;
        this._assetListItemDto.icon = rendition ? rendition.url : null;

        this.opIconSelection?.hide();
    }

    //#endregion

    //=================================================================

    //#region Editor
    public adjustEditor(element): void {
        if (!element) {
            return;
        }
        var elementData = [];
        elementData['height'] = element?.offsetHeight + 'px';
        elementData['width'] = element?.offsetWidth + 'px';
        elementData['top'] = element.getBoundingClientRect().top + 'px';
        elementData['left'] = element?.offsetLeft + 'px';
        this.renderer.setStyle(this.editSummerCampEventsTrigger.nativeElement, 'height', elementData['height']);
        this.renderer.setStyle(this.editSummerCampEventsTrigger.nativeElement, 'width', elementData['width']);
        this.renderer.setStyle(this.editSummerCampEventsTrigger.nativeElement, 'top', elementData['top']);
        this.renderer.setStyle(this.editSummerCampEventsTrigger.nativeElement, 'left', elementData['left']);
        this.renderer.removeClass(this.editSummerCampEventsTrigger.nativeElement, 'd-none');
    }
    //#endregion

    //=================================================================

    //#region File
    selectFile(): void {
        this.summerCampEventFile.nativeElement.click();
    }

    onFileDropped(event) {
        const file = event.dataTransfer.files[0] as File;
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        if (this.validateFileType(ext) && this.validateFileSize(file.size)) {
            this.setSelectedFile(file);
        }
    }

    fileChangeEvent(event: any): void {
        const file = event.target.files[0] as File;
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        if (this.validateFileType(ext) && this.validateFileSize(file.size)) {
            this.setSelectedFile(file);
            // reset the input field to allow user to re-add the same file
            event.target.value = '';
        }
    }

    setSelectedFile(file: File): void {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        this.newPdfSelected = true;
        this.selectedFile = file;
        this.blob = this.selectedFile;

        // Set the image filename with a timestamp to make them all unique
        this.selectedFileName = `${fileName}-${new Date().getTime()}${this.PDF_EXTENSION}`;
    }

    private validateFileType(ext: string): boolean {
        const validFileType = this.PDF_EXTENSION.includes(ext.toLowerCase());
        if (!validFileType) {
            abp.message.warn(this.l('SummerCampEvent_Warn_FileType'));
        }
        return validFileType;
    }

    private validateFileSize(size: number): boolean {
        const validFileSize = this.bytesToMegaBytes(size) < this.MAX_PDF_SIZE_MB;
        if (!validFileSize) {
            abp.message.warn(this.l('File_Warn_SizeLimit', this.MAX_PDF_SIZE_MB));
        }
        return validFileSize;
    }

    validFile(): boolean {
        if (!this._assetListItemDto) {
            return true;
        }

        //User selected a new file
        if (this.selectedFile) {
            const ext = this.selectedFile.name.substring(this.selectedFile.name.lastIndexOf('.'));
            return this.validateFileType(ext) && this.validateFileSize(this.selectedFile.size);
        }

        //check if has a fileReference
        return this._assetListItemDto.fileReference !== null;
    }

    eventFileSelected(): boolean {
        return this.selectedFile !== undefined || this._assetListItemDto.fileReference !== null;
    }

    getFileNameFromPath(name: string): string {
        return name.split('/').pop();
    }

    //#endregion

    //=================================================================

    displayError(error): void {
        console.log(error);
        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
    }

    /**
     * Remove summer camp event accepted
     */
    summerCampEventRemoveAccepted(): void {
        this.deleteSummerCampEvent(this.removeEventName);
        this.removeSummerCampEventConfirmModal.hide();
    }

    /**
     * Remove summer camp event rejected
     */
    summerCampEventRemoveRejected(): void {
        this.removeEventName = null;
        this.removeSummerCampEventConfirmModal.hide();
    }    
}

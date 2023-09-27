import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { Component, Injector, ViewChild, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { OriginalAsset } from '@app/shared/common/apis/generated/content';
import { SiteEditorService } from '@app/site-editor/services';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { Events, EventTemplate } from '@app/shared/common/apis/generated/school-events';
import { Editor } from 'primeng/editor';
import { DescriptionLengthValidatorService } from '@shared/utils/description-length-validator.service';
import { EventTemplatesApiClientFacade } from '@shared/service-proxies/event-templates-api-client-facade';
import { ApiException, PostEventTemplate } from '@shared/service-proxies/service-proxies';
import { QuilljsExtensionsService } from '@shared/utils/quilljs-extensions.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'event-template-modal',
    templateUrl: './event-template-modal.component.html',
    styleUrls: ['./event-template-modal.component.css'],
})
export class EventTemplateModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<Events> = new EventEmitter<Events>();
    @ViewChild('EventTemplateModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('opIconSelection') opIconSelection: OverlayPanel;
    @ViewChild('publicWebsiteDescription') editor: Editor;
    modalType = ModalType;

    // customized config
    datePickerConfig = SiteEditorConstants.DEFAULT_DATEPICKER_CONFIG;
    /*
    solve datepicker issue by adding date pipe to string data type
    https://github.com/valor-software/ngx-bootstrap/issues/4487
    */
    dateTimeFormat = 'short';
    eventTemplate: EventTemplate;
    originalEventTemplate: EventTemplate;
    renditions: OriginalAsset[] = [];
    assets: OriginalAsset[] = [];
    defaultEvent = 0;
    startingTime: Date | undefined;
    endingTime: Date | undefined;
    maxDescriptionLength = 275; //max length for description only, after removing links
    totalMaxDescriptionLength = 4000; //max characters combined in both the description AND markup
    //Max characters the user is allowed to enter for the description after removing default editor's wrapper length
    maxMarkupLength = this.totalMaxDescriptionLength - this.maxDescriptionLength;
    // Padding for anchor tags that are added
    anchorMarkupPadding = 225;
    // If we show the full markup length it will be inaccurate since it doesn't account for markup
    maxMarkupLengthForMessage = this.totalMaxDescriptionLength - this.maxDescriptionLength - this.anchorMarkupPadding;
    schoolStartBusinessHour: string;
    schoolEndBusinessHour: string;
    defaultSchoolBusinessHours = '8:00 am - 5:00 pm';
    descriptionHolder: string; //retain description to validate and prevent user to enter more than the max allowed characters
    userEditableFields = ['name', 'iconFileName', 'publicWebsiteDescription', 'startTime', 'endTime'];
    updateEventSeries: boolean = false;
    enabledDates: Date[] = [];
    editorFormatsWhitelist: string[] = ['link'];
    validUrl: boolean = true;
    selectedIcon: OriginalAsset = null;
    tooltips = AppConsts.TOOLTIPS;

    remainingCharacters(): number {
        return this._maxDescriptionValidator.remainingCharacters(
            this.eventTemplate?.publicWebsiteDescription,
            this.maxDescriptionLength
        );
    }

    constructor(
        injector: Injector,
        private _eventTemplatesClientFacade: EventTemplatesApiClientFacade,
        private _contentApiClientFacade: ContentApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _maxDescriptionValidator: DescriptionLengthValidatorService,
        private _quillExtensions: QuilljsExtensionsService,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.addSubscription(
            this._siteEditorService.currentAssetsObservable.pipe(finalize(() => {})).subscribe((assets) => {
                this.setupIcons(assets);
            })
        );

        this.addSubscription(
            this._siteEditorService.currentEventTemplateObservable
                .pipe(finalize(() => {}))
                .subscribe((eventTemplate) => {
                    this.setConvertedEventTemplate(eventTemplate);
                    this.originalEventTemplate = { ...eventTemplate };

                    if (!this.renditions) {
                        this.getIconsLibrary();
                    } else {
                        this.open();
                    }

                    this.addQuillJsExtensions();
                })
        );
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    private setConvertedEventTemplate(eventTemplate: EventTemplate) {
        this.eventTemplate = eventTemplate;
        this.setSelectedEventIcon();
        if (this.eventTemplate.startTime) {
            this.startingTime = this._dateTimeService.convertUTCToLocalDate(
                this._dateTimeService.convertTimeSpanToDate(this.eventTemplate.startTime)
            );
        }

        if (this.eventTemplate.endTime) {
            this.endingTime = this._dateTimeService.convertUTCToLocalDate(
                this._dateTimeService.convertTimeSpanToDate(this.eventTemplate.endTime)
            );
        }

        this.descriptionHolder = this.eventTemplate.publicWebsiteDescription;
    }

    open() {
        this.modal.show();
    }

    close() {
        this.modal.hide();
    }

    getIconsLibrary() {
        this.spinnerService.show();
        this._contentApiClientFacade
            .getImages(SiteEditorConstants.calendarEventsIconsPath)
            .pipe(finalize(() => this.spinnerService.hide()))
            .subscribe(
                (assets) => {
                    this.setupIcons(assets);
                    this.open();
                },
                (error) => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    selectEventIcon(rendition: OriginalAsset = null) {
        this.selectedIcon = rendition;
        this.eventTemplate.iconFileName = rendition ? rendition.href : null;
        this.opIconSelection.hide();
    }

    setSelectedEventIcon(): void {
        this.selectedIcon = null;
        //Set the current Select Icon based on the Current Event
        if (this.eventTemplate?.iconFileName) {
            const matchedRendition = this.renditions.filter((rendition: OriginalAsset, index: number) => {
                return this.eventTemplate.iconFileName.toLocaleLowerCase() == rendition.href.toLocaleLowerCase();
            });
            if (matchedRendition.length > 0) {
                this.selectedIcon = matchedRendition[0];
            }
        }
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

        //Filter repited assets with just caps diff
        this.renditions.map((asset) => {
            const assetName = asset.href;
            if (/^(?!.*\.net)[^\nA-Z]+$/g.test(assetName)) {
                this.renditions = this.renditions.filter((a) => {
                    if (a.href.toLocaleLowerCase() != assetName.toLocaleLowerCase() || a == asset) {
                        return a;
                    }
                });
            }
        });

        this.renditions = this.renditions.map((rendition) => ({
            ...rendition,
            type: this.assets.find((x) => rendition.contentPath.includes(x.contentPath))?.name,
            title: this.assets
                .find((x) => rendition.contentPath.includes(x.contentPath))
                ?.name.split('.')
                .slice(0, -1)
                .join('.'),
        }));
    }

    /** Add or update event templates
     *
     * Id is null, it will be considered as an Insert
     */
    saveEventTemplate(): void {
        let data = this.getConvertedEventTemplate();
        this._siteEditorService.showSpinner(true);

        //Save the event template
        this._eventTemplatesClientFacade
            .saveEventTemplate(data)
            .pipe(finalize(() => this._siteEditorService.showSpinner(false)))
            .subscribe(
                (response) => {
                    this.close();
                    this.save.emit(this.eventTemplate);
                },
                (error: ApiException) => {
                    console.log(error);
                    //handling gracefully duplicate errors
                    if (error?.response?.includes(this.l('EventTemplateExistsErrorMessage'))) {
                        abp.message.error(this.l('EventTemplateExistsErrorMessage'), this.l('Error'));
                    } else {
                        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                    }
                }
            );
    }

    private getConvertedEventTemplate(): PostEventTemplate {
        return PostEventTemplate.fromJS({
            ...this.eventTemplate,
            startTime: this.startingTime ? this._dateTimeService.getTime(this.startingTime, true, false) : null,
            endTime: this.endingTime ? this._dateTimeService.getTime(this.endingTime, true, false) : null,
        });
    }

    closeOrShowDiscardWarning(): void {
        if (this.hasPendingChanges()) {
            this.discardModal.show();
        } else {
            this.close();
        }
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    hasPendingChanges(): boolean {
        let isDifferent = false;
        //Compare to validate if changed
        for (let index = 0; index < this.userEditableFields.length; index++) {
            const field = this.userEditableFields[index];
            if (field === 'startTime' || field === 'endTime') {
                //Compares date and time for these fields
                const startTime = this.eventTemplate[field]
                    ? this._dateTimeService.convertTimeSpanToDate(this.eventTemplate[field]).toISOString()
                    : undefined;
                const originalStartTime = this.originalEventTemplate[field]
                    ? this._dateTimeService.convertTimeSpanToDate(this.originalEventTemplate[field]).toISOString()
                    : undefined;

                isDifferent = startTime !== originalStartTime;
            } else {
                //Normal equality comparison
                isDifferent = this.eventTemplate[field] !== this.originalEventTemplate[field];
            }

            if (isDifferent) {
                break;
            }
        }
        return isDifferent;
    }

    discardChanges() {
        this.eventTemplate = { ...this.originalEventTemplate };
        this.closeDiscardChangesModal();
        this.close();
    }

    /**
     * workaround to prevent user to enter more than the max characters
     * credits from https://stackoverflow.com/questions/42803413/how-can-i-set-character-limit-in-quill-editor
     */
    onDescriptionChange(context: any): void {
        if (!context || !context.htmlValue) {
            return;
        }

        let quill = this.editor['valueAccessor']['quill'];

        //Validate max length from description and links in it
        //https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/13167/
        let eventDescription = context.htmlValue;
        if (
            !this._maxDescriptionValidator.isMaxDescriptionLengthValid(eventDescription, this.maxDescriptionLength) ||
            !this._maxDescriptionValidator.isMarkupLengthValid(eventDescription, this.maxMarkupLength)
        ) {
            const delta = quill.clipboard.convert(this.descriptionHolder);
            quill.setContents(delta, 'api');

            //this gives some time to allow user to see the message when reached the max characters and then revert it back
            setTimeout(() => {
                this.eventTemplate.publicWebsiteDescription = this.descriptionHolder;
            }, 2000);
        } else {
            this.descriptionHolder = eventDescription;
        }
    }

    addQuillJsExtensions(): void {
        this._quillExtensions.validateUrl(this.editor, (isValid: boolean) => {
            this.validUrl = isValid;
        });

        this._quillExtensions.onTooltipHide(this.editor, () => {
            this.validUrl = true;
        });
    }
}

import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { Component, Injector, ViewChild, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { OriginalAsset } from '@app/shared/common/apis/generated/content';
import { SiteEditorService } from '@app/site-editor/services';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { SchoolEventsApiClientFacade } from '@shared/service-proxies/school-events-api-client-facade';
import { PostEvents } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { Events } from '@app/shared/common/apis/generated/school-events';
import { Editor } from 'primeng/editor';
import { DescriptionLengthValidatorService } from '@shared/utils/description-length-validator.service';
import { QuilljsExtensionsService } from '@shared/utils/quilljs-extensions.service';
import { EventTemplatesApiClientFacade } from '@shared/service-proxies/event-templates-api-client-facade';
import { EventTemplate } from '@app/shared/common/apis/generated/school-events';
import { OverlayPanel } from 'primeng/overlaypanel';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppConsts } from '@shared/AppConsts';
import { DateTime } from 'luxon';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'edit-event-modal',
    templateUrl: './edit-event-modal.component.html',
    styleUrls: ['./edit-event-modal.component.css'],
})
export class EditEventModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<Events> = new EventEmitter<Events>();
    @ViewChild('EventModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('publicWebSiteDescription') editor: Editor;
    @ViewChild('opIconSelection') opIconSelection: OverlayPanel;
    @ViewChild('requiredWeeklyDayModal', { static: true }) requiredWeeklyDayModal: GoddardConfirmationModalComponent;
    @ViewChild('eventForm') eventForm: NgForm;
    modalType = ModalType;

    // customized config
    datePickerConfig = SiteEditorConstants.DEFAULT_DATEPICKER_CONFIG;
    /*
    solve datepicker issue by adding date pipe to string data type
    https://github.com/valor-software/ngx-bootstrap/issues/4487
    */
    dateFormat = 'MM/dd/yyyy';
    dateTimeFormat = 'short';
    calendarEvent: PostEvents;
    originalCalendarEvent: PostEvents;
    renditions: OriginalAsset[] = [];
    assets: OriginalAsset[] = [];
    recurrencyTypes: { value: string; text: string }[] = [
        { value: '', text: 'None' },
        { value: 'Daily', text: 'Daily' },
        { value: 'Weekly', text: 'Weekly' },
        { value: 'Monthly', text: 'Monthly' },
        { value: 'Yearly', text: 'Yearly' },
    ];
    daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    ordinalNumberOfDay = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    ordinalNumberOfWeek = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    monthSelectList: { value: number; text: string }[] = [
        { value: 1, text: 'January' },
        { value: 2, text: 'February' },
        { value: 3, text: 'March' },
        { value: 4, text: 'April' },
        { value: 5, text: 'May' },
        { value: 6, text: 'June' },
        { value: 7, text: 'July' },
        { value: 8, text: 'August' },
        { value: 9, text: 'September' },
        { value: 10, text: 'October' },
        { value: 11, text: 'November' },
        { value: 12, text: 'December' },
    ];
    defaultEvent = 0;
    //start and end Time fields to bind time values only for the calendar event
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
    after = 'After';
    endBy = 'EndBy';
    everyDay = 'EveryDay';
    everyWeekday = 'EveryWeekday';
    day = 'Day';
    the = 'The';
    on = 'On';
    onThe = 'OnThe';
    daily = 'Daily';
    weekly = 'Weekly';
    Monthly = 'Monthly';
    yearly = 'Yearly';
    descriptionHolder: string; //retain description to validate and prevent user to enter more than the max allowed characters
    validUrl: boolean = true;
    _eventTemplates: EventTemplate[] = [];
    selectedTemplateId: number | undefined;
    get minRecurrencyEndingDate(): Date {
        return this.startingTime;
    }
    get maxDayForYearlyRecurrentEvent(): number | undefined {
        if (
            this.calendarEvent?.recurringParameterPrimary === this.yearly &&
            this.calendarEvent?.recurringParameterSecondary === this.on &&
            this.calendarEvent?.recurringParameterSecond &&
            this.monthSelectList.filter((x) => x.value === +this.calendarEvent?.recurringParameterSecond).length > 0
        ) {
            // Choose a non-leap year (2001 is not divisible by 4, 100 nor 400, and neither of the years on either side will be leap years - 2000 or 2002)
            return DateTime.fromObject({ year: 2001 })
                .set({ month: +this.calendarEvent?.recurringParameterSecond })
                .endOf('month').day;
        }

        const maxDaysInMonth = 31;
        return maxDaysInMonth;
    }
    userEditableFields = [
        'title',
        'isAllDay',
        'iconFileName',
        'publicWebSiteDescription',
        'recurringParameterPrimary',
        'recurringParameterSecondary',
        'recurringParameterFirst',
        'recurringParameterSecond',
        'recurringParameterThird',
        'recurringParameterFourth',
        'recurringParameterRangeType',
        'startDateTime',
        'endDateTime',
        'recurringParameterRangeQualifier',
    ];
    updateEventSeries: boolean = false;
    createCalendarEventTemplate: boolean;
    enabledDates: Date[] = [];
    editorFormatsWhitelist: string[] = ['link'];
    selectedIcon: OriginalAsset = null;
    tooltips = AppConsts.TOOLTIPS;

    minStartTime(): Date {
        //Min start event time
        let now = new Date();
        now.setMinutes(new Date().getMinutes() + 5);
        return now;
    }

    remainingCharacters(): number {
        return this._maxDescriptionValidator.remainingCharacters(
            this.calendarEvent?.publicWebSiteDescription,
            this.maxDescriptionLength
        );
    }

    constructor(
        injector: Injector,
        private _schoolEventsClientFacade: SchoolEventsApiClientFacade,
        private _contentApiClientFacade: ContentApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _maxDescriptionValidator: DescriptionLengthValidatorService,
        private _quillExtensions: QuilljsExtensionsService,
        private _dateUtils: DateTimeService,
        private _eventTemplatesService: EventTemplatesApiClientFacade
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.enabledDates = this._siteEditorService.fillinEnabledDates(SiteEditorConstants.maxEnabledCalendarDates);

        // Setup school business hours
        let schoolBusinessHours =
            this.appSession?.school?.hours && this.appSession?.school?.hours.includes('-')
                ? this.appSession.school.hours
                : this.defaultSchoolBusinessHours;

        this.schoolStartBusinessHour = schoolBusinessHours.split('-')[0].trim();
        this.schoolEndBusinessHour = schoolBusinessHours.split('-')[1].trim();

        // Setup icons
        this.addSubscription(
            this._siteEditorService.currentAssetsSubject.subscribe((assets) => {
                this.setupIcons(assets);
            })
        );

        // Setup calendar event
        this.addSubscription(
            this._siteEditorService.currentEventCalendarSubject.subscribe((calendarEvent) => {
                this.setupCalendarEventModal(calendarEvent);
            })
        );
    }

    private setupCalendarEventModal(calendarEvent: PostEvents) {
        this.setConvertedCalendarEventModalData(calendarEvent);
        this.originalCalendarEvent = PostEvents.fromJS({ ...calendarEvent });

        if (!this.assets) {
            this.getIconsLibrary();
        } else {
            this.setSelectedEventIcon();
            this.open();
        }
        this.addQuillJsExtensions();
        this.createCalendarEventTemplate = false;

        //fetch event templates every time the user add or edit a calendar event
        //could be new or deleted event templates on every try
        this.getEventTemplates();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
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
        this.calendarEvent.iconFileName = rendition ? rendition.href : null;
        this.opIconSelection.hide();
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

    setSelectedEventIcon(): void {
        this.selectedIcon = null;
        //Set the current Select Icon based on the Current Event
        if (this.calendarEvent?.iconFileName) {
            const matchedRendition = this.renditions.filter((rendition: OriginalAsset, index: number) => {
                return this.calendarEvent.iconFileName.toLocaleLowerCase() == rendition.href.toLocaleLowerCase();
            });
            if (matchedRendition.length > 0) {
                this.selectedIcon = matchedRendition[0];
            }
        }
    }

    /** Add or update events
     *
     * Id is null, it will be considered as an Insert
     * Id is not null and SeriesId is null, it will be considered as an Update for that particular record
        SeriesId is not null, it will update all the current and future events which are part of that series.
    */
    saveEvent(): void {
        let calendarEvent = this.getConvertedCalendarEventModalData();

        //show spinner and disable save button until the request finishes
        this._siteEditorService.showSpinner(true);

        //Save the event
        this._schoolEventsClientFacade
            .saveEvent(calendarEvent)
            .pipe(finalize(() => this._siteEditorService.showSpinner(false)))
            .subscribe(
                (response) => {
                    this.onSuccessSavingEvent(calendarEvent);
                },
                (error) => {
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                }
            );
    }

    private onSuccessSavingEvent(calendarEvent: PostEvents) {
        this.close();
        if (!this.createCalendarEventTemplate) {
            this.save.emit({ ...calendarEvent });
            return;
        }

        const startDate = new Date(this.calendarEvent.startDateTime);
        const endDate = new Date(this.calendarEvent.endDateTime);

        let eventTemplate = {
            schoolID: +this.appSession.school.fmsId,
            iconFileName: calendarEvent.iconFileName,
            name: calendarEvent.title,
            publicWebsiteDescription: calendarEvent.publicWebSiteDescription,
        };

        if (!calendarEvent.isAllDay) {
            eventTemplate['startTime'] = {
                hours: startDate.getHours(),
                minutes: startDate.getMinutes(),
            };
            eventTemplate['endTime'] = {
                hours: endDate.getHours(),
                minutes: endDate.getMinutes(),
            };
        }

        this._siteEditorService.setCurrentEventTemplate(eventTemplate);
    }

    private setConvertedCalendarEventModalData(calendarEvent: PostEvents) {
        this.calendarEvent = PostEvents.fromJS({ ...calendarEvent });
        this.startingTime = this._dateUtils.convertUTCToLocalDate(new Date(this.calendarEvent.startDateTime));
        this.endingTime = this._dateUtils.convertUTCToLocalDate(new Date(this.calendarEvent.endDateTime));

        //determine if calendar event is all day based on the school business hours
        const startDate = new Date(this.calendarEvent.startDateTime).toDateString();
        let schoolStartDate = new Date(`${startDate} ${this.schoolStartBusinessHour}`);
        let schoolEndDate = new Date(`${startDate} ${this.schoolEndBusinessHour}`);

        this.calendarEvent.description = this.calendarEvent.publicWebSiteDescription;
        this.calendarEvent.isAllDay =
            this.startingTime.getUTCHours() == schoolStartDate.getUTCHours() &&
            this.startingTime.getUTCMinutes() == schoolStartDate.getUTCMinutes() &&
            this.endingTime.getUTCHours() == schoolEndDate.getUTCHours() &&
            this.endingTime.getUTCMinutes() == schoolEndDate.getUTCMinutes();

        //Wrap not formatted html strings same a quill.js to show the correct remaining characters
        if (!this.calendarEvent?.publicWebSiteDescription?.startsWith('<p>')) {
            this.calendarEvent.publicWebSiteDescription = `<p>${this.calendarEvent?.publicWebSiteDescription}</p>`;
        }

        /**
         * 20220520: https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/15212/
         * convert utc date to local for displaying correct date in the DatePicker
         */
        this.calendarEvent.startDateTime = this._dateUtils
            .convertUTCToLocalDate(new Date(calendarEvent.startDateTime))
            .toISOString();
        this.calendarEvent.endDateTime = this._dateUtils
            .convertUTCToLocalDate(new Date(calendarEvent.endDateTime))
            .toISOString();
        this.descriptionHolder = this.calendarEvent.publicWebSiteDescription;
    }

    /**
     * get a calendarEvent with its fields set to ensure correct format and values
     * only fields that user interacts with to not mess with pending changes validation
     */
    private getConvertedCalendarEventModalData(): PostEvents {
        let calendarEvent = PostEvents.fromJS({ ...this.calendarEvent });
        calendarEvent.description = this.calendarEvent.publicWebSiteDescription;
        calendarEvent.activeFlag = true;
        calendarEvent.eventType = this.defaultEvent;

        if (this.calendarEvent.seriesID) {
            //keep the original recurringParameterRangeStart on update an event from series
            if (this.calendarEvent.id && this.calendarEvent.seriesID) {
                this.calendarEvent.recurringParameterRangeStart =
                    this.originalCalendarEvent.recurringParameterRangeStart;
            }

            //User selects to update single event, so clear up seriesID
            if (!this.updateEventSeries) {
                calendarEvent.seriesID = null;
            }
        }

        const startDate = new Date(calendarEvent.startDateTime).toLocaleDateString();
        if (calendarEvent.isAllDay) {
            calendarEvent.startDateTime = this._dateUtils
                .convertLocalDateToUTC(new Date(`${startDate} ${this.schoolStartBusinessHour}`))
                .toISOString();
            calendarEvent.endDateTime = this._dateUtils
                .convertLocalDateToUTC(new Date(`${startDate} ${this.schoolEndBusinessHour}`))
                .toISOString();
        } else {
            calendarEvent.startDateTime = this._dateUtils
                .convertLocalDateToUTC(
                    new Date(`${startDate} ${this.startingTime.getHours()}:${this.startingTime.getMinutes()}`)
                )
                .toISOString();
            calendarEvent.endDateTime = this._dateUtils
                .convertLocalDateToUTC(
                    new Date(`${startDate} ${this.endingTime.getHours()}:${this.endingTime.getMinutes()}`)
                )
                .toISOString();
        }

        return calendarEvent;
    }

    /**
     * Set default calendar event parameters bases on the selected recurrency type
     */
    onRecurringParameterPrimaryChange(): void {
        //Clear up recurring parameters retaining all other values
        this.calendarEvent = PostEvents.fromJS({
            ...this.calendarEvent,
            recurringParameterSecondary: '',
            recurringParameterFirst: '',
            recurringParameterSecond: '',
            recurringParameterThird: '',
            recurringParameterFourth: '',
            recurringParameterRangeStart: '',
            recurringParameterRangeType: '',
            recurringParameterRangeQualifier: '',
        });

        if (this.calendarEvent.recurringParameterPrimary) {
            this.defaultRecurringCalendarEvent();
        }
    }

    /**
     * Clear up recurring parameters so validation can trigger properly
     */
    onRecurringParameterSecondaryChanged(): void {
        this.calendarEvent = PostEvents.fromJS({
            ...this.calendarEvent,
            recurringParameterSecond: '',
            recurringParameterThird: '',
        });
        switch (this.calendarEvent.recurringParameterPrimary) {
            case this.Monthly:
            case this.daily:
                this.calendarEvent = PostEvents.fromJS({
                    ...this.calendarEvent,
                    recurringParameterFirst: '',
                });
                break;
            case this.yearly:
                this.calendarEvent = PostEvents.fromJS({
                    ...this.calendarEvent,
                    recurringParameterFourth: '',
                });
                break;
        }
    }

    /**
     * set default values based on the recurrency type selected
     */
    private defaultRecurringCalendarEvent() {
        this.calendarEvent.recurringParameterRangeStart = this.calendarEvent.startDateTime;
        this.calendarEvent.recurringParameterRangeType = this.after;
        this.calendarEvent.recurringParameterRangeQualifier = '1';

        if (this.calendarEvent.recurringParameterPrimary === this.daily) {
            this.calendarEvent.recurringParameterSecondary = this.everyDay;
        }
        if (this.calendarEvent.recurringParameterPrimary === this.weekly) {
            this.calendarEvent.recurringParameterFirst = '1';
            this.calendarEvent.recurringParameterSecond = this.daysOfWeek[this.startingTime.getDay()] + ',';
        }
        if (this.calendarEvent.recurringParameterPrimary === this.Monthly) {
            this.calendarEvent.recurringParameterSecondary = this.day;
        }
        if (this.calendarEvent.recurringParameterPrimary === this.yearly) {
            this.calendarEvent.recurringParameterSecondary = this.on;
            this.calendarEvent.recurringParameterFirst = '1';
        }
    }

    /**
     * This is called when:
     * - On a yearly recurring event and we swap between the 'Repeats <On> <month>' or 'Repeats <on the> <week> <day> <month>' recurring event patterns. And sets the value to the ordinal day of week or ordinal month of year.

     * - On a yearly recurring event for the Until patternand we swap between the 'Until <start date> after <x> occurrences'?
     * - On a monthly recurring event ... TODO
     * - On a weekly recurring event...TODO
     *   - Changes validate to select at least 1 day for weekly event
     * - On a daily recurring event...TODO
     * @param day: selected day
     * @param event: click event
     * @returns
     */
    updateRecurringParameterSecond(day: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.checked) {
            if (!this.isWeekDaySelected(day)) {
                this.calendarEvent.recurringParameterSecond += day + ',';
            }
            return;
        }

        /**
         * Remove the day from current selected days and hold the value in a temporary variable to check if at least one day remains selected
         * value could be: 'Monday,' or 'Monday' in case there's only 1, removing both
         */
        const recurringParameter = this.calendarEvent.recurringParameterSecond.replace(day + ',', '').replace(day, '');

        //if no day remains, prevent the change and show warning modal
        if (!this.atLeastOneDaySelectedForWeeklyEvent(recurringParameter)) {
            event.preventDefault();
            this.requiredWeeklyDayModal.show();
            return;
        }

        //Update the selected days
        this.calendarEvent.recurringParameterSecond = recurringParameter;
    }

    isWeekDaySelected(day: string): boolean {
        return this.calendarEvent?.recurringParameterSecond?.includes(day);
    }

    atLeastOneDaySelectedForWeeklyEvent(recurringParameterSecond: string | undefined): boolean {
        return recurringParameterSecond?.length > 0;
    }

    /**
     * Updates the calendar event parameters related to the event starting date
     * @param postingDate selected date for the calendar event
     */
    onPostingDateChange(postingDate: Date): void {
        //keep the original recurringParameterRangeStart on update an event from series
        if (this.calendarEvent?.id && this.calendarEvent?.seriesID) {
            return;
        }

        if (postingDate) {
            if (this.calendarEvent?.recurringParameterPrimary) {
                this.calendarEvent.recurringParameterRangeStart = postingDate.toString();
            }
        }
    }

    /**
     * set start and end time of the event based on the school business hours
     */
    onIsAllDayChange(): void {
        if (this.calendarEvent.isAllDay) {
            const startDate = new Date(this.calendarEvent.startDateTime).toLocaleDateString();
            this.startingTime = new Date(`${startDate} ${this.schoolStartBusinessHour}`);
            this.endingTime = new Date(`${startDate} ${this.schoolEndBusinessHour}`);
        }
    }

    /**
     * clear up recurringParameterRangeQualifier
     */
    onRecurringParameterRangeTypeChange(): void {
        this.calendarEvent.recurringParameterRangeQualifier = undefined;
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
        let calendarEvent = this.getConvertedCalendarEventModalData();
        let isDifferent = false;
        //Compare to validate if changed
        for (let index = 0; index < this.userEditableFields.length; index++) {
            const field = this.userEditableFields[index];
            if (field === 'startDateTime' || field === 'endDateTime') {
                //Compares date and time for these fields
                const startDateTime = calendarEvent[field]
                    ? new Date(calendarEvent[field].toString()).toISOString()
                    : undefined;
                const originalStartDateTime = this.originalCalendarEvent[field]
                    ? new Date(this.originalCalendarEvent[field].toString()).toISOString()
                    : undefined;

                isDifferent = startDateTime !== originalStartDateTime;
            } else if (
                field === 'recurringParameterRangeQualifier' &&
                calendarEvent.recurringParameterRangeType === this.endBy &&
                this.originalCalendarEvent.recurringParameterRangeType === this.endBy
            ) {
                //Compares date only for these fields
                const startDate = calendarEvent[field]
                    ? new Date(calendarEvent[field].toString()).toLocaleDateString()
                    : undefined;
                const originalStartDate = this.originalCalendarEvent[field]
                    ? new Date(this.originalCalendarEvent[field].toString()).toLocaleDateString()
                    : undefined;

                isDifferent = startDate !== originalStartDate;
            } else {
                //Normal equality comparison
                isDifferent = calendarEvent[field] !== this.originalCalendarEvent[field];
            }

            if (isDifferent) {
                break;
            }
        }

        return isDifferent;
    }

    discardChanges() {
        this.calendarEvent = PostEvents.fromJS({ ...this.originalCalendarEvent });
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
        let div = document.createElement('div');
        div.innerHTML = eventDescription;
        if (div.innerText.length > this.maxDescriptionLength) {
            const delta = quill.clipboard.convert(this.descriptionHolder);
            quill.setContents(delta, 'api');

            //this gives some time to allow user to see the message when reached the max characters and then revert it back
            setTimeout(() => {
                this.calendarEvent.publicWebSiteDescription = this.descriptionHolder;
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

    getEventTemplates() {
        this.addSubscription(
            this._eventTemplatesService
                .getEventTemplates(+this.appSession.school.fmsId)
                .pipe(finalize(() => {}))
                .subscribe(
                    (eventTemplates) => {
                        this._eventTemplates = eventTemplates;
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }

    fillEventFromEventTemplate(selectedTemplateId: number | 'undefined'): void {
        let eventCalendar = this.getConvertedCalendarEventModalData();
        if (selectedTemplateId !== 'undefined') {
            const eventTemplate = this._eventTemplates.find((e) => e.id === +selectedTemplateId);
            const calendarEvent = PostEvents.fromJS({
                ...this.calendarEvent,
                title: eventTemplate.name,
                publicWebSiteDescription: eventTemplate.publicWebsiteDescription,
                iconFileName: eventTemplate.iconFileName,
                startDateTime: new Date(eventCalendar.startDateTime),
                endDateTime: new Date(eventCalendar.endDateTime),
                isShownOnPublicWebsite: eventTemplate.showOnPublicWebsite,
            });

            this.setConvertedCalendarEventModalData(calendarEvent);
            this.setSelectedEventIcon();
            return;
        }

        //20220512: #15210 clear out the fields in the event when the default ('Select Template...') option is selected
        if (!this.originalCalendarEvent.id) {
            const defaultStartDate = this._dateUtils.convertLocalDateToUTC(this._dateUtils.getNextHour());
            const defaultEndDate = new Date(defaultStartDate.getTime() + 60 * 60 * 1000);
            const calendarEvent = PostEvents.fromJS({
                ...this.calendarEvent,
                title: '',
                publicWebSiteDescription: '',
                iconFileName: this.renditions?.find((x) =>
                    x.contentPath.includes(SiteEditorConstants.DEFAULT_EVENT_ICON_NAME)
                )?.type,
                startDateTime: defaultStartDate,
                endDateTime: defaultEndDate,
                isShownOnPublicWebsite: false,
            });

            this.setConvertedCalendarEventModalData(calendarEvent);
            this.setSelectedEventIcon();
        }
    }

    onRecurringParameterSecondChanged(month: string): void {
        const maxDay = this.maxDayForYearlyRecurrentEvent;
        if (+this.calendarEvent.recurringParameterThird > maxDay) {
            //set input value so model is also updated
            this.eventForm.form.get('recurringParameterThird').setValue(maxDay.toString());
        }
    }
}

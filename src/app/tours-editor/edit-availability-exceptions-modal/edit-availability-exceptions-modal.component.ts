import {
    TourStatus,
    DateAvailabilityBlockDto,
    DateAvailabilityDto,
    ScheduleDto,
    TourTypesEnum,
    TourTypesEnum1,
} from '../../../shared/service-proxies/service-proxies';
import { DateTime } from 'luxon';
import { Component, Injector, ViewChild, OnInit, AfterViewInit, Input } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ScheduleItemDto, TourItemDto, TourType, AppTourSettingsDto } from '@shared/service-proxies/service-proxies';
import { ToursEditorService } from '@app/tours-editor/services/tours-editor.service';
import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';
import { finalize } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { ToursSettingsApiClientFacade } from '../../../shared/service-proxies/tours-settings-api-client-facade.service';
import { Calendar, CalendarOptions, CalendarApi } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { ModalType } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { GoddardConfirmationModalComponent } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { DateAvailabilityBlockDtoEx } from './date-availability-block-dto-ex';
import { camelCaseToDisplayName, SelectListItem } from '../../../shared/utils/utils';
import { orderBy } from 'lodash';

@Component({
    selector: 'availability-exceptions-modal',
    templateUrl: './edit-availability-exceptions-modal.component.html',
    styleUrls: ['./edit-availability-exceptions-modal.component.css'],
    animations: [appModuleAnimation()],
})
export class EditAvailabilityExceptionsModal extends AppComponentBase implements OnInit {
    @ViewChild('AvailabilityExceptionsModal', { static: true }) modal: ModalDirective;
    @ViewChild('calendar') calendar: FullCalendarComponent;
    @ViewChild('discardChangesModal', { static: true }) discardModal: ModalDirective;
    @ViewChild('overlapWarningModal', { static: true }) private overlapWarningModal: GoddardConfirmationModalComponent;

    @ViewChild('requiredTourTypeModal', { static: true })
    private requiredTourTypeModal: GoddardConfirmationModalComponent;

    @ViewChild('removeTourTypeConfirmModal', { static: true })
    private removeTourTypeConfirmModal: GoddardConfirmationModalComponent;

    @ViewChild('mismatchTourDurationWarningModal', { static: true })
    private mismatchTourDurationWarningModal: GoddardConfirmationModalComponent;

    @ViewChild('deleteBlockConfirmModal', { static: true })
    private deleteBlockConfirmModal: GoddardConfirmationModalComponent;

    @Input() tourSettings: AppTourSettingsDto;

    /**
     * Current block being targeted for a confirm modal
     */
    private currentBlock: DateAvailabilityBlockDto | null = null;

    /**
     * Current input being handled for a confirm modal
     */
    private currentInput: HTMLInputElement | null = null;

    tourTypeOptions: SelectListItem[] = [];
    timeFrames: Array<SelectListItem> = [];
    availability: DateAvailabilityDto;
    modalType = ModalType;
    pendingEvents: boolean = false;
    currentMonth: string;
    currentYear: number;

    /**
     * Returns availability.blocks if loaded otherwise empty array
     */
    get availabilityBlocks(): DateAvailabilityBlockDto[] {
        if (!this.availability) {
            return [];
        }
        return this.availability.blocks;
    }

    private calendarDate: Date = new Date();
    private selectedDate: Date =new Date();
    private pendingDate: Date  = new Date();

    private calendarApi: CalendarApi;
    calendarOptions: CalendarOptions = {
        initialDate: this.calendarDate,
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: false,
        height: 'auto',
        fixedWeekCount: false,
        validRange: {
            start: DateTime.local().startOf('month').toJSDate(),
            end: DateTime.local().plus({ years: 2 }).toJSDate(),
        },
        dateClick: (info) => this.handleDateClick(info),
    };

    public defaultNavMonths = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    private pendingAvailabilities = [];
    private selectors = {
        requiredInput: '.gsi-tour-form__step-input--required',
        calendarId: 'gsiTourFormCalendar',
        calendarSelectedDay: 'gsi-tour-form__calendar-day--selected',
        navPrevMonthButton: '.gsi-tour-form__calendar-nav-button--prev',
        navNextMonthButton: '.gsi-tour-form__calendar-nav-button--next',
        tourList: '.gsi-tour-form__tour-list',
        tourLinks: '.gsi-tour-form__tour-link',
        selectedTourLink: '.gsi-tour-form__tour-link--selected',
        tourListEmptyMessage: '.gsi-tour-form__tour-no-results',
        tourTypeCheckboxes: '.gsi-tour-form__tour-filter-checkbox',
        selectedTourTypeCheckbox: '.gsi-tour-form__tour-filter-checkbox:checked',
        weekendToursMessage: '.gsi-tour-form__weekend-tours-message',
    };
    public schedules: ScheduleDto[] = [];
    public scheduleItems: ScheduleItemDto[] = [];
    public tourItems: TourItemDto[] = [];

    constructor(
        injector: Injector,
        private _toursEditorService: ToursEditorService,
        private _toursService: ToursApiClientFacade,
        private _dateUtils: DateTimeService,
        private _dateTimeService: DateTimeService,
        private _toursSettingsApiClientFacade: ToursSettingsApiClientFacade
    ) {
        super(injector);
        /**
         * fix issue:'Error: Please import the top-level full calendar lib before attempting to import a plugin.'
         * https://stackoverflow.com/a/62769090
         */
        const name = Calendar.name;
    }

    ngOnInit(): void {
        this.timeFrames = this._toursEditorService.getIntervalTimes();
        this.initTourTypeOptions();

        this.addSubscription(
            this._toursEditorService.$canExecuteObservable.subscribe((refresh: boolean) => {
                if (refresh) {
                    this.calendarDate = new Date();
                    this.selectedDate = new Date();
                }
            })
        );
    }

    initTourTypeOptions(): void {
        let types = Object.values(TourType);
        for (let index = 0; index < types.length; index++) {
            this.tourTypeOptions.push({
                text: camelCaseToDisplayName(types[index]).replace(TourType.Online, `Live ${TourType.Online}`),
                value: types[index],
            });
        }
    }

    initSchedules() {
        this.initFullCalendar();
        this.loadDateAvailability();
        this.updateCalendarDayAvailability();
    }

    findSchedules(): void {
        const { startDate, endDate } = this.getMonthStartEndDay(this.calendarApi.getDate());

        this._toursService
            .getSchedules(
                this.appSession.school.crmId,
                DateTimeService._fromJSDate(startDate),
                DateTimeService._fromJSDate(endDate)
            )
            .subscribe((response) => {
                //REFACTOR
                //NOW WE HAVE AN ARRAY OF SCHEDULES AS RESPONSE, ONE ITEM FOR EACH DAY OF THE PERIOD PASSED AS ARGUMENT
                this.schedules = response;
                this.updateCalendarDayAvailability();
            });
    }

    initCountsOfScheduledTours(block: DateAvailabilityBlockDto) {
        const counts: { InPerson: number | string; Online: number | string } = { InPerson: '', Online: '' };

        this.tourItems.forEach((tour) => {
            const isSameTourType = block.tourTypes.includes(TourTypesEnum1[tour.type]);

            const timesOverlap = this._dateTimeService.isOverlappingExclusive(
                block.startTime,
                block.endTime,
                tour.startDateTime,
                tour.endDateTime
            );

            if (isSameTourType && timesOverlap) {
                (counts[tour.type] as number)++;
            }
        });

        return counts;
    }

    tourTypeClicked(event: Event, block: DateAvailabilityBlockDtoEx) {
        const input = event.target as HTMLInputElement;

        if (input.checked) {
            // Adding a new tour type to block

            // Don't need to show any warnings, just add to block's tourTypes
            block.tourTypes.push(TourTypesEnum1[input.value]);
            this.pendingEvents = true;
            return;
        }

        // User is removing tour type from block

        // Check requirements and show warning
        event.preventDefault();

        // Check if block has any tour types remaining
        if (block.tourTypes?.filter((x) => x != TourTypesEnum[input.value]).length === 0) {
            // Block does not have any tour types after filtering the one that is being removed

            // Show required modal
            this.requiredTourTypeModal.show();
            return;
        }

        // Show warning removing of unchecking a tour type to let user confirm or reject the change
        this.currentBlock = block;
        this.currentInput = input;
        this.removeTourTypeConfirmModal.show();
    }

    dayHasAnySchedules(day: Date): boolean {
        const dayToCompare = this._dateTimeService.fromJSDate(day);
        return this.schedules.some((schedule) => {
            const date = schedule.date.setZone('UTC');
            return this.compareDate(date, dayToCompare) && schedule.items.length > 0;
        });
    }

    compareDate(date1: DateTime, date2: DateTime): boolean {
        return date1.hasSame(date2, 'year') && date1.hasSame(date2, 'month') && date1.hasSame(date2, 'day');
    }

    getMonthStartEndDay(inputDate: Date): { startDate: Date; endDate: Date } {
        const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
        const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);
        return { startDate, endDate };
    }

    private updateNavTitle() {
        this.currentMonth = this.defaultNavMonths[this.calendarApi.getDate().getMonth()];
        this.currentYear = this.calendarApi.getDate().getFullYear();
    }

    private initFullCalendar() {
        this.calendarApi = this.calendar.getApi();
        this.modal.onShown.subscribe(() => {
            this.calendarApi.updateSize();
        });
    }

    open() {
        this.initSchedules();
        this.updateCalendarView();
        this.changeCalendarViewByMonthIndex(this.calendarDate.getMonth());
        this.modal.show();
    }

    close() {
        this.modal.hide();
    }

    public prevMonthNav() {
        this.calendarApi.prev();
        const calendarDate = this.calendarApi.getDate();
        this.changeCalendarViewByMonthIndex(calendarDate.getMonth());
    }

    public nextMonthNav() {
        this.calendarApi.next();
        const calendarDate = this.calendarApi.getDate();
        this.changeCalendarViewByMonthIndex(calendarDate.getMonth());
    }

    public changeCalendarViewByMonthIndex(monthIndex: number): void {
        const currentDate = new Date();
        currentDate.setMonth(monthIndex);
        const { startDate, endDate } = this.getMonthStartEndDay(currentDate);

        this.calendarApi.gotoDate(startDate);

        // This changes _calendarDate via setter
        this.updateCalendarView();

        this.initSchedules();
    }

    private updateCalendarView() {
        this.updateNavTitle();
        this.updateSelectedCalendarDay();
    }

    private handleDateClick(info: DateClickArg): void {
        var selectedDate = info.date;
        var todayDate = DateTime.local().startOf('day').toJSDate();
        if ((info.dayEl.classList.contains('gsi-tour-form__calendar-day--month') ||
            info.dayEl.classList.contains('gsi-tour-form__calendar-day--scheduled')) &&
            selectedDate >= todayDate) {
            this.pendingDate = this.selectedDate;
            this.changeSelectedDate(info.date);
            this.loadDateAvailability();
            // this.updateSchedulesWithLocalTimeZone();
        }
    }

    private changeSelectedDate(date: Date): void {
        this.selectedDate = new Date(date);
        this.calendarDate = new Date(date);
        this.updateSelectedCalendarDay();
    }

    private updateSelectedCalendarDay(): void {
        // Remove selected class from previous selected
        const prevSelected = document.querySelector(`.${this.selectors.calendarSelectedDay}`);
        if (prevSelected) {
            prevSelected.classList.remove(this.selectors.calendarSelectedDay);
        }
        // Find day in calendar and add selected class
        const dayEl = document.querySelector(this.getDateElementSelector(this.selectedDate));
        if (dayEl) {
            dayEl.classList.add(this.selectors.calendarSelectedDay);
        }
    }

    private updateCalendarDayAvailability(): void {
        const startDate = this.calendarApi.view.currentStart;
        const endDate = this.calendarApi.view.currentEnd;
        endDate.setSeconds(endDate.getSeconds() - 1);
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();

        for (let i = startDay; i <= endDay; i++) {
            const date = startDate;
            date.setDate(i);
            const daySelector = this.getDateElementSelector(date);
            const el = document.querySelector(daySelector);
            if (!el) {
                return;
            }

            const schoolId = this.appSession.school.crmId;
            const selectedDateTime = this._dateTimeService.fromJSDate(date);
            this._toursSettingsApiClientFacade.getDateAvailability(schoolId, selectedDateTime)
            .subscribe(
                (availability) => {
                    if (availability.blocks.length > 0) {
                        el.classList.add("gsi-tour-form__calendar-day--scheduled");
                    } else {
                        el.classList.add("gsi-tour-form__calendar-day--unscheduled");
                    }
                    el.classList.add("gsi-tour-form__calendar-day--month");
                }
            );
        }
    }

    /**
     * Loads availability from API
     */
    private loadDateAvailability() {
        this.spinnerService.show('availablity-expcetion-modal');
        const schoolId = this.appSession.school.crmId;
        const selectedDateTime = this._dateTimeService.fromJSDate(this.selectedDate);

        const year = this.pendingDate.getFullYear();
        const month = this.pendingDate.getMonth() + 1;
        const day = this.pendingDate.getDate();
        if (this.availability != null) {
            this.pendingAvailabilities = this.pendingAvailabilities.filter((x) => !(x.date.year == year && x.date.month == month && x.date.day == day));
            this.pendingAvailabilities.push(this.availability);
        }

        combineLatest([
            this._toursSettingsApiClientFacade.getDateAvailability(schoolId, selectedDateTime),
            this._toursService.getTours(
                schoolId,
                [TourStatus.Scheduled],
                selectedDateTime.startOf('day'),
                selectedDateTime.endOf('day')
            ),
        ])
            .pipe(finalize(() => this.spinnerService.hide('availablity-expcetion-modal')))
            .subscribe(
                ([availability, tours]) => {
                    // Map blocks to our extended DTO class for add'l functionality
                    availability.blocks = availability.blocks.map(
                        (x) =>
                            new DateAvailabilityBlockDtoEx(x)
                    );
                    const pendingAvailabilities = this.pendingAvailabilities.filter((x) => x.date.year == availability.date.year && x.date.month == availability.date.month && x.date.day == availability.date.day);
                    this.availability = pendingAvailabilities.length > 0? pendingAvailabilities[0] : availability;

                    this.tourItems = tours.items;

                    const dayOptionsWrapper = document.getElementById('gsi-avail-management__day-options');
                    if (availability?.isAllDayBlocked) {
                        dayOptionsWrapper.classList.add('gsi-avail-management__day-options--disabled');
                    } else {
                        dayOptionsWrapper.classList.remove('gsi-avail-management__day-options--disabled');
                    }
                },
                (error): void => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    getDateElementSelector(date: Date): string {
        return this._dateTimeService.getDateElementSelector(date);
    }

    /**
     * Remove tour type accepted
     */
    tourTypeRemoveAccepted(): void {
        // Filter out the tour type that was being removed
        this.currentInput.checked = false;
        this.currentBlock.tourTypes = this.currentBlock.tourTypes.filter((x) => x != this.currentInput.value);

        this.currentBlock = null;
        this.currentInput = null;

        this.pendingEvents = true;
        this.removeTourTypeConfirmModal.hide();
    }

    /**
     * Remove tour type rejected
     */
    tourTypeRemoveRejected(): void {
        this.currentBlock = null;
        this.currentInput = null;
        this.removeTourTypeConfirmModal.hide();
    }

    showDiscardChangesModal(): void {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.close();
        }
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    pendingChanges(): boolean {
        return this.pendingEvents;
    }

    discardChanges() {
        this.pendingEvents = false;
        this.closeDiscardChangesModal();
        this.close();
        this._toursEditorService.execute(true);
    }

    hasAnyAvailabilityBlocksMistmatchDurationTime(): boolean {
        return this.availability.blocks.some(
            (availabilityBlock) =>
                !DateTimeService._isMinuteDifferenceInMultipleOf(
                    availabilityBlock.startTime.toFormat(DateTimeService.TIME_FORMAT_24_HOURS),
                    availabilityBlock.endTime.toFormat(DateTimeService.TIME_FORMAT_24_HOURS),
                    this.tourSettings.defaultTourDuration
                )
        );
    }

    saveAvailabilitiesExceptions(): void {
        this.spinnerService.show('availablity-expcetion-modal');

        if (this.hasAnyAvailabilityBlocksMistmatchDurationTime()) {
            this.spinnerService.hide('availablity-expcetion-modal');
            this.mismatchTourDurationWarningModal.show();
            return;
        }

        const isValid = this.availabilityBlocks.every((block, index, blocks) => {
            if (index == blocks.length - 1) return true; // validate if block is the last block of blocks.

            const tmpBlocks = blocks.slice(index + 1); // rest blocks to cycle through and validate the current selected block.
            //validate if exist overlapping timeslot.
            return tmpBlocks.every((tmpBlock) => {
                let isExistTour = block.tourTypes.some((type) => tmpBlock.tourTypes.includes(type));
                if (isExistTour) {
                    return !this._dateTimeService.isOverlappingExclusive(
                        block.startTime,
                        block.endTime,
                        tmpBlock.startTime,
                        tmpBlock.endTime
                    );
                }
                return true;
            });
        });

        if (!isValid) {
            this.overlapWarningModal.show();
            this.spinnerService.hide('availablity-expcetion-modal');
            return;
        }

        this._toursSettingsApiClientFacade
            .saveDateAvailability(
                this.appSession.school.crmId,
                this._dateTimeService.fromJSDate(this.selectedDate),
                this.availability
            )
            .pipe(
                finalize(() => {
                    this.spinnerService.hide('availablity-expcetion-modal');
                })
            )
            .subscribe(
                (_) => {
                    abp.message
                        .success(this.l('Success_Update_Msg_Real_Time'), this.l('Success_Update_Title'))
                        .then(() => {
                            this.close();
                            this._toursEditorService.execute(true);
                        });
                },
                (error) => abp.message.error(this.l('AnErrorOccurred'), this.l('Error'))
            );
    }

    /**
     * Delete availability block
     */
    deleteBlock(block: DateAvailabilityBlockDto): void {
        this.currentBlock = block;
        this.deleteBlockConfirmModal.show();
    }

    /**
     * Removes availability block on confirmation
     */
    deleteBlockAccepted(): void {
        if (this.currentBlock) {
            const indexToRemove = this.availabilityBlocks.findIndex((x) => x === this.currentBlock);
            if (indexToRemove > -1) {
                this.availability.blocks.splice(indexToRemove, 1);
                this.pendingEvents = true;
            }
            this.currentBlock = null;
        }

        this.deleteBlockConfirmModal.hide();
    }

    /**
     * Delete availability block rejected
     */
    deleteBlockRejected(): void {
        this.currentBlock = null;
        this.deleteBlockConfirmModal.hide();
    }

    addBlock(block?: DateAvailabilityBlockDtoEx): void {
        let newStartTime: DateTime;
        let newEndTime: DateTime;
        let tourTypes: TourTypesEnum1[];

        if (block == null) {
            newStartTime = this._dateTimeService.fromJSDate(this.selectedDate).set({ hour: 9 });
            newEndTime = this._dateTimeService.fromJSDate(this.selectedDate).set({ hour: 17 });
            tourTypes = [TourTypesEnum1.InPerson, TourTypesEnum1.Online];
        } else {
            const latestBlock = orderBy(this.availabilityBlocks, ['endTime'], ['desc'])[0];

            newStartTime = latestBlock.endTime.plus({
                minutes: this.tourSettings.defaultTourDuration,
            });
            newEndTime = newStartTime.plus({
                minutes: this.tourSettings.defaultTourDuration,
            });
            tourTypes = [TourTypesEnum1.InPerson];
        }

        const newBlock = new DateAvailabilityBlockDtoEx({
            startTime: newStartTime,
            endTime: newEndTime,
            tourTypes: tourTypes,
        });

        this.availability.blocks.push(newBlock);
        this.pendingEvents = true;
    }

    /**
     * Returns `true` if can add a block following specified `block`
     * @param block
     * @returns
     */
    canAddBlock(block: DateAvailabilityBlockDtoEx): boolean {

        const newBlock = this.createFollowingBlock(block);

        if (newBlock.endTime.startOf('day') > block.startTime.startOf('day')) {
            // This new block would go into the next day

            return false;
        }

        const overlappingBlockExists = this.availabilityBlocks.some(x =>
            this._dateTimeService.isOverlappingExclusive(newBlock.startTime, newBlock.endTime, x.startTime, x.endTime)
        );

        return !overlappingBlockExists;
    }

    changeStartTime(newTimeAsString: any, block: DateAvailabilityBlockDtoEx): void {
        if (!block.changeStartTime(newTimeAsString, this.tourSettings.defaultTourDuration)) {
            this.mismatchTourDurationWarningModal.show();
        }
        this.pendingEvents = true;
    }
    changeEndTime(newTimeAsString: any, block: DateAvailabilityBlockDtoEx): void {
        if (!block.changeEndTime(newTimeAsString, this.tourSettings.defaultTourDuration)) {
            this.mismatchTourDurationWarningModal.show();
        }
        this.pendingEvents = true;
    }

    blockEntireDay(event: Event) {
        const checkbox = event.target as HTMLInputElement;
        const dayOptionsWrapper = document.getElementById('gsi-avail-management__day-options');

        if (checkbox.checked) {
            dayOptionsWrapper.classList.add('gsi-avail-management__day-options--disabled');
            this.availability.isAllDayBlocked = true;
        } else {
            dayOptionsWrapper.classList.remove('gsi-avail-management__day-options--disabled');
            this.availability.isAllDayBlocked = false;
        }
        this.pendingEvents = true;
    }

    /**
     * Creates a new block with times that follows specified `block` for default tour duration
     * @param block
     * @returns
     */
    private createFollowingBlock(block: DateAvailabilityBlockDtoEx) {

        // Set new start time to end time of previous timeslot
        const newStartTime = block.endTime;

        // Set new end time for default duration
        const newEndTime = newStartTime.plus({
            minutes: this.tourSettings.defaultTourDuration,
        });

        const result = new DateAvailabilityBlockDtoEx({
            startTime: newStartTime,
            // Set new end time to new start time + default duration
            endTime: newEndTime,
            tourTypes: [TourTypesEnum1.InPerson],
        });

        return result;
    }
}

import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import { DateTime } from 'luxon';
import { AfterViewInit, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    AppTourSettingsDto,
    DayOfWeek,
    ScheduleDto,
    ScheduleItemDto,
    TourItemDto,
    TourType,
} from '@shared/service-proxies/service-proxies';
import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';
import { finalize, map, tap } from 'rxjs/operators';
import { CalendarOptions, Calendar, CalendarApi } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { Observable, of } from 'rxjs';
import { ScheduleDtoExt } from './schedule-dto-ex';

export class TimeSlot {
    tourTypes: TourType[];
    startDateTime!: DateTime;
    endDateTime!: DateTime;
}

export class DayTeSlot {
    readonly daysOfWeek = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    timeSlots: TimeSlot[] = [];
    public readonly weekDay: number;
    constructor(
        private _weekDay: DayOfWeek,
        public startTime?: string,
        public endTime?: string,
        public types?: TourType[],
        public defaultTourDuration?: number
    ) {
        this.weekDay = this.daysOfWeek[this._weekDay];
        this.initRangeTime();
        if (!this.defaultTourDuration) {
            // defaultTourDuration was not specified

            // 20230605NJ - FIX #16584: Default to a valid tour duration to avoid
            // infinite loop
            this.defaultTourDuration = ToursEditorConstants.DEFAULT_TOUR_DURATION;
        }
    }

    initRangeTime() {
        let start = DateTime.now().set({ hour: +this.startTime.split(':')[0], minute: +this.startTime.split(':')[1] });
        let end = DateTime.now().set({ hour: +this.endTime.split(':')[0], minute: +this.endTime.split(':')[1] });
        while (start < end) {
            const timeSlot = new TimeSlot();

            timeSlot.tourTypes = this.types;
            timeSlot.startDateTime = start;
            timeSlot.endDateTime = end;

            this.timeSlots.push(timeSlot);

            start = start.plus({ minutes: this.defaultTourDuration ?? ToursEditorConstants.DEFAULT_TOUR_DURATION });
        }
    }
}

@Component({
    selector: 'tour-schedule',
    templateUrl: './tour-schedule.component.html',
    styleUrls: ['./tour-schedule.component.css'],
    animations: [appModuleAnimation()],
})
export class TourScheduleComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild('calendar') calendar: FullCalendarComponent;
    @Input() _tour: TourItemDto;
    @Output() availabilityLoaded: EventEmitter<boolean> = new EventEmitter<any>();
    @Output() dateChanged: EventEmitter<DateTime> = new EventEmitter<any>();
    schedule: ScheduleDtoExt[];
    @Input() _settings: AppTourSettingsDto;

    selectedDate: Date = new Date();
    private tourTimesCache: {} = {};

    private calendarApi: CalendarApi;
    calendarOptions: CalendarOptions = {
        headerToolbar:{
            left:   'prev',
            center: 'title',
            right:  'next'
        },
        initialDate: new Date(),
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        height: 'auto',
        fixedWeekCount: false,
        themeSystem: undefined,
        validRange: {
            start: DateTime.local().plus({ years: -2 }).toJSDate(),
            end: DateTime.local().plus({ years: 2 }).toJSDate(),
        },
        dateClick: (info)=> {
          this.changeSelectedDate(DateTime.fromJSDate(info.date))
        }
    };

    private selectors = {
        requiredInput: '.gsi-tour-form__step-input--required',
        calendarId: 'gsiTourFormCalendar',
        calendarSelectedDay: 'gsi-tour-form__calendar-day--selected',
        navMonthsContainer: '.gsi-tour-form__calendar-months',
        navMonthsList: '.gsi-tour-form__calendar-months-list',
        navMonthLink: '.nav-link',
        navMonthActiveLink: '.nav-link.active',
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

    constructor(
        injector: Injector,
        private _toursService: ToursApiClientFacade,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
        /**
         * fix issue:'Error: Please import the top-level full calendar lib before attempting to import a plugin.'
         * https://stackoverflow.com/a/62769090
         */
        const name = Calendar.name;
    }

    ngOnInit(): void {
        this.getSchoolAvailability();
    }

    ngAfterViewInit(): void {
        this.initFullCalendar();
        this.changeSelectedDate(DateTime.now())
    }

    private getSchoolAvailability() {
        // this._toursService.getSchoolToursAvailabilities(this.appSession.school.crmId).subscribe((result) => {
        //     result.forEach((item) => {
        //         this.tourTimeSlots.push(
        //             new DayTimeSlot(
        //                 item.dayOfWeek,
        //                 item.startTime.toFormat('HH:mm'),
        //                 item.endTime.toFormat('HH:mm'),
        //                 item.tourTypes,
        //                 this._settings.defaultTourDuration
        //             )
        //         );
        //     });
    }

    private initFullCalendar() {
        if (this.calendar instanceof FullCalendarComponent) {
            this.calendarApi = this.calendar.getApi();
            this.calendarApi.updateSize();
        }
    }

    /**
     * Changes displayed schedule to specified date
     * @param date
     * @param clearCache If the Scheduled list cahed should be forced cleared
     */
    public changeSelectedDate(date: DateTime, clearCache:boolean = false): void {
        this.selectedDate = date.toJSDate();
        this.calendarApi.gotoDate(this.selectedDate);
        this.updateSelectedCalendarDay(this.selectedDate);
        this.updateCalendarDayAvailability();
        this.getScheduleAndShowSchedule(date, clearCache);
        this.dateChanged.emit(date);
        setTimeout(()=>{
            // Fix for the error of calendar swinking on opening
            // Waiting for the ngIf to show the container and then updating its size
            this.calendarApi.updateSize();
        },1000)
    }

    private updateSelectedCalendarDay(date: Date): void {
        // Remove selected class from previous selected
        const prevSelected = document.querySelector(`.${this.selectors.calendarSelectedDay}`);
        if (prevSelected) {
            prevSelected.classList.remove(this.selectors.calendarSelectedDay);
        }
        // Find day in calendar and add selected class
        const dayEl = document.querySelector(this.getDateElementSelector(date));
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
            const dayHasTours = true;
            const availableCssClass = dayHasTours
                ? 'gsi-tour-form__calendar-day--available'
                : 'gsi-tour-form__calendar-day--unavailable';
            el.classList.add(availableCssClass);
        }
    }

    getDateElementSelector(date: Date): string {
        return this._dateTimeService.getDateElementSelector(date);
    }

    public getTourTimeString(date: DateTime): string {
        return this._dateTimeService.getTime(date, true, false);
    }

    public getScheduleAndShowSchedule(date: DateTime, clearCache: boolean = true): void {
        if (clearCache) {
            this.clearTourTimesCache();
        }
        const firstDayOfMonth = date.startOf('month');
        const lastDayOfMonth = date.endOf('month');

        this.getScheduleObservable(firstDayOfMonth, lastDayOfMonth).subscribe(
            (schedule) => {
                this.schedule = [...schedule].map((x) => new ScheduleDtoExt(x));
                this.availabilityLoaded.emit(true);

            },
            (error) => {
                this.displayError(error);
                this.availabilityLoaded.emit(false);
            }
        );
    }

    private getScheduleObservable(startDate: DateTime, endDate: DateTime): Observable<ScheduleDto[]> {
        const monthIndex = `${startDate.year}-${startDate.month}`;
        if (!this.tourTimesCache[monthIndex]) {
            return this._toursService.getSchedules(this.appSession.school.crmId, startDate, endDate).pipe(
                tap((response) => {
                    this.tourTimesCache[monthIndex] = response;
                }),
                finalize(() => {
                    this.spinnerService.hide('content');
                })
            );
        } else {
            this.spinnerService.hide('content');
            return of(this.tourTimesCache[monthIndex]);
        }
    }

    scheduleItemHasAttendees(dto: ScheduleItemDto): boolean {
        if (!this.selectedDate) {
            return false;
        }

        return dto.tourTypes.some((x) => x.attendeeCount > 0);
    }

    dateHasConfiguredAvailability(): boolean {
        if (!this.selectedDate || !this.schedule?.length) {
            return false;
        }
        return this.schedule?.some((x) => x.isSelectedOnDate(this.selectedDate));
    }

    calendarMonth(): string {
        return DateTime.fromJSDate(this.selectedDate).toFormat('LLLL, yyyy');
    }

    private clearTourTimesCache(): void {
        this.tourTimesCache = {}; //clear cache
    }

    scheduledItemsForSelectedDate(): ScheduleItemDto[] {
        return this.schedule?.find((x) => x.isSelectedOnDate(this.selectedDate))?.items;
    }
}

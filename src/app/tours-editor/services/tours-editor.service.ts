import { DateTime } from 'luxon';
import { DateTimeService } from './../../shared/common/timing/date-time.service';
import {
    AppTourSettingsDto,
    DaysOfInterest,
    TourGuideDto,
    TourItemDto,
    TourStatus,
    TourType,
} from '@shared/service-proxies/service-proxies';
import { Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { FindToursInput, IFindToursInput } from '../manage-tours/find-tours-input';
import { LeadDto } from './../../../shared/service-proxies/service-proxies';
import { ToursEditorConstants } from './../tours-editor-constants';
import { SelectListItem } from '@shared/utils/utils';
import { FeatureInterestOption } from '@app/shared/common/apis/generated/features';
import { LocalStorageService } from '@shared/utils/local-storage.service';
import { AppSessionService } from '@shared/common/session';
import { AppServiceBase } from '@app/shared/common/services/app-service-base';
import { TourItemDtoExt } from '../model/tour-ext';

@Injectable({
    providedIn: 'root',
})
export class ToursEditorService extends AppServiceBase {
    weekDays: SelectListItem[] = [];
    daysOfInterest: SelectListItem[] = [];
    appSession: AppSessionService;
    _dateTimeService: DateTimeService;
    _localStorageService: LocalStorageService;
    filter : IFindToursInput;

    constructor(injector: Injector) {
        super();
        this.appSession = injector.get(AppSessionService);
        this._dateTimeService = injector.get(DateTimeService);
        this._localStorageService = injector.get(LocalStorageService);
        this.weekDays = this.loadWeekDaysFromDaysOfInterest();
        this.daysOfInterest.concat(this.loadWeekFromDaysOfInterest(this.weekDays));
    }

    public $currentTourSubject = new Subject<TourItemDto>();
    $currentTourObservable = this.$currentTourSubject.asObservable();

    public $currentLeadSubject = new Subject<LeadDto>();
    $currentLeadObservable = this.$currentLeadSubject.asObservable();

    public $currentToursSearchSubject = new Subject<FindToursInput>();
    $currentToursSearchObservable = this.$currentToursSearchSubject.asObservable();

    public $reloadToursSubject = new Subject<boolean>();
    $reloadToursObservable = this.$currentToursSearchSubject.asObservable();

    public $updateInMemoryTourSubject = new Subject<TourItemDto>();
    $updateInMemoryTourObservable = this.$updateInMemoryTourSubject.asObservable();

    /**
     * Returns true if tour is in the past
     */
    isPastDue(tour: TourItemDto) {
        // Return true if tour's scheduled end date time has passed
        return DateTime.now() > this._dateTimeService.toSchoolTimeZoneKeepTime(tour.endDateTime);
    }

    reloadTours(reload: boolean) {
        this.$reloadToursSubject.next(reload);
    }

    setCurrentTour(tour: TourItemDto) {
        this.$currentTourSubject.next(tour);
    }

    updateInMemoryTour(tour: TourItemDto) {
        this.$updateInMemoryTourSubject.next(tour);
    }

    setCurrentToursSearch(filters: FindToursInput) {
        this.$currentToursSearchSubject.next(filters);
    }

    childrenNames(tour: TourItemDto): string {
        return tour.lead?.schoolChildLeads?.map((c) => c.firstName).join('<br/>');
    }

    childrenAges(tour: TourItemDto): string {
        return tour.lead?.schoolChildLeads?.map((c) => this._dateTimeService.getAge(c.dateOfBirth)).join('<br/>');
    }

    setCurrentLead(lead: LeadDto) {
        this.$currentLeadSubject.next(lead);
    }

    loadWeekDaysFromDaysOfInterest(): SelectListItem[] {
        let result: SelectListItem[] = [];
        let daysOfInterest = Object.values(DaysOfInterest);
        for (let index = 0; index < daysOfInterest.length; index++) {
            if (daysOfInterest[index] !== DaysOfInterest.ToBeDetermined) {
                result.push({
                    text: daysOfInterest[index].substring(0, 3),
                    value: daysOfInterest[index],
                });
            }
        }

        return result;
    }

    loadWeekFromDaysOfInterest(result: SelectListItem[] = []): SelectListItem[] {
        if (!result || result.length === 0) {
            result = this.loadWeekDaysFromDaysOfInterest();
        }

        result = result.concat([
            {
                text: ToursEditorConstants.ALL_WEEK,
                value: ToursEditorConstants.ALL_WEEK,
            },
            {
                text: 'TBD',
                value: DaysOfInterest.ToBeDetermined,
            },
        ]);

        return result;
    }

    /**
     * check if dayOfInterest is selected to mark checkbox as checked
     * @param dayOfInterest
     * @returns
     */
    dayOfInterestSelected(dayOfInterest: string, lead: LeadDto): boolean {
        let selected =
            this.allWeekDaysSelected(dayOfInterest, lead) || this.tbdDaysOfInterestSelected(dayOfInterest, lead);

        if (selected) {
            return selected;
        }

        if (dayOfInterest === ToursEditorConstants.ALL_WEEK) {
            selected = this.weekDays.every((x) => this.dayOfInterestAdded(x.value, lead));
        }

        selected = this.dayOfInterestAdded(dayOfInterest, lead);

        return selected;
    }

    /**
     * to check all-week checkbox when all week days are selected
     * @param dayOfInterest
     * @returns
     */
    allWeekDaysSelected(dayOfInterest: string, lead: LeadDto): boolean {
        return (
            dayOfInterest === ToursEditorConstants.ALL_WEEK &&
            this.weekDays.every((x) => this.dayOfInterestAdded(x.value, lead))
        );
    }

    /**
     * to check/uncheck 'ToBeDetermined' checkbox
     * @param dayOfInterest
     * @returns
     */
    tbdDaysOfInterestSelected(dayOfInterest: string, lead: LeadDto): boolean {
        return (
            dayOfInterest.toLowerCase() === DaysOfInterest.ToBeDetermined.toLowerCase() &&
            this.dayOfInterestAdded(DaysOfInterest.ToBeDetermined, lead) &&
            !this.anyWeekDaySelected(lead)
        );
    }

    /**
     * check if any of the week day is already added
     * @returns true if at least one week day has been selected, false if any
     */
    anyWeekDaySelected(lead: LeadDto): boolean {
        let found = false;
        for (let index = 0; index < this.weekDays.length; index++) {
            found = this.dayOfInterestAdded(this.weekDays[index].value, lead);
            if (found) {
                break;
            }
        }
        return found;
    }

    dayOfInterestAdded(dayOfInterest: string, lead: LeadDto): boolean {
        if (!lead?.daysOfInterest) {
            return false;
        }
        let found = false;
        for (let index = 0; index < lead?.daysOfInterest.length; index++) {
            found = lead.daysOfInterest[index].toLowerCase() === dayOfInterest.toLowerCase();
            if (found) {
                break;
            }
        }
        return found;
    }

    /**
     * add all week days from lead.daysOfInterest
     */
    addAllWeekDays(lead: LeadDto) {
        let daysOfInterest = Object.values(DaysOfInterest);
        for (let index = 0; index < daysOfInterest.length; index++) {
            if (daysOfInterest[index] !== DaysOfInterest.ToBeDetermined) {
                this.safeAddSelectedDayOfInterest(daysOfInterest[index], lead);
            }
        }
    }

    /**
     * remove all week days from lead.daysOfInterest
     */
    removeAllWeekDays(lead: LeadDto) {
        let daysOfInterest = Object.values(DaysOfInterest);
        for (let index = 0; index < daysOfInterest.length; index++) {
            if (daysOfInterest[index] !== DaysOfInterest.ToBeDetermined) {
                this.removeDayOfInterest(daysOfInterest[index], lead);
            }
        }
    }

    /**
     * validate and initialize lead's PoIs if it is undefined and
     * adds selected value to the PoIs of the current lead, if is not yet selected
     */
    safeAddSelectedDayOfInterest(value: string, lead: LeadDto) {
        if (!lead?.daysOfInterest) {
            lead.daysOfInterest = [];
        }
        if (this.dayOfInterestAdded(value, lead)) {
            return;
        }

        if (value !== DaysOfInterest.ToBeDetermined) {
            this.removeDayOfInterest(DaysOfInterest.ToBeDetermined, lead);
        }

        lead.daysOfInterest.push(DaysOfInterest[value]);
    }

    removeDayOfInterest(value: string, lead: LeadDto) {
        if (!lead?.daysOfInterest) {
            return;
        }
        lead.daysOfInterest = lead.daysOfInterest.filter((x) => x.toLowerCase() !== value.toLowerCase());
    }

    /**
     * Updates lead.programsOfInterest on PoI checkbox change
     * @param event
     */
    public onProgramOfInterestChanged(
        event: Event,
        lead: LeadDto,
        programsOfInterestOptions: Array<FeatureInterestOption>
    ) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        if (!value) {
            return;
        }

        if (programsOfInterestOptions?.some((x) => x.name.toLowerCase() === value.toLowerCase())) {
            if (input.checked) {
                this.safeAddSelectedProgramToLeadProgramsOfInterest(value, lead);
            } else {
                lead.programsOfInterest = lead.programsOfInterest?.filter(
                    (x) => x.toLowerCase() !== value.toLowerCase()
                );
            }
        }
    }

    /**
     * validate and initialize lead's PoIs if it is undefined and
     * adds selected value to the PoIs of the current lead, if is not yet selected
     */
    private safeAddSelectedProgramToLeadProgramsOfInterest(value: string, lead: LeadDto): void {
        if (!lead.programsOfInterest) {
            lead.programsOfInterest = [];
        }
        if (lead.programsOfInterest.some((x) => x.toLowerCase() === value.toLowerCase())) {
            return;
        }
        lead.programsOfInterest.push(value);
    }

    /**
     * Returns true if lead has program of interest selected
     * @param name
     * @returns
     */
    public isProgramOfInterestSelected(name: string, lead: LeadDto) {
        return lead?.programsOfInterest?.some((x) => x.toLowerCase() === name.toLowerCase());
    }

    // Return the next day from the current school's time at the start of business
    public getTourStartDatetimeForNewTour(): DateTime {
        const result = this._dateTimeService.fromTimeString(this.appSession.schoolStartBusinessHour).plus({ days: 1 });

        return result;
    }

    clearScheduledFilters(): void {
        this.filter = FindToursInput.default(this.appSession.school.crmId, this.filter.statuses[0]);
    }

    getTourStorageKey() {
        return `${this.appSession.school.crmId}.${ToursEditorConstants.TOURS_FILTERS}`;
    }

    getFiltersOrDefault(defaultTourStatus?: TourStatus): IFindToursInput {
        if(!this.filter) {
            // Swallow error if any or if no filter is found in localStorage then return default filter
            this.filter = FindToursInput.default(this.appSession.school.crmId, defaultTourStatus);
        }

        // Transform dates into datetimes
        if (this.filter.startDate) {
            this.filter.startDate = this._dateTimeService.fromISODateString(this.filter.startDate.toString());
        }
        if (this.filter.endDate) {
            this.filter.endDate = this._dateTimeService.fromISODateString(this.filter.endDate.toString());
        }
        if (this.filter.leadStartDate) {
            this.filter.leadStartDate = this._dateTimeService.fromISODateString(this.filter.leadStartDate.toString());
        }
        if (this.filter.leadEndDate) {
            this.filter.leadEndDate = this._dateTimeService.fromISODateString(this.filter.leadEndDate.toString());
        }

        return this.filter;
    }

    setFilter(filter: IFindToursInput) : void {
        this.filter = filter;
    }

    updateLocalStoredTourFilter(filters: IFindToursInput): void {
        if (!filters.schoolId) {
            throw 'School Id Required';
        }

        this.updateFilter(filters);
    }

    updateLocalStoredGridSearch(status: TourStatus, sortField: string, sortOrder: number, page: number) {
        let filter = this.getFiltersOrDefault(status);
        if(sortField) { filter.sortField = sortField };
        filter.sortOrder = sortOrder;
        filter.page = page;
    }

    updateFilter(filters: IFindToursInput): void {
        this.filter = filters;
        this._localStorageService.setItem(
            this.getTourStorageKey(),
            btoa(JSON.stringify(filters)));
    }

    setSchoolTimesForDisplay(filter: IFindToursInput): IFindToursInput {
        let tempFilter = FindToursInput.fromJS(filter);

        if (filter.startDate && filter.endDate) {
            let date = this._dateTimeService.ensureDateTime(filter.endDate);
            if (date.second === 0) {
                date = date.set({ minute: date.minute - 1, second: 59 });
            }

            tempFilter.startDate = filter.startDate;
            tempFilter.endDate = date;
        }
        if (filter.leadStartDate && filter.leadEndDate) {
            tempFilter.leadStartDate = this._dateTimeService.ensureDateTime(filter.leadStartDate);
            tempFilter.leadEndDate = this._dateTimeService.ensureDateTime(filter.leadEndDate);
        }
        return tempFilter;
    }

    /**
     * credits: https://stackoverflow.com/a/36126706
     * Create a list of time frames on the specified interval (12:00, 12:30, etc...). With 30 minutes increments by default.
     */
    getIntervalTimes(intervalInMinutes: number = 30): Array<SelectListItem> {
        let timeFrames: SelectListItem[] = [];
        let tt = 0; // start time
        const ap = ['AM', 'PM']; // AM-PM

        //loop to increment the time and push results in array
        for (let i = 0; tt < 24 * 60; i++) {
            let hh = Math.floor(tt / 60); // getting hours of day in 0-24 format
            let mm = tt % 60; // getting minutes of the hour in 0-55 format
            let ampm = ap[Math.floor(hh / 12)];
            let hours = hh;
            // the hour '0' should be '12'
            if (!hours && ampm === 'PM') {
                hours = 12;
            }

            let value = ('0' + hours).slice(-2) + ':' + ('0' + mm).slice(-2);
            let text = ('0' + (hours === 12 ? hours : hours % 12)).slice(-2) + ':' + ('0' + mm).slice(-2);

            // pushing data in array in [00:00 - 12:00 AM/PM format]
            timeFrames.push({
                value: value,
                text: `${text} ${ampm}`,
            });

            tt = tt + intervalInMinutes;
        }
        return timeFrames;
    }

    /**
     * Creates tour with defaults from settings and tour guides
     * @param settings
     * @param guides
     * @returns
     */
    public createTourWithDefaults(settings: AppTourSettingsDto, guides: TourGuideDto[]): TourItemDtoExt {

        const guide = guides?.find((x) => x.id === settings.defaultTourGuideId);

        const tour = new TourItemDtoExt({
            type: TourType.InPerson,
            status: TourStatus.Scheduled,
            guideId: guide?.id,
        });

        const startDateTime = this.getTourStartDatetimeForNewTour();
        tour.startDateTime = startDateTime;
        tour.endDateTime = startDateTime.plus({ minutes: settings.defaultTourDuration });

        return tour;
    }

    //set default end time if selected endDateTime or is before tourStartDate
    moveEndTimeAfterStartTime(tour: TourItemDto): void {
        if (!tour.endDateTime || tour.endDateTime <= tour.startDateTime) {
            tour.endDateTime = tour.startDateTime.plus({ minutes: ToursEditorConstants.DEFAULT_TOUR_DURATION });
        }
    }
}

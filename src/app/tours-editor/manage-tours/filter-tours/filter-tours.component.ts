import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { camelCaseToDisplayName, SelectListItem, FilterBreadcrumb } from '@shared/utils/utils';
import { combineLatest } from 'rxjs';
import {
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewChildren,
    ElementRef,
    QueryList,
    Input,
} from '@angular/core';
import { DateTime } from 'luxon';
import { FeatureInterestOption } from '@app/shared/common/apis/generated/features';
import { FeaturesApiClientFacade } from '@shared/service-proxies/features-api-client-facade';
import { finalize } from 'rxjs/operators';
import { FindToursInput, IFindToursInput } from '../find-tours-input';
import { TourGuideDto, TourStatus, TourType } from '@shared/service-proxies/service-proxies';
import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';
import { ToursEditorService } from '../../services/tours-editor.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { PopoverDirective } from 'ngx-bootstrap/popover';
@Component({
    selector: 'filter-tours',
    templateUrl: './filter-tours.component.html',
    styleUrls: ['./filter-tours.component.css'],
    animations: [appModuleAnimation()],
})
export class FilterToursComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Input() defaultStatus: TourStatus;
    @ViewChild('tourFilterNameInput', { static: true }) tourFilterNameInput: ElementRef;
    @ViewChildren(PopoverDirective) popovers: QueryList<PopoverDirective>;

    filtering: boolean = false;
    showDatepicker: boolean = false;
    showPreferedDatepicker: boolean = false;
    guides: TourGuideDto[];
    filtersAreDefault: boolean = false;
    _statusList: SelectListItem[] = [];
    _typesList: SelectListItem[] = [];
    _filterBreadcrumbs: FilterBreadcrumb[] = [];
    _defaultFilter: IFindToursInput;
    bsConfig: Partial<BsDatepickerConfig> = Object.assign(
        {},
        {
            containerClass: 'theme-theme7',
            showWeekNumbers: false,
        }
    );
    //to allow reset bsDaterangepicker(s)
    tourRangeDates: string = '';
    preferredRangeDates: string = '';
    programsOfInterest: FeatureInterestOption[];

    constructor (
        injector: Injector,
        public _toursEditorService: ToursEditorService,
        private _toursService: ToursApiClientFacade,
        private _featuresApi: FeaturesApiClientFacade,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.loadTourSettingsFromEnums();
        this.setUpSettings();
        this._defaultFilter = FindToursInput.default(this.appSession.school.crmId, this.defaultStatus);
    }

    ngOnDestroy(): void {}

    loadTourSettingsFromEnums() {
        let status = Object.values(TourStatus);
        for (let index = 0; index < status.length; index++) {
            if (status[index] === 'NoShow') {
                this._statusList.push({ text: camelCaseToDisplayName(status[index]), value: status[index] });
            }
        }

        let types = Object.values(TourType);
        for (let index = 0; index < types.length; index++) {
            this._typesList.push({ text: camelCaseToDisplayName(types[index]).replace(' ','-'), value: types[index] });
        }
    }

    toggleDatepicker(toggle: boolean): void {
        this.showDatepicker = toggle;
        this.showPreferedDatepicker = toggle;
    }

    hideAllPopovers(): void {
        this.popovers.forEach((popover: PopoverDirective) => {
            popover.hide();
        });
    }

    clearFilters(): void {
        const filters = this._toursEditorService.getFiltersOrDefault(this.defaultStatus);
        // get copy of filters
        const old = FindToursInput.fromJS({...filters});
        const defaultFilter = FindToursInput.default(this.appSession.school.crmId, this.defaultStatus);
        this.setFilters(defaultFilter);

        // maintain sort order for filter, only clear out this components filters
        for (const field of ['sortField', 'sortOrder', 'pageSize', 'page']) {
            defaultFilter[field] = old[field];
        }

        this._toursEditorService.setFilter(defaultFilter);
        this.findTours();
    }

    initFiltersState(): void {
        const filters = this._toursEditorService.getFiltersOrDefault(this.defaultStatus);
        this.setFilters(filters);
        this.checkIfDefaultFilters(filters);
        this.createBreadcrumbs(filters);
    }

    setFilters(filters: IFindToursInput): void {
        this.tourRangeDates = '';
        this.preferredRangeDates = '';
        let filter = this._toursEditorService.setSchoolTimesForDisplay(filters);

        if (filter.startDate && filter.endDate) {
            this.tourRangeDates = `${filter.startDate.toFormat(ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)} - ${filter.endDate.toFormat(ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)}`;
        }
        if (filter.leadStartDate && filter.leadEndDate) {
            this.preferredRangeDates = `${filter.leadStartDate.toFormat( ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)} - ${filter.leadEndDate.toFormat(ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)}`;
        }
    }

    tourNameSearch(searchStr: string = ''): void {
        if (searchStr == '') {
            searchStr = this.tourFilterNameInput.nativeElement.value;
        }
        const filters = this._toursEditorService.getFiltersOrDefault();
        filters.leadName = searchStr;
        this.findTours();
    }

    findTours(): void {
        const filters = this._toursEditorService.getFiltersOrDefault(this.defaultStatus);
        this._toursEditorService.setCurrentToursSearch(filters);
        this.checkIfDefaultFilters(filters);
        //Create Breadcrumbs based on the applied filters
        this.createBreadcrumbs(filters);
    }

    /**
     * Check if the current filter equals the default filter
     * @param filters IFindToursInput
     */
    checkIfDefaultFilters(filters: IFindToursInput): void {
        this.filtersAreDefault = JSON.stringify(this._defaultFilter) == JSON.stringify(filters);
    }

    /**
     * Creates a list of breadcrumbs based on the given filter list
     * @param filters IFindToursInput
     */
    createBreadcrumbs(filters: IFindToursInput): void {
        this._filterBreadcrumbs = [];
        if (filters.startDate) {
            this.createDateFilterBreadcrumb(filters.startDate, filters.endDate, 'Date', 'startDate');
        }
        if (filters.leadStartDate) {
            this.createDateFilterBreadcrumb(
                filters.leadStartDate,
                filters.leadEndDate,
                'Preferred Start Date',
                'leadStartDate'
            );
        }
        if (filters.types) {
            this.createArrayBreadcrumb(filters.types, 'types');
        }
        if (filters.guideIds) {
            this.createArrayBreadcrumb(filters.guideIds, 'guideIds');
        }
        if (filters.programsOfInterest) {
            this.createArrayBreadcrumb(filters.programsOfInterest, 'programsOfInterest');
        }
        if (filters.leadName) {
            this.createSingleValueFilterBreadcrumb(filters.leadName, 'leadName');
        }
    }

    /**
     * Creates a date filter breadcrumbs
     * @param startDate
     * @param endDate
     * @param dateName String to be append on the breadcrumb copy
     * @param key appended to the breadcrum in order to send as parameter for a deleted
     */
    createDateFilterBreadcrumb(startDate: DateTime, endDate: DateTime, dateName: string, key: string) {
        if (startDate.isValid && endDate.isValid) {
            // Form a single value string for start and end dates
            const itemValue = `${dateName}: ${startDate.toFormat(
                ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT
            )} - ${endDate.toFormat(ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)}`;
            // Push
            this._filterBreadcrumbs.push({
                key: key,
                value: itemValue,
                displayValue: itemValue,
            });
        }
    }
    /**
     * Creates a guide filter breadcrum
     * @param items List of items of the given property
     * @param key appended to the breadcrum in order to send as parameter for a deleted
     */
    createArrayBreadcrumb(items: string[], key: string) {
        items.forEach((itemY: string, index: number) => {
            const value = items[index];
            let displayValue = items[index];
            if (key == 'guideIds') {
                // If its a guide, we need to get the guides name form the list
                displayValue = this.guides.filter((x) => {
                    return x.id == items[index];
                })[0]?.name;
            } else if (key == 'types') {
                // If its a type, like InPerson we need to add spaces so its readable to the user
                displayValue = camelCaseToDisplayName(displayValue).replace(' ','-')
            }
            this._filterBreadcrumbs.push({
                key: key,
                value: value,
                displayValue: displayValue,
            });
        });
    }

    /**
     * Creates a date filter breadcrum
     * @param itemValue
     * @param key appended to the breadcrum in order to send as parameter for a deleted
     */
    createSingleValueFilterBreadcrumb(itemValue: string, key: string) {
        this._filterBreadcrumbs.push({
            key: key,
            value: itemValue,
            displayValue: itemValue,
        });
    }

    /**
     * Removes a filter options. This ise used byt the breadcrums
     * @param key key of the value type of the FindToursInput
     * @param value value seleted on the breadcrum list
     */
    removeFilterItem(key: string, value: string): void {
        const filters = this._toursEditorService.getFiltersOrDefault(this.defaultStatus);
        if (!Array.isArray(filters[key])) {
            delete filters[key];
            if (key == 'startDate' || key == 'leadStartDate') {
                // filters of the filter is a valid date, need to remove the end date
                const endDateKey: string = key == 'startDate' ? 'endDate' : 'leadEndDate';
                delete filters[endDateKey];
            }

            if (key == 'startDate') {
                this.tourRangeDates = "";
            }

            if (key == 'leadStartDate') {
                this.preferredRangeDates = "";
            }
        } else {
            const index = filters[key].indexOf(value);
            if (index > -1) {
                filters[key].splice(index, 1);
            }
            //If item is left empty, remove so the macthing with the default can work
            if (filters[key].length == 0) {
                delete filters[key];
            }
        }

        //Reset the filters with the new changes
        this.findTours();
    }

    /**
     * set start/end dates on filter model when user changes dates(tour or lead preferred ranges)
     * relying on luxon DateTime class to set DateTime fields instance from the given js Dates.
     * @param $event array of start and end dates from the range date picker
     * @param target target field to assign start-end dates (tour or lead)
     */
    onSelectDateRange($event: Date[] | undefined, target: string = 'tour'): void {
        if (!$event || !$event.length) {
            return;
        }

        let startDate = $event[0];
        let endDate = $event[1];
        const filter = this._toursEditorService.getFiltersOrDefault(this.defaultStatus);
        let start = this._dateTimeService.getStartOfDayForDate(startDate);
        let end = this._dateTimeService.getEndOfDayForDate(endDate);

        if (target === 'tour') {
            filter.startDate = start;
            filter.endDate = end;
            this.tourRangeDates = `${start.toFormat(ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)} - ${end.toFormat(
                ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT
            )}`;
        } else {
            filter.leadStartDate = start;
            filter.leadEndDate = end;
            this.preferredRangeDates = `${start.toFormat(
                ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT
            )} - ${end.toFormat(ToursEditorConstants.DEFAULT_LUXON_DATE_FORMAT)}`;
        }

        this.toggleDatepicker(false);
        this.hideAllPopovers();

        this._toursEditorService.updateFilter(filter);
        this.findTours();
    }

    /**
     * Generic function to handle the on change of a checkbox filter
     * @param event
     * @returns
     */
    onChangeCheckboxFilter(event: Event, valueType: string): void {
        const input = event.target as HTMLInputElement;
        const checkValue = input.value;
        let filters = this._toursEditorService.getFiltersOrDefault(this.defaultStatus)
        if (input.checked) {
            // Sets the current filter with the new checkbox value
            this.safeAddSelectedFilterCheckbox(checkValue, valueType, filters);
        } else {
            filters[valueType] = filters[valueType]?.filter(
                (x) => x.toLowerCase() !== checkValue.toLowerCase()
            );
        }
        this.toggleDatepicker(false);

        this._toursEditorService.updateFilter(filters);
        this.findTours();
    }

    /**
     * Check if filter needs to be added, array created or / and pushed
     * @param event
     */
    private safeAddSelectedFilterCheckbox(value: string, valueType: string, filters: IFindToursInput): void {
        if (!filters[valueType]) {
            filters[valueType] = [];
        }
        if (filters[valueType]?.some((x) => x?.toLowerCase() === value?.toLowerCase())) {
            return;
        }
        filters[valueType]?.push(value);
    }

    /**
     * Returns true if a particular value is selected as filter
     * @param valueType - name of the variable inside the _filterToursInput (programsOfInterest, guideNames, etc)
     * @param value
     * @returns boolean
     */
    public isFilterOptionsSelected(value: string, valueType: string): boolean {
        const result: boolean = this._toursEditorService.filter[valueType]?.some((x) => x.toLowerCase() == value.toLowerCase());
        return result;
    }

    setUpSettings(): void {
        this.addSubscription(
            combineLatest([
                this._toursService.getSchoolGuides(this.appSession.school.crmId),
                this._featuresApi.getSchoolLeadProgramInterestOptions(this.appSession.school.crmId),
            ])
                .pipe(finalize(() => this.spinnerService.hide('tours-table')))
                .subscribe(
                    ([guides, options]) => {
                        this.filtering = true;
                        this.programsOfInterest = options;
                        this.guides = guides;
                        this.initFiltersState();
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }
}

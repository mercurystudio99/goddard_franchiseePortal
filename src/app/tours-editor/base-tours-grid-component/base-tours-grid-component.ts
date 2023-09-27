import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Angulartics2 } from 'angulartics2';
import { DateTime } from 'luxon';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize, map } from 'rxjs/operators';
import { AppAnalyticsService } from '../../../shared/common/analytics/app-analytics.service';
import { LeadDto, TourItemDto, TourStatus, TourType } from '../../../shared/service-proxies/service-proxies';
import { ToursApiClientFacade } from '../../../shared/service-proxies/tours-api-client-facade.service';
import { camelCaseToDisplayName } from '../../../shared/utils/utils';
import { DateTimeService } from '../../shared/common/timing/date-time.service';
import { EditLeadModalComponent } from '../edit-lead-modal/edit-lead-modal.component';
import { EditToursModalComponent } from '../edit-tours-modal/edit-tours-modal.component';
import { IFindToursInput } from '../manage-tours/find-tours-input';
import { ToursEditorService } from '../services/tours-editor.service';
import { ToursEditorConstants } from '../tours-editor-constants';
import { ToursSettingsApiClientFacade } from '@shared/service-proxies/tours-settings-api-client-facade.service';
import { Table } from 'primeng/table';

@Component({
    template: '',
})
export abstract class BaseToursGridComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('editToursModal', { static: true }) editToursModal: EditToursModalComponent;
    @ViewChild('editLeadModal', { static: true }) editLeadModal: EditLeadModalComponent;
    @ViewChild('newLeadSuccessModal', { static: true }) newLeadSuccessModal: ModalDirective;
    @ViewChild('dataTable', { static: false }) private toursTable: Table;

    tours: TourItemDto[] = [];
    toursCount: number = 0;
    maxToursPerPage: number = ToursEditorConstants.MAX_TOURS_PER_PAGE;
    lead: LeadDto;
    filtersAreDefault: boolean = false;
    _defaultfilters: IFindToursInput;
    _defaultStatus: TourStatus;
    filterTooltip = '';
    NOT_YET_IMPLEMENTED: string = ToursEditorConstants.NOT_YET_IMPLEMENTED;

    constructor(
        injector: Injector,
        protected _angulartics2: Angulartics2,
        protected _toursEditorService: ToursEditorService,
        protected _toursService: ToursApiClientFacade,
        protected _dateTimeService: DateTimeService,
        protected _toursSettingsApiClientFacade: ToursSettingsApiClientFacade,
        protected _toursApi: ToursApiClientFacade
    ) {
        super(injector);
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
        this._toursEditorService.clearScheduledFilters();
    }

    loadTours(tourStatus: TourStatus[] | null = null): void {
        const filters = this._toursEditorService.getFiltersOrDefault(this._defaultStatus);
        if (tourStatus !== null) {
            filters.statuses = tourStatus;
        }
        this.findTours(filters);
    }

    getTourType(type: TourType) {
        return camelCaseToDisplayName(type).replace(' ', '-');
    }

    getTourDateTime(tdate: DateTime): string {
        //replace last 'm' from am/pm
        return tdate.toFormat('M/d h:mma').toLowerCase().replace('m', '');
    }

    childrenNames(tour: TourItemDto): string {
        return this._toursEditorService.childrenNames(tour);
    }

    childrenAges(tour: TourItemDto): string {
        return this._toursEditorService.childrenAges(tour);
    }

    openModal(id: string | undefined): void {
        if (id === this.NOT_YET_IMPLEMENTED) {
            this.displayInfo(this.l(this.NOT_YET_IMPLEMENTED));
            return;
        }

        let tour = TourItemDto.fromJS({ schoolTimeZone: this.appSession.school.timeZone });
        if (id) {
            tour = TourItemDto.fromJS({ ...this.tours.find((x) => x.id === id) });
        }
        this._toursEditorService.setCurrentTour(tour);
    }

    isViewedOrPastDue(tour: TourItemDto): boolean {
        return tour.viewed != null || this._toursEditorService.isPastDue(tour);
    }

    onSaveLead(lead: LeadDto): void {
        this.lead = lead;
        this.newLeadSuccessModal.show();
    }

    openNewLeadModal(): void {
        this.editLeadModal.initDefaultLeadAndOpenModal();
    }

    clearLeadsSearchAndOpenModal(id: string | undefined) {
        this.editToursModal.lastSearchQuery = undefined;
        this.openModal(id);
    }

    findTours(
        findToursInput: IFindToursInput
    ): void {
        if (this._defaultStatus) {
            this.spinnerService.show('tours-table');
            const sorting = findToursInput.getTransformedSortingField(this._defaultStatus);
            this.addSubscription (
                this._toursApi
                    .getTours (
                        findToursInput.schoolId,
                        findToursInput.statuses,
                        findToursInput.startDate,
                        findToursInput.endDate,
                        findToursInput.types,
                        findToursInput.guideIds,
                        findToursInput.leadName,
                        findToursInput.childAge,
                        findToursInput.leadStartDate,
                        findToursInput.leadEndDate,
                        findToursInput.programsOfInterest,
                        findToursInput.page,
                        findToursInput.pageSize,
                        sorting)
                    .pipe(
                        finalize(() => this.spinnerService.hide('tours-table'))
                    )
                    .subscribe((response) => {
                        this.tours = response.items;
                        this.toursCount = response.totalCount;
                        // Filter are the same as the default options
                        this.filtersAreDefault = JSON.stringify(this._defaultfilters) == JSON.stringify(findToursInput);
                        // If new data is reset, set first item to avoid pagination mismatch
                        if (this.toursTable && findToursInput.page == 1) {
                            this.toursTable.first = 1;
                        }
                    }, this.displayError)
            );
        }
    }

    onSaveSuccess(action: string, toursStatusOnSavingReload: TourStatus | null = null): void {
        // analytics
        this._angulartics2.eventTrack.next({
            action: action,
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this.appSession.school?.advertisingName,
            },
        });
        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            let reloadTours = toursStatusOnSavingReload != TourStatus.Completed;
            if (reloadTours) {
                //Do not relod to default if tours is completed
                this.loadTours([toursStatusOnSavingReload]);
            }
        });
    }
}

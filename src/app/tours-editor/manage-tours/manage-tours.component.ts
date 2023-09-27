import { DateTime } from 'luxon';
import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { finalize } from 'rxjs/operators';
import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { ToursEditorService } from '../services/tours-editor.service';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import {
    AppTourSettingsDto,
    LeadDto,
    TourGuideDto,
    TourItemDto,
    TourStatus,
    TourType,
} from '@shared/service-proxies/service-proxies';
import { FindToursInput, IFindToursInput } from './find-tours-input';
import { EditLeadModalComponent } from '../edit-lead-modal/edit-lead-modal.component';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { EditToursModalComponent } from '../edit-tours-modal/edit-tours-modal.component';
import { camelCaseToDisplayName } from '@shared/utils/utils';
import { ToursSettingsApiClientFacade } from '@shared/service-proxies/tours-settings-api-client-facade.service';
import { combineLatest } from 'rxjs';
import { BaseToursGridComponent } from '../base-tours-grid-component/base-tours-grid-component';
import { LazyLoadEvent } from 'primeng/api';
@Component({
    selector: 'app-manage-tours',
    templateUrl: './manage-tours.component.html',
    styleUrls: ['./manage-tours.component.css'],
})
export class ManageToursComponent extends BaseToursGridComponent implements OnInit, OnDestroy {
    @ViewChild('editLeadModal', { static: true }) editLeadModal: EditLeadModalComponent;
    @ViewChild('newLeadSuccessModal', { static: true }) newLeadSuccessModal: ModalDirective;
    @ViewChild('editToursModal', { static: true }) editToursModal: EditToursModalComponent;

    tours: TourItemDto[] = [];
    lead: LeadDto | undefined;
    filtersAreDefault: boolean = false;
    NOT_YET_IMPLEMENTED: string = ToursEditorConstants.NOT_YET_IMPLEMENTED;
    filterTooltip = '';
    guides: TourGuideDto[];
    _currentSortOrder: string = null;
    private _settings: any;

    constructor(
        injector: Injector,
        _angulartics2: Angulartics2,
        _toursEditorService: ToursEditorService,
        _toursService: ToursApiClientFacade,
        _dateTimeService: DateTimeService,
        _toursSettingsApiClientFacade: ToursSettingsApiClientFacade,
        _toursApi: ToursApiClientFacade
    ) {
        super(
            injector,
            _angulartics2,
            _toursEditorService,
            _toursService,
            _dateTimeService,
            _toursSettingsApiClientFacade,
            _toursApi
        );
    }

    ngOnInit(): void {
        this._defaultfilters = FindToursInput.default(this.appSession.school.crmId, TourStatus.Scheduled);
        this._defaultStatus = TourStatus.Scheduled;
        this.addSubscription(
            this._toursEditorService.$reloadToursSubject.subscribe((reload) => {
                if (reload) {
                    this.loadScheduledTours();
                }
            })
        );

        this.addSubscription(
            this._toursEditorService.$currentToursSearchSubject.subscribe((filters) => {
                if (filters.statuses[0] == this._defaultStatus) {
                    // Only trigger if tour status matched the default for the screen (Scheduled / Completed)
                    this.loadScheduledTours();
                }
            })
        );

        this.addSubscription(
            this._toursEditorService.$updateInMemoryTourSubject.subscribe((tour) => {
                let updatedTour = this.tours.find((x) => x.id === tour.id);
                let index = this.tours.indexOf(updatedTour);
                this.tours[index] = TourItemDto.fromJS({ ...tour });
            })
        );

        this.loadToursSettings();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    onLazyLoadScheduledTours(event: LazyLoadEvent) {
        const page =  event.first / this.maxToursPerPage + 1;
        const filters = this._toursEditorService.getFiltersOrDefault(TourStatus.Scheduled);
        filters.sortField = event.sortField;
        filters.sortOrder = event.sortOrder,
        filters.page = page;

        this.loadScheduledTours();
    }

    loadScheduledTours(): void {
        const filters = this._toursEditorService.getFiltersOrDefault(TourStatus.Scheduled);
        this.findTours(filters);
    }

    openModal(id: string | undefined): void {
        if (id === this.NOT_YET_IMPLEMENTED) {
            this.displayInfo(this.l(this.NOT_YET_IMPLEMENTED));
            return;
        }

        let tour = TourItemDto.fromJS({ });
        if (id) {
            tour = TourItemDto.fromJS({ ...this.tours.find((x) => x.id === id) });
        }
        this._toursEditorService.setCurrentTour(tour);
    }

    clearLeadsSearchAndOpenModal(id: string | undefined) {
        this.editToursModal.lastSearchQuery = undefined;
        this.openModal(id);
    }

    openNewLeadModal(): void {
        this.editLeadModal.initDefaultLeadAndOpenModal();
    }

    childrenNames(tour: TourItemDto): string {
        return this._toursEditorService.childrenNames(tour);
    }

    childrenAges(tour: TourItemDto): string {
        return this._toursEditorService.childrenAges(tour);
    }

    getTourType(type: TourType) {
        return camelCaseToDisplayName(type);
    }

    getTourDateTime(date: DateTime): string {
        //replace last 'm' from am/pm
        return date.toFormat('M/d/yy - h:mma').toLowerCase().replace('m', '');
    }

    isViewedOrPastDue(tour: TourItemDto): boolean {
        return tour.viewed != null || this._toursEditorService.isPastDue(tour);
    }

    tourIndicatorClass(tour: TourItemDto): string {
        let indicatorClass: string = '';

        if (!tour.viewed) {
            indicatorClass = 'gsi-new-tour';
        } else if (this._toursEditorService.isPastDue(tour)) {
            indicatorClass = 'gsi-past-tour';
        }

        return indicatorClass;
    }

    onSaveTour(isSuccess: boolean): void {
        this.onSaveSuccess('Save Tour');
    }

    onSaveLead(lead: LeadDto): void {
        this.lead = lead;
        //this.onSaveSuccess('Save Lead');
        this.newLeadSuccessModal.show();
    }

    closeLeadSuccessModal(): void {
        this.lead = undefined;
        this.newLeadSuccessModal.hide();
    }

    onSaveSuccess(action: string): void {
        // analytics
        this._angulartics2.eventTrack.next({
            action: action,
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this.appSession.school?.advertisingName,
            },
        });

        abp.message.success(this.l('Success_Update_Msg_Real_Time'), this.l('Success_Update_Title')).then(() => {
            this.loadScheduledTours();
        });
    }

    displayNotYetImplemented(): void {
        this.displayInfo(this.l(this.NOT_YET_IMPLEMENTED));
    }

    editLead(): void {
        let lead = LeadDto.fromJS(this.lead);
        this.closeLeadSuccessModal();
        this._toursEditorService.setCurrentLead(lead);
    }

    addTour(): void {
        // initialize default tour
        let tour = TourItemDto.fromJS({
            ...this._toursEditorService.createTourWithDefaults(this._settings, this.guides),
            lead: LeadDto.fromJS(this.lead),
        });
        this.closeLeadSuccessModal();
        this._toursEditorService.setCurrentTour(tour);
    }

    private loadToursSettings() {
        this.addSubscription(
            combineLatest([
                this._toursApi.getSchoolGuides(this.appSession.school.crmId),
                this._toursSettingsApiClientFacade.getTourSettings(this.appSession.school.crmId),
            ])
                .pipe(finalize(() => this.spinnerService.hide('content')))
                .subscribe(
                    ([guides, settings]) => {
                        this.guides = guides;
                        this._settings = AppTourSettingsDto.fromJS(settings);
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }
}

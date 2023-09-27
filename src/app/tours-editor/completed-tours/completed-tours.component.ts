import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { DateTime } from 'luxon';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { LeadDto, TourItemDto, TourStatus } from '../../../shared/service-proxies/service-proxies';
import { ToursApiClientFacade } from '../../../shared/service-proxies/tours-api-client-facade.service';
import { DateTimeService } from '../../shared/common/timing/date-time.service';
import { BaseToursGridComponent } from '../base-tours-grid-component/base-tours-grid-component';
import { EditLeadModalComponent } from '../edit-lead-modal/edit-lead-modal.component';
import { EditToursModalComponent } from '../edit-tours-modal/edit-tours-modal.component';
import { ToursEditorService } from '../services/tours-editor.service';
import { ToursEditorConstants } from '../tours-editor-constants';
import { FindToursInput, IFindToursInput } from '../manage-tours/find-tours-input';
import { ToursSettingsApiClientFacade } from '@shared/service-proxies/tours-settings-api-client-facade.service';
import { LazyLoadEvent } from 'primeng/api';
@Component({
    selector: 'app-completed-tours',
    templateUrl: './completed-tours.component.html',
    styleUrls: ['./completed-tours.component.css'],
})
export class CompletedToursComponent extends BaseToursGridComponent implements OnInit, OnDestroy {
    @ViewChild('editToursModal', { static: true }) editToursModal: EditToursModalComponent;
    @ViewChild('editLeadModal', { static: true }) editLeadModal: EditLeadModalComponent;
    @ViewChild('newLeadSuccessModal', { static: true }) newLeadSuccessModal: ModalDirective;
    NOT_YET_IMPLEMENTED: string = ToursEditorConstants.NOT_YET_IMPLEMENTED;
    tours: TourItemDto[] = [];
    lead: LeadDto;
    filtersAreDefault: boolean = false;
    filterTooltip = '';
    _currentSortOrder: string = undefined; // null will get rejected by service proxy

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
        this._defaultfilters = FindToursInput.default(this.appSession.school.crmId, TourStatus.Completed);
        this._defaultStatus = TourStatus.Completed;

        this.addSubscription (
            this._toursEditorService.$currentToursSearchSubject.subscribe((filters) => {
                if (filters.statuses[0] == this._defaultStatus) {
                    // Only trigger if tour status matched the default for the screen (Scheduled / Completed)
                    this.findTours(filters);
                }
            })
        );

        //this.loadCompletedTours();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    onLazyLoadCompletedTours(event: LazyLoadEvent) {
        const page =  event.first / this.maxToursPerPage + 1;
 
        this._toursEditorService.updateLocalStoredGridSearch(
            TourStatus.Completed,
            event.sortField,
            event.sortOrder,
            page);

        this.loadCompletedTours();
    }

    loadCompletedTours(): void {
        const filters = this._toursEditorService.getFiltersOrDefault(TourStatus.Completed);
        this.findTours(filters);
    }

    getTourDateTime(date: DateTime): string {
        //replace last 'm' from am/pm
        return date.toFormat('M/d/yy - h:mma').toLowerCase().replace('m', '');
    }

    onSaveTour(isSuccess: boolean): void {
        this.onSaveSuccess('Save Tour', TourStatus.Completed);
    }
}

import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import {
    ApiV1SchoolLeadsInternalPostRequest,
    ChildLead,
    LeadDto,
} from '../../../shared/service-proxies/service-proxies';
import { Component, Injector, ViewChild, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { ToursEditorService } from '../services/tours-editor.service';
import { LeadsApiClientFacade } from '@shared/service-proxies/leads-api-client-facade.service';
import { FeaturesApiClientFacade } from '@shared/service-proxies/features-api-client-facade';
import { FeatureInterestOption } from '@app/shared/common/apis/generated/features';
import { SelectListItem } from '@shared/utils/utils';
import { NgForm } from '@angular/forms';
import { ContactPreference } from '../enums';
import { ModalType } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { GoddardConfirmationModalComponent } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'edit-lead-modal',
    templateUrl: './edit-lead-modal.component.html',
    styleUrls: ['./edit-lead-modal.component.css'],
    animations: [appModuleAnimation()],
})
export class EditLeadModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<LeadDto> = new EventEmitter<LeadDto>();
    @Output() back: EventEmitter<Boolean> = new EventEmitter();
    @ViewChild('EditLeadModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('leadForm', { static: true }) leadForm: NgForm;

    lead: LeadDto;
    originalLead: LeadDto;
    maxDateOfBirth = new Date();
    dateFormat: string = ToursEditorConstants.DATE_FORMAT;
    bsDateConfig: { dateInputFormat: 'MM/DD/YYYY' };
    contactPreference = ContactPreference;
    modalType = ModalType;

    /**
     * Current available program of interest options + any add'l options that were part of lead record
     * but no longer in current options
     */
    leadProgramOfInterestOptions: Array<FeatureInterestOption>;

    /**
     * Current available program of interest options
     */
    programsOfInterestOptions: Array<FeatureInterestOption>;
    allWeek: string = ToursEditorConstants.ALL_WEEK;
    weekDays: SelectListItem[] = [];
    daysOfInterest: SelectListItem[] = [];

    constructor(
        injector: Injector,
        private _toursEditorService: ToursEditorService,
        private _leadsEditorService: LeadsApiClientFacade,
        private _featuresApi: FeaturesApiClientFacade
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.addSubscription(
            this._toursEditorService.$currentLeadSubject.subscribe((lead) => {
                this.lead = lead;
                this.setOriginalModalData();
                this.open();
            })
        );
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    saveLead(): void {
        this.leadForm.form.markAllAsTouched();
        if (!this.leadForm.form.valid) {
            return;
        }

        const body = this.getLeadModelData();

        this.spinnerService.show();
        this._leadsEditorService
            .createLead(body)
            .pipe(
                finalize(() => {
                    this.spinnerService.hide();
                })
            )
            .subscribe(
                (lead) => {
                    this.close();
                    this.save.emit(lead);
                },
                (error) => {
                    this.displayErrorSaving(error);
                }
            );
    }

    private getLeadModelData() {
        let body = ApiV1SchoolLeadsInternalPostRequest.fromJS({
            ...this.lead,
        });
        for (let index = 1; index <= body.schoolChildLeads.length; index++) {
            if (!body.schoolChildLeads[index - 1]?.firstName) {
                body.schoolChildLeads[index - 1].firstName = `Child ${index}`;
            }
        }

        return body;
    }

    open() {
        this.loadLeadSettings();
        this.leadForm.reset();
        this.modal.show();
    }

    close() {
        this.modal.hide();
    }

    // Return to lead search
    backToLeadSearch() {
        this.close();
        this.back.emit(true);
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
        return JSON.stringify(this.lead) !== JSON.stringify(this.originalLead);
    }

    discardChanges() {
        this.closeDiscardChangesModal();
        this.close();
    }

    /**
     * Returns true if lead has program of interest selected
     * @param name
     * @returns
     */
    public isProgramOfInterestSelected(name: string) {
        return this._toursEditorService.isProgramOfInterestSelected(name, this.lead);
    }

    /**
     * Loads program of interest options for current lead
     */
    private loadLeadProgramOfInterestOptions() {
        // Append any PoIs that were on lead record but may have been removed from
        // current available options

        // Find missing PoIs
        const missing = this.lead?.programsOfInterest?.filter((x) => {
            const result = !this.programsOfInterestOptions?.some((y) => y.name.toLowerCase() == x.toLowerCase());
            return result;
        });

        // Map PoIs to option type
        const missingOptions = missing?.map((name) => {
            return {
                name,
                displayName: name,
            };
        });

        // Append missing options to current options
        this.leadProgramOfInterestOptions = this.programsOfInterestOptions?.concat(
            missingOptions?.length ? missingOptions : []
        );
    }

    private loadLeadSettings() {
        this.daysOfInterest = this._toursEditorService.loadWeekFromDaysOfInterest();
        if (this.programsOfInterestOptions == null) {
            this.addSubscription(
                this._featuresApi.getSchoolLeadProgramInterestOptions(this.appSession.school.crmId).subscribe((options) => {
                    this.programsOfInterestOptions = options;
                    this.loadLeadProgramOfInterestOptions();
                })
            );    
        }
    }

    initDefaultLeadAndOpenModal() {
        this.lead = LeadDto.fromJS({
            schoolId: this.appSession.school.fmsId,
            referredBy: 'Internet',
        });
        this.addChild();
        this.setOriginalModalData();
        this.open();
    }

    private setOriginalModalData() {
        this.originalLead = LeadDto.fromJS({ ...this.lead });
    }

    public addChild(): void {
        if (!this.lead.schoolChildLeads) {
            this.lead.schoolChildLeads = [];
        }
        this.lead.schoolChildLeads.push(
            ChildLead.fromJS({
                lastName: this.lead.lastName,
            })
        );
    }

    public removeChild(i: number): void {
        this.lead.schoolChildLeads.splice(i, 1);
    }

    trackSchoolChildLeadsFn(index: any, child: any) {
        return index;
    }

    /**
     * check if dayOfInterest is selected to mark checkbox as checked
     * @param dayOfInterest
     * @returns
     */
    dayOfInterestSelected(dayOfInterest: string): boolean {
        return this._toursEditorService.dayOfInterestSelected(dayOfInterest, this.lead);
    }

    onLastNameChanged(): void {
        if (!this.lead.schoolChildLeads) {
            return;
        }
        for (let index = 0; index < this.lead.schoolChildLeads.length; index++) {
            this.lead.schoolChildLeads[index].lastName = this.lead.lastName;
        }
    }

    displayErrorSaving(error): void {
        console.error(error);
        this.spinnerService.hide('content');
        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
    }
}

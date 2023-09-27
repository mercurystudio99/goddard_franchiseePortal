import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AutoComplete } from 'primeng/autocomplete';
import { camelCaseToDisplayName, SelectListItem } from '@shared/utils/utils';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { CompleteTourOption, CurrentTourEditAction } from '../enums';
import { Component, EventEmitter, Injector, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ContactPreference } from '../enums';
import { DateTime } from 'luxon';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { ElementRef } from '@angular/core';
import { environment } from 'environments/environment';
import { FeatureInterestOption } from '@app/shared/common/apis/generated/features';
import { FeaturesApiClientFacade } from '@shared/service-proxies/features-api-client-facade';
import { finalize, map } from 'rxjs/operators';
import { GoddardConfirmationModalComponent } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { groupBy as _groupBy } from 'lodash-es';
import { LeadsApiClientFacade } from '@shared/service-proxies/leads-api-client-facade.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ModalType } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { NgForm } from '@angular/forms';
import { ScheduledToursTimeSlot } from './scheduled-tours-time-slot';
import { TourItemDtoExt } from '../model/tour-ext';
import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';
import { TourScheduleComponent } from '../tour-schedule/tour-schedule.component';
import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import { ToursEditorService } from '../services/tours-editor.service';
import { ToursSettingsApiClientFacade } from '@shared/service-proxies/tours-settings-api-client-facade.service';
import {
    AppTourSettingsDto,
    PagedResultDtoOfTourItemDto,
    LeadFindDto,
    TourItemDto,
} from '@shared/service-proxies/service-proxies';
import {
    CreateLeadInput,
    CreateTourInput,
    DaysOfInterest,
    FollowUpTimeFrame,
    LeadDto,
    ScheduleItemDto,
    TourGuideDto,
    TourStatus,
    TourType,
    UpdateLeadInput,
    UpdateTourInput,
} from './../../../shared/service-proxies/service-proxies';

@Component({
    selector: 'edit-tours-modal',
    templateUrl: './edit-tours-modal.component.html',
    styleUrls: ['./edit-tours-modal.component.css'],
    animations: [appModuleAnimation()],
})
export class EditToursModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<TourItemDto> = new EventEmitter<TourItemDto>();
    @Output() createLead: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild('TourModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('conflictingScheduleModal', { static: true })
    conflictingScheduleModal: GoddardConfirmationModalComponent;
    @ViewChild('completedTourModal', { static: true }) completedTourModal: ModalDirective;
    @ViewChild('searchTourLeadWrapper', { static: true }) searchTourLeadWrapper: ElementRef;
    @ViewChild('tourFormWrapper', { static: true }) tourFormWrapper: ElementRef;
    @ViewChild('acInput') private ac: AutoComplete;
    @ViewChild('tourForm') tourForm: NgForm;
    @ViewChild('tourSchedule') private tourSchedule: TourScheduleComponent;

    lead: LeadDto;
    tour: TourItemDtoExt;

    originalLead: LeadDto;

    //we will need this originalTour tour so the tour-schedule component
    //doesn't dynamically update as the 'tour' object is updated in this component
    originalTour: TourItemDtoExt;

    isCompleted: Boolean = false;
    inputText: string;
    lastSearchQuery: string = '';
    leadListingsResults: LeadFindDto[];
    dateFormat = 'MM/dd/yyyy hh:mm';
    inPersonTourType = TourType.InPerson;
    NOT_YET_IMPLEMENTED: string = ToursEditorConstants.NOT_YET_IMPLEMENTED;
    crmId: string; // School crm id
    modalType = ModalType;
    /*
        will display tour form when:
        1- user is an updating an existing tour
        2- user selects a Lead and is creating a new Tour or
        3- when user selects to create a new Lead (With Tour)
    */
    displayTourForm: boolean = false;
    public get editingTour(): boolean {
        if (!this.tour) {
            return false;
        }
        return !this.tour.isNew();
    }
    showAvailability: boolean = false;
    tourAvailabilityLoaded: boolean = false;

    /**
     * Current available program of interest options + any add'l options that were part of lead record
     * but no longer in current options
     */
    leadProgramOfInterestOptions: Array<FeatureInterestOption>;

    /**
     * To cancel the last search in the search form
     */
    lastSearchSubscription: Subscription;

    /**
     * Current available program of interest options
     */
    programsOfInterestOptions: Array<FeatureInterestOption>;
    guides: TourGuideDto[];
    tourStatus: SelectListItem[] = [];
    tourTypes: SelectListItem[] = [];
    followUpTimeFrames: SelectListItem[] = [];
    allWeek: string = 'All Week';
    weekDays: SelectListItem[] = [];
    daysOfInterest: SelectListItem[] = [];
    enabledDates: Date[];
    completeToursOptions: SelectListItem[] = [];
    completeTourOption: CompleteTourOption;
    registerTourFmsUrl: string = environment.registerTourFmsUrl;
    _scheduleItemDto: ScheduleItemDto;
    timeFrames: Array<SelectListItem>;
    // Intermediate model for startDate/startTime fields
    startDateTime: DateTime;
    startDate: Date | undefined; // startDate bound to the UI
    startTime: string | undefined; // startTime bound to the UI
    endTime: string | undefined;
    _settings: AppTourSettingsDto;
    readonly MIN_MAX_HOUR_CONFLICTING_CHECK: number = 2;
    currentTourEditAction: CurrentTourEditAction = CurrentTourEditAction.Edit;
    editActions = CurrentTourEditAction;

    constructor(
        injector: Injector,
        private _toursEditorService: ToursEditorService,
        private _leadsEditorService: LeadsApiClientFacade,
        private _featuresApi: FeaturesApiClientFacade,
        private _toursApi: ToursApiClientFacade,
        private _dateTimeService: DateTimeService,
        private _toursSettingsApiClientFacade: ToursSettingsApiClientFacade
    ) {
        super(injector);
    }

    private subscribeToCurrentTour(): Subscription {
        return this._toursEditorService.$currentTourSubject.subscribe((tour) => {
            this.loadProgramInterestOptions();
            // Create our model , this could be a new tour or an existing tour
            this.tour = new TourItemDtoExt(tour);
            this.setEditTourFlags();

            //User selected a tour from the grid to update it, get tour details
            if (!this.tour.isNew()) {
                this.getTourAndLeadDetailsAndOpenModal(this.tour, tour.lead.schoolParentLeadId);
                return;
            }

            this.tour = this._toursEditorService.createTourWithDefaults(this._settings, this.guides);

            // user selected an existing lead or just created a new one and then selected to create a tour
            // fetch the lead and open modal
            if (tour.lead?.schoolParentLeadId) {
                this.setupTourForm(tour.lead.schoolParentLeadId.toString(), this.tour);
                return;
            }

            //Creating new tour, open modal to let user search for a lead
            this.open();
            this.displayTourForm = false;

            if (this.lastSearchQuery) {
                this.back();
            }
        });
    }

    setupTourForm(schoolParentLeadId: string, tour: TourItemDtoExt = undefined) {
        this.spinnerService.show('content');
        this.getLeadObservable(schoolParentLeadId).subscribe((lead) => {
            if (!tour) {
                tour = this._toursEditorService.createTourWithDefaults(this._settings, this.guides);
            }
            this.setEditTourFlags();
            this.setTourAndLead(tour, lead);
            this.open();
        }, this.displayError);
    }

    getTourAndLeadDetailsAndOpenModal(tour: TourItemDtoExt, leadId: number) {
        this.spinnerService.show('content');
        this.addSubscription(
            combineLatest([
                this._toursApi.getTour(this.crmId, tour.id),
                this.getLeadObservable(leadId.toString()),
            ])
                .pipe(finalize(() => this.spinnerService.hide('content')))
                .subscribe(
                    ([tourResponse, lead]) => {
                        this.tour = new TourItemDtoExt(tourResponse);
                        this.setupTourForm(lead.schoolParentLeadId, this.tour);
                    },
                    (error) => {
                        this.displayError(error);
                    }
                )
        );
    }

    ngOnInit(): void {
        this.crmId = this.appSession.school.crmId;

        this.initializeTimeFrames();

        this.loadTourSettingsFromEnums();

        this.addSubscription(this.subscribeToCurrentTour());

        this.loadToursSettings();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
        if (this.lastSearchSubscription) {
            this.lastSearchSubscription.unsubscribe();
        }
    }

    clearInput(): void {
        this.inputText = '';
    }

    loadTourSettingsFromEnums() {
        let status = Object.values(TourStatus);
        for (let index = 0; index < status.length; index++) {
            if (status[index] === TourStatus.Completed || status[index] === TourStatus.Scheduled) {
                this.tourStatus.push({ text: camelCaseToDisplayName(status[index]), value: status[index] });
            }
        }

        let types = Object.values(TourType);
        for (let index = 0; index < types.length; index++) {
            this.tourTypes.push({
                text: camelCaseToDisplayName(types[index]).replace(TourType.Online, `Live ${TourType.Online}`),
                value: types[index],
                imgPath:
                    types[index] === TourType.Online
                        ? '/assets/common/images/icons/gsi_online.png'
                        : '/assets/common/images/icons/gsi_school.png',
            });
        }

        let timeFrames = Object.values(FollowUpTimeFrame);
        for (let index = 0; index < timeFrames.length; index++) {
            this.followUpTimeFrames.push({
                text: camelCaseToDisplayName(timeFrames[index]).replace('Six', `6 `).replace('Twelve', `12 `),
                value: timeFrames[index],
            });
        }

        let daysOfInterest = Object.values(DaysOfInterest);
        for (let index = 0; index < daysOfInterest.length; index++) {
            if (daysOfInterest[index] !== DaysOfInterest.ToBeDetermined) {
                this.weekDays.push({
                    text: daysOfInterest[index].substring(0, 3),
                    value: daysOfInterest[index],
                });
            }
        }

        this.daysOfInterest = [
            ...this.weekDays,
            {
                text: this.allWeek,
                value: this.allWeek,
            },
            {
                text: 'TBD',
                value: DaysOfInterest.ToBeDetermined,
            },
        ];

        let completeOptions = Object.values(CompleteTourOption);
        for (let index = 0; index < completeOptions.length; index++) {
            if (completeOptions[index] !== CompleteTourOption.Register) {
                this.completeToursOptions.push({
                    text: camelCaseToDisplayName(completeOptions[index]).replace('6', ` 6 `).replace('12', ` 12 `),
                    value: completeOptions[index],
                });
            }
        }
    }

    searchLeads(event) {
        this.lastSearchQuery = event.query;

        if (this.lastSearchSubscription) {
            this.lastSearchSubscription.unsubscribe();
        }
        this.lastSearchSubscription = this._leadsEditorService
            .findLeads(
                event.query,
                this.crmId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                1,
                ToursEditorConstants.MAX_LEADS_RETURNED
            )
            .subscribe((response) => {
                this.leadListingsResults = response;
            }, this.displayError);
    }

    onFocusAc(ac: AutoComplete) {
        this.ac = ac;
    }

    setInputText() {
        this.inputText = this.lastSearchQuery;
        this.updateAc();
    }

    //Time is important to let modal get rendered again when user clicks 'Create Lead' and then back to Search
    updateAc() {
        setTimeout(() => {
            this.ac.focusInput();
            this.ac.show();
        }, 200);
    }

    // on save
    validateConflictingScheduleAndSaveTour() {
        let tour = this.getBaseTourData();

        if (!this.shouldCheckForConflictingSchedule(tour)) {
            this.saveTour();
            return;
        }

        let startDate = tour.startDateTime.plus({ hours: -this.MIN_MAX_HOUR_CONFLICTING_CHECK });
        let endDate = tour.endDateTime.plus({ hours: this.MIN_MAX_HOUR_CONFLICTING_CHECK });

        this.spinnerService.show('content');

        this._toursApi
            .getTours(this.crmId, [TourStatus.Scheduled], startDate, endDate, [tour.type])
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (response: PagedResultDtoOfTourItemDto) => {
                    const displayWarning = this.shouldDisplayConflictingTourScheduleWarning([...response?.items], tour);

                    if (displayWarning) {
                        this.conflictingScheduleModal.show();
                    } else {
                        this.saveTour();
                    }
                },
                (error) => {
                    this.displayErrorSaving(error);
                }
            );
    }

    /**
     * Only check when user is scheduling a new tour or rescheduling an existing tour. The tour's status is 'Scheduled' and future time
     * @param tour
     * @returns
     */
    shouldCheckForConflictingSchedule(tour: TourItemDtoExt): boolean {
        if (!tour.isScheduled()) {
            return false;
        }
        if (!tour.isNew() && tour.isSameTime(this.originalTour)) {
            return false;
        }

        // tour.startDateTime is the school's time in browser's local timezone
        // Need to convert to the correct timestamp (ex. 10a PST to 10a ET) to compare
        // correctly against DateTime.now()
        return this._dateTimeService.toSchoolTimeZoneKeepTime(tour.startDateTime) > DateTime.now();
    }

    shouldDisplayConflictingTourScheduleWarning(tours: TourItemDto[] | undefined, tour: TourItemDtoExt): boolean {
        if (!tours?.length) {
            return false;
        }

        const maxAllowed =
            tour.type === TourType.InPerson
                ? ToursEditorConstants.MAX_IN_PERSON_PARTICIPANTS
                : this._settings.maxOpenHouseParticipants;

        //Excluding the current tour from the overlap check
        if (this.editingTour) {
            tours = tours.filter((x) => x.id !== tour.id);
        }

        /**
         * returned dictionary example:
         * "2023-07-07T12:00:00.000+00:00,2023-07-07T12:30:00.000+00:00": [Array of tours],
         * "2023-07-07T13:00:00.000+00:00,2023-07-07T14:30:00.000+00:00": [Array of tours],
         */
        const grouped = _groupBy(tours, function (item) {
            return [item.startDateTime, item.endDateTime];
        });

        //fill the time-slots
        let scheduledTimeSlots = new Array<ScheduledToursTimeSlot>();
        for (let key in grouped) {
            let dates = key.split(',');
            scheduledTimeSlots.push({
                startDateTime: DateTime.fromISO(dates[0]),
                endDateTime: DateTime.fromISO(dates[1]),
                bookedTours: grouped[key].length,
            });
        }

        //filter all overlapping time slots and sum up the bookedTours on each grouping
        let overlappingSlots = scheduledTimeSlots.filter((x) => {
            return this._dateTimeService.isOverlappingExclusive(
                this._dateTimeService.ensureDateTime(tour.startDateTime),
                this._dateTimeService.ensureDateTime(tour.endDateTime).plus({ seconds: -1 }),
                this._dateTimeService.ensureDateTime(x.startDateTime),
                //removing 1 second to endDateTime to avoid overlapping on tour starting at the same time another ends
                this._dateTimeService.ensureDateTime(x.endDateTime).plus({ seconds: -1 })
            );
        });

        const totalOverlappingScheduledTourCount = overlappingSlots?.length
            ? overlappingSlots
                  .map((a) => a.bookedTours)
                  .reduce(function (a, b) {
                      return a + b;
                  })
            : 0;

        return totalOverlappingScheduledTourCount >= maxAllowed;
    }

    saveTour(): void {
        this.tourForm.form.markAllAsTouched();
        if (!this.tourForm.form.valid) {
            return;
        }

        this.conflictingScheduleModal.hide();
        if (!this.originalTour.isNew()) {
            this.updateTour();
            return;
        }
        this.createTour();
    }

    private createTour() {
        let tour = this.getCreateTourData();

        this.spinnerService.show('content');
        //Save the tour
        this._toursApi
            .createTour(this.crmId, tour)
            .pipe(
                finalize(() => {
                    this.spinnerService.hide('content');
                })
            )
            .subscribe(
                (response) => {
                    this.onSuccessSavingAddOrEditTour();
                },
                (error) => {
                    this.displayErrorSaving(error);
                }
            );
    }

    private updateTour() {
        //Save the tour
        this.updateTourObservable().subscribe(
            (response) => {
                this.onSuccessSavingAddOrEditTour();
            },
            (error) => {
                this.displayErrorSaving(error);
            }
        );
    }

    updateTourObservable(): Observable<void> {
        let dto = this.getUpdateTourData(this.tour);
        this.spinnerService.show();
        //return save tour observable
        return this._toursApi.updateTour(this.tour.id, dto).pipe(
            finalize(() => {
                this.spinnerService.hide();
            })
        );
    }

    onSuccessSavingAddOrEditTour() {
        this.close();
        this.onSuccessSavingTour();
    }

    getCreateTourData(): CreateTourInput {
        let baseTour = this.getBaseTourData();
        const tour = CreateTourInput.fromJS({
            ...baseTour,
            lead: CreateLeadInput.fromJS({ ...this.lead }),
        });

        return tour;
    }

    getUpdateTourData(tour: TourItemDtoExt): UpdateTourInput {
        const dto = UpdateTourInput.fromJS({
            ...tour,
            lead: UpdateLeadInput.fromJS({ ...this.lead }),
            classRoom: tour.classRoom,
            status: tour.status,
            notes: tour.notes,
            schoolId: this.crmId
        });

        return dto;
    }

    /**
     * Converts from UI to DTO format
     * @returns
     */
    getBaseTourData(): TourItemDtoExt {
        return new TourItemDtoExt({
            ...this.tour,
            startDateTime: this._dateTimeService.fromDatetimePickerWithTime(this.startDate, this.startTime),
            endDateTime: this._dateTimeService.fromDatetimePickerWithTime(this.startDate, this.endTime),
        });
    }

    childAge(dateOfBirth?: DateTime): string | number {
        return this._dateTimeService.getAge(dateOfBirth);
    }

    open() {
        this.clearInput();
        this.modal.show();
    }

    close() {
        this.modal.hide();
    }

    closeAllTourModalsAndReloadTours() {
        this.modal.hide();
        this.discardModal.hide();
        this.completedTourModal.hide();
        this._toursEditorService.reloadTours(true);
    }

    openNewLeadModal() {
        this.close();
        this.createLead.emit(true);
    }

    // Return to lead search
    back() {
        this.displayTourForm = false;
        this.tour = null;
        this.lead = null;
        this.setInputText();
    }

    showDiscardChangesModal(currentTourEditAction: CurrentTourEditAction = CurrentTourEditAction.Edit): void {
        this.setCurrentAction(currentTourEditAction);
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.close();
            this.showNotYetImplementedForCurrentAction();
        }
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    closeConflictScheduleModal() {
        this.conflictingScheduleModal.hide();
    }

    pendingChanges(): boolean {
        if (!this.displayTourForm) {
            return false;
        }
        const tour = this.editingTour
            ? this.getUpdateTourData(this.tour)
            : this.getCreateTourData();

        const leadPendingChanges = JSON.stringify(this.lead) !== JSON.stringify(this.originalLead);

        //Compare only fields user is allowed to edit
        if (this.editingTour) {
            let hasEditChanges = !this.originalTour.equals(tour) || leadPendingChanges;

            return hasEditChanges;
        }

        return this.originalTour.equalsStringify(tour) || leadPendingChanges;
    }

    discardChanges() {
        this.closeDiscardChangesModal();

        //Reset current Tour to its original values
        this.lead = LeadDto.fromJS({ ...this.originalLead });
        this.tour = new TourItemDtoExt(this.originalTour);
        this.close();

        if (this.currentTourEditAction === CurrentTourEditAction.MarkAsCompleted) {
            this.showCompletedTourModal();
        }

        this.showNotYetImplementedForCurrentAction();
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
        const missing = this.lead.programsOfInterest?.filter((x) => {
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

    private loadProgramInterestOptions() {
        if (this.programsOfInterestOptions == null) {
            this.addSubscription(
                this._featuresApi.getSchoolLeadProgramInterestOptions(this.appSession.school.crmId).subscribe((options) => {
                    this.programsOfInterestOptions = options;
                })
            );    
        }
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
                        this.guides = [TourGuideDto.fromJS({ id: undefined, name: 'Select tour guide...' })].concat(
                            guides
                        );
                        this._settings = AppTourSettingsDto.fromJS(settings);
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }

    /**
     * set component date and time fields from the tour
     * @param tour tour with UTC start and end time
     * @returns
     */
    setViewDataFromTour(tour: TourItemDtoExt) {
        this.setStartDateTime(tour.startDateTime);
        this.setEndDateTime(tour.endDateTime);
    }

    private getLeadObservable(schoolParentLeadId: string) {
        return this._leadsEditorService.getLead(this.crmId, schoolParentLeadId.toString()).pipe(
            finalize(() => {
                this.spinnerService.hide('content');
            })
        );
    }

    onSuccessSavingTour() {
        this.save.emit(TourItemDto.fromJS(this.tour));
    }

    displayErrorSaving(error): void {
        console.error(error);
        this.spinnerService.hide('content');
        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
    }

    /**
     * return first
     * @param dateFormat Jun 15, 2015
     * @returns
     */
    replaceYear(dateFormat: string): string {
        var remove_after = dateFormat.indexOf(',');
        return dateFormat.substring(0, remove_after);
    }

    /**
     * check if dayOfInterest is selected to mark checkbox as checked
     * @param dayOfInterest
     * @returns
     */
    dayOfInterestSelected(dayOfInterest: string): boolean {
        return this._toursEditorService.dayOfInterestSelected(dayOfInterest, this.lead);
    }

    /* MARK TOUR COMPLETE  */

    showCompletedTourModal(): void {
        this.toggleFollowUpOptions(false);
        this.toggleRegisterTourMessage(false);
        this.completedTourModal.show();
    }

    showDiscardChangesOrCompletedTourModal(): void {
        if (this.pendingChanges()) {
            this.showDiscardChangesModal(CurrentTourEditAction.MarkAsCompleted);
            return;
        }
        this.showCompletedTourModal();
    }

    closeCompletedTourModal() {
        this.tour.status = this.originalTour.status;
        this.completedTourModal.hide();
        this.toggleFollowUpOptions(false);
        this.toggleRegisterTourMessage(false);
    }

    registerCompletedTour() {
        this.toggleFollowUpOptions(false);
        this.followUpCompletedTour(CompleteTourOption.Register);

        //Save the Tour
        this.updateTourObservable().subscribe((response) => {
            this.toggleRegisterTourMessage(true);
        }, this.displayErrorSaving);
    }

    toggleRegisterTourMessage(showMessage: boolean) {
        const markCompleteWrapper = document.getElementById('gsi-complete-tour-modal__options');
        const registerMessageWrapper = document.getElementById('gsi-complete-tour-modal__register-msg');
        if (showMessage) {
            markCompleteWrapper.classList.add('d-none');
            registerMessageWrapper.classList.remove('d-none');
        } else {
            markCompleteWrapper.classList.remove('d-none');
            registerMessageWrapper.classList.add('d-none');
        }
    }

    followUpCompletedTour(completeOption: CompleteTourOption) {
        this.completeTourOption = completeOption;
        this.tour.status = TourStatus.Completed;
    }

    toggleFollowUpOptions(shouldShow: boolean) {
        const followUpOptions = document.getElementById('followUpOptions');
        const followUpTrigger = document.getElementById('gsi-toggle-folowup');
        const saveOptionWrapper = document.getElementById('gsi-complete-tour-modal__save');
        if (shouldShow) {
            followUpTrigger.classList.add('disabled');
            followUpOptions.classList.remove('d-none');
            followUpOptions.classList.add('d-flex');
            saveOptionWrapper.classList.remove('d-none');
            saveOptionWrapper.classList.add('d-flex');
        } else {
            followUpTrigger.classList.remove('disabled');
            followUpOptions.classList.add('d-none');
            followUpOptions.classList.remove('d-flex');
            saveOptionWrapper.classList.add('d-none');
            saveOptionWrapper.classList.remove('d-flex');
        }
    }

    isOnEditMode(): boolean {
        return !this.originalTour?.isNew() && this.displayTourForm;
    }

    saveMarkTourAsCompleted(): void {
        this.tour.status = TourStatus.Completed;

        // TODO: Update lead or set queue item to update lead

        //Save the Tour
        this.updateTourObservable().subscribe((response) => {
            this.onSuccessSavingMarkTourAsCompleted(response);
        }, this.displayErrorSaving);
    }

    onSuccessSavingMarkTourAsCompleted(response) {
        this.completedTourModal.hide();
        this.close();
        this.onSuccessSavingTour();
    }

    pendingSavingStatusChange(): boolean {
        return this.originalTour?.status !== this.tour?.status;
    }

    setStartDate(startDateTime: DateTime) {
        this.startDate = startDateTime.toJSDate();
    }

    setStartTime(startDateTime: DateTime) {
        this.startTime = this._dateTimeService.getTime(startDateTime, false, true);
    }

    setEndTime(endDateTime: DateTime) {
        this.endTime = this._dateTimeService.getTime(endDateTime, false, true);
    }

    contactPreferenceText(contactPreference: ContactPreference): string {
        let preference = ContactPreference[contactPreference];
        if (!preference) {
            preference = ContactPreference[ContactPreference.Email];
        }
        return preference;
    }

    setCurrentAction(currentTourEditAction: CurrentTourEditAction): void {
        this.currentTourEditAction = currentTourEditAction;
    }

    onChangeDate(date: DateTime): void {
        if (!date.isValid) {
            this.startDate = this.tour.startDateTime.toJSDate();
            date = DateTime.fromJSDate(this.startDate);
        }
        this.startDate = date.toJSDate();
        if(this.startTime) {
            // temporary hack to avoid the initial NRE on initial change date
            this.startDateTime = this._dateTimeService.fromDatetimePickerWithTime(date, this.startTime);
            this.updateTourDtoDates();
        }
    }

    updateTourDtoDates() {
        this.tour.startDateTime = this._dateTimeService.fromDatetimePickerWithTime(this.startDate, this.startTime);

        this.tour.endDateTime = this._dateTimeService.fromDatetimePickerWithTime(this.startDate, this.endTime);
    }

    onChangeStartTime(startTime: string): void {
        this.startTime = startTime;
        this.startDateTime = this._dateTimeService.fromDatetimePickerWithTime(this.startDate, startTime);
        this.updateTourDtoDates();

        if (!this.validEndTime(this.endTime)) {
            this.moveEndTimeAfterStart();
        }
    }

    onChangeEndTime(endTime: string): void {
        if (this.validEndTime(endTime)) {
            this.endTime = endTime;
            this.updateTourDtoDates();
            return;
        }
        this.moveEndTimeAfterStart();
    }

    private validEndTime(endTime: string): boolean {
        let isValid =
            endTime &&
            this.startTime !== endTime &&
            this._dateTimeService.validateEndTimeGreaterThanStartTime(this.startTime, endTime);

        return isValid;
    }

    moveEndTimeAfterStart(): void {
        const endDateTime = this.startDateTime.plus({ minutes: this._settings.defaultTourDuration });
        this.setEndDateTime(endDateTime);
        //set input value so dropdown is also updated
        this.tourForm.form.get('endTime').setValue(this.endTime);
        this.updateTourDtoDates();
    }

    private setEditTourFlags() {
        this.displayTourForm = true;
        this.currentTourEditAction = CurrentTourEditAction.Edit;
        this.isCompleted = this.tour?.status === TourStatus.Completed;
    }

    setStartDateTime(date: DateTime): void {
        this.startDateTime = date;
        this.setStartDate(this.startDateTime);
        this.setStartTime(this.startDateTime);
    }

    setEndDateTime(date: DateTime): void {
        this.setEndTime(date);
    }

    setTourAndLead(tour: TourItemDtoExt, lead: LeadDto): void {
        this.lead = lead;
        this.originalLead = LeadDto.fromJS({ ...this.lead });
        this.originalTour = new TourItemDtoExt(tour);
        this.tour = tour;

        this.setViewDataFromTour(tour);
        this.loadLeadProgramOfInterestOptions();

        // Setup the tour schedule component
        this.tourSchedule?.changeSelectedDate(DateTime.fromJSDate(this.startDate));

        if (!tour.isNew()) {
            if (!tour.isViewed) {
                tour.markViewed();
                let dto = this.getUpdateTourData(tour);
                this._toursApi
                    .updateTour(this.tour.id, dto)
                    .pipe(
                        finalize(() => {
                            this.spinnerService.hide();
                        })
                    )
                    .subscribe(() => {
                        const tourItemDto = TourItemDto.fromJS({
                            ...tour,
                            lead: LeadDto.fromJS({ ...this.lead }),
                        });
                        // Passes the tour back to the grid and resets the grid with the viewed tour
                        this._toursEditorService.updateInMemoryTour(tourItemDto);
                    });
            }
        }
    }

    initializeTimeFrames(): void {
        this.timeFrames = this._toursEditorService.getIntervalTimes();
    }

    onTourAvailabilityLoaded(tourAvailabilityLoaded: boolean): void {
        this.tourAvailabilityLoaded = tourAvailabilityLoaded;
    }

    showNotYetImplementedForCurrentAction(): void {
        if (
            this.currentTourEditAction === CurrentTourEditAction.CancelTour ||
            this.currentTourEditAction === CurrentTourEditAction.NoShow
        ) {
            this.displayInfo(this.NOT_YET_IMPLEMENTED);
        }
    }
}

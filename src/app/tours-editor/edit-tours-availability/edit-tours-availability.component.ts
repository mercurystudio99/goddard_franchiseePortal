import { DateTime } from 'luxon';
import {
    DayOfWeek,
    AppTourSettingsDto,
    TourGuideDto,
    AvailabilityDto,
    AvailabilityBlockDto,
    TourType,
    TourTypesEnum,
} from '@shared/service-proxies/service-proxies';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditToursAvailabilitySettingsComponent } from '../edit-tours-availability-settings/edit-tours-availability-settings.component';
import { EditAvailabilityExceptionsModal } from '../edit-availability-exceptions-modal/edit-availability-exceptions-modal.component';
import { ToursEditorService } from '../services/tours-editor.service';
import { finalize, map } from 'rxjs/operators';
import { camelCaseToDisplayName, SelectListItem } from '@shared/utils/utils';
import { ToursApiClientFacade } from '../../../shared/service-proxies/tours-api-client-facade.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { combineLatest, Observable } from 'rxjs';
import { ToursSettingsApiClientFacade } from '../../../shared/service-proxies/tours-settings-api-client-facade.service';
import { ModalType } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { GoddardConfirmationModalComponent } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { IDeactivateComponent } from '@shared/utils/deactivate-guard.service';
import { AvailabilityBlockDtoEx } from './availability-block-dto-ex';
import { orderBy } from 'lodash';

@Component({
    selector: 'app-edit-tours-availability',
    templateUrl: './edit-tours-availability.component.html',
    styleUrls: ['./edit-tours-availability.component.css'],
})
export class EditToursAvailabilityComponent
    extends AppComponentBase
    implements OnInit, OnDestroy, IDeactivateComponent {
    availability: AvailabilityDto;
    dayOfWeekOptions: SelectListItem[] = [];
    modalType = ModalType;
    timeOptions: Array<SelectListItem> = [];
    tourGuides: TourGuideDto[];
    tourSettings: AppTourSettingsDto;
    tourTypeOptions: SelectListItem[] = [];

    /** Child Views */

    /**
     * Confirm modal for when an availability block is being deleted
     */
    @ViewChild('deleteBlockConfirmModal', { static: true })
    private deleteBlockConfirmModal: GoddardConfirmationModalComponent;

    @ViewChild('discardChangesModal', { static: true })
    private discardModal: GoddardConfirmationModalComponent;

    @ViewChild('changeDefaultTourDurationConfirmModal', { static: true })
    private changeDefaultTourDurationConfirmModal: GoddardConfirmationModalComponent;

    @ViewChild('mismatchTourDurationWarningModal', { static: true })
    private mismatchTourDurationWarningModal: GoddardConfirmationModalComponent;

    /**
     * Confirm modal for when a tour type is being removed
     */
    @ViewChild('removeTourTypeConfirmModal', { static: true })
    private removeTourTypeConfirmModal: GoddardConfirmationModalComponent;

    @ViewChild('minimumRequiredConfirmModal', { static: true })
    private minimumRequiredConfirmModal: GoddardConfirmationModalComponent;

    @ViewChild('requiredTourTypeModal', { static: true })
    private requiredTourTypeModal: GoddardConfirmationModalComponent;

    @ViewChild('resetDefaultsConfirmModal', { static: true })
    private resetDefaultsConfirmModal: GoddardConfirmationModalComponent;

    @ViewChild('settingsModal', { static: true })
    private settingsModal: EditToursAvailabilitySettingsComponent;

    @ViewChild('exceptionModal', { static: true })
    private exceptionModal: EditAvailabilityExceptionsModal;

    @ViewChild('overlapWarningModal', { static: true })
    private overlapWarningModal: GoddardConfirmationModalComponent;

    /**
     * Current block being targeted for a confirm modal
     */
    private currentBlock: AvailabilityBlockDto | null = null;

    /**
     * Current input being handled for a confirm modal
     */
    private currentInput: HTMLInputElement | null = null;

    /**
     * Availability blocks for days of week that are disabled by user.  Saved in case user changes mind and re-enables the day of week.
     *
     * User Story 16579: Tour Scheduling - Manage Availability_Default Availabilty
     * "20230508RBP - If a user disables a day, it goes into a disabled state and DOESN'T go away. Should they change their mind, they can come back and enable it."
     */
    private disabledBlocksCache: AvailabilityBlockDto[] = [];

    /**
     * Pending default tour duration value that needs to be confirmed
     */
    private pendingDefaultTourDuration: number;

    constructor(
        injector: Injector,
        private _toursEditorService: ToursEditorService,
        private _toursApiClientFacade: ToursApiClientFacade,
        private _dateTimeService: DateTimeService,
        private _toursSettingsApiClientFacade: ToursSettingsApiClientFacade
    ) {
        super(injector);
    }

    /**
     * Returns availability.blocks if loaded otherwise empty array
     */
    get availabilityBlocks(): AvailabilityBlockDto[] {
        if (!this.availability) {
            return [];
        }

        return this.availability.blocks;
    }

    ngOnInit(): void {
        this.timeOptions = this._toursEditorService.getIntervalTimes();
        this.initDayOfWeekOptions();
        this.initTourTypeOptions();
        this.loadTourGuides();
        this.loadAvailability();
        this.loadTourSettings();

        this.addSubscription(
            this._toursEditorService.$canExecuteObservable.subscribe((refresh: boolean) => {
                if (refresh) {
                    this.loadTourGuides();
                    this.loadAvailability();
                    this.loadTourSettings();
                }
            })
        );
    }

    /**
     * Adds a new time slot after last one for day of week with default tour duration
     * @param block
     */
    addBlock(block: AvailabilityBlockDtoEx): void {
        const newBlock = this.createFollowingBlock(block);

        this.availability.blocks.push(newBlock);

        this.availability.isSystemDefault = false;
    }

    /**
     * Returns `true` if can add a block following specified `block`
     * @param block
     * @returns
     */
    canAddBlock(block: AvailabilityBlockDtoEx): boolean {

        const newBlock = this.createFollowingBlock(block);

        if (newBlock.endTime.startOf('day') > block.startTime.startOf('day')) {
            // This new block would go into the next day

            return false;
        }

        const blocks = this.getBlocksForDayOfWeek(block.dayOfWeek);

        // Find any block that would be overlapping with new potential block
        const overlappingBlockExists = blocks.some(x =>
            this._dateTimeService.isOverlappingExclusive(newBlock.startTime, newBlock.endTime, x.startTime, x.endTime)
        );

        // Return false
        return !overlappingBlockExists;
    }

    canExit(): Observable<boolean> | Promise<boolean> | boolean {
        this.discardModal.show();
        return this._toursEditorService.$canExecuteSubject.pipe(
            map((result) => {
                return result;
            }),
            finalize(() => { })
        );
    }

    changeDefaultTourDuration(newValue: string) {
        this.pendingDefaultTourDuration = +newValue;
        this.changeDefaultTourDurationConfirmModal.show();
    }

    /**
     * Handler when changing Default Tour Duration has been accepted
     */
    async changeDefaultTourDurationAccepted(): Promise<void> {

        this.tourSettings.defaultTourDuration = this.pendingDefaultTourDuration;

        if (this.availability.isSystemDefault) {
            // Current availability displayed is system default

            // Just load default availability for new tour duration
            await this.loadDefaultAvailability();
        }
        else {

            // Current availability is not system default

            // Adjust any blocks to meet multiple of Default Tour Duration
            for (var i = 0; i < this.availability.blocks.length; i++) {
                const block = this.availability.blocks[i] as AvailabilityBlockDtoEx;
                var diff = block.duration % this.tourSettings.defaultTourDuration;
                if (diff != 0) {
                    // Block is not a multiple of Default Tour Duration

                    // Add to the end time the diff to get it to be a multiple of Default Tour Duration
                    this.availability.blocks[i].endTime = this.availability.blocks[i].endTime.plus({
                        minutes: diff
                    });
                }
            }
        }
        this.changeDefaultTourDurationConfirmModal.hide();
    }

    changeDefaultTourDurationRejected(): void {
        const preSelectedOption = document.querySelector(`option[value="${this.tourSettings.defaultTourDuration}"]`) as HTMLOptionElement
        preSelectedOption.selected = true;
        this.changeDefaultTourDurationConfirmModal.hide();
    }

    /**
     * Change start time of block and display warning if tour duration was mismatched
     * @param newTimeAsString
     * @param block
     */
    changeStartTime(newTimeAsString: any, block: AvailabilityBlockDtoEx): void {

        if (!block.changeStartTime(newTimeAsString, this.tourSettings.defaultTourDuration)) {
            // New startTime was not valid for tour duration

            // Show user warning
            this.mismatchTourDurationWarningModal.show();
        }

        this.availability.isSystemDefault = false;
    }

    /**
     * Change end time of block and display warning if tour duration was mismatched
     * @param newTimeAsString
     * @param block
     */
    changeEndTime(newTimeAsString: any, block: AvailabilityBlockDtoEx): void {

        if (!block.changeEndTime(newTimeAsString, this.tourSettings.defaultTourDuration)) {
            // New end time was not valid for tour duration

            // Show user warning
            this.mismatchTourDurationWarningModal.show();
        }

        this.availability.isSystemDefault = false;
    }

    /**
     * Toggle action when day of week is checked/unchecked
     * @param event
     * @param dayOfWeek
     */
    dayOfWeekChanged(event: Event, dayOfWeek: DayOfWeek): void {

        const input = event.target as HTMLInputElement;

        if (input.checked) {
            // Day of week enabled

            // Check if any blocks were saved when day of week was disabled by user
            const disabledBlocks = this.disabledBlocksCache.filter((x) => x.dayOfWeek === dayOfWeek);
            if (disabledBlocks.length === 0) {
                // No blocks were previously added for day of week

                // Add initial block from 9a to 5p
                var initialBlock = new AvailabilityBlockDtoEx({
                    dayOfWeek: dayOfWeek,
                    startTime: DateTime.utc().startOf('day').set({ hour: 9 }),
                    endTime: DateTime.utc().startOf('day').set({ hour: 17 }),
                    tourTypes: [TourTypesEnum.InPerson],
                });

                this.availability.blocks.push(initialBlock);
            } else {
                // Rehydrate blocks that were previously captured
                this.availability.blocks = this.availabilityBlocks.concat(disabledBlocks);

                // Remove from disabled cache
                this.disabledBlocksCache = this.disabledBlocksCache.filter((x) => x.dayOfWeek != dayOfWeek);
            }
        } else {
            // Day of week unchecked

            // Capture existing blocks in case user wants to re-enable day of week
            this.disabledBlocksCache = this.disabledBlocksCache.concat(this.getBlocksForDayOfWeek(dayOfWeek));

            // Remove blocks from data model
            this.availability.blocks = this.availability.blocks.filter((x) => x.dayOfWeek !== dayOfWeek);
        }

        this.availability.isSystemDefault = false;
    }

    /**
     * Delete availability block
     */
    deleteBlock(block: AvailabilityBlockDto): void {
        this.currentBlock = block;
        const blocks = this.availability.blocks.filter((x) => x.dayOfWeek == block.dayOfWeek);
        (blocks.length <= 2 && block.dayOfWeek !== DayOfWeek.Saturday && block.dayOfWeek !== DayOfWeek.Sunday) ? this.minimumRequiredConfirmModal.show() : this.deleteBlockConfirmModal.show();
    }

    /**
     * Removes availability block on confirmation
     */
    deleteBlockAccepted(): void {
        if (this.currentBlock) {
            const indexToRemove = this.availabilityBlocks.findIndex((x) => x === this.currentBlock);
            if (indexToRemove > -1) {
                this.availability.blocks.splice(indexToRemove, 1);
            }
            this.currentBlock = null;
        }

        this.deleteBlockConfirmModal.hide();

        this.availability.isSystemDefault = false;
    }

    /**
     * Delete availability block rejected
     */
    deleteBlockRejected(): void {
        this.currentBlock = null;
        this.deleteBlockConfirmModal.hide();
    }

    /**
     * Duplicates time slot to next day of week
     * @param timeSlot
     * @param index
     */
    duplicateBlock(timeSlot: AvailabilityBlockDtoEx): void {
        // Duplicate timeslot for next day of week
        const duplicated = new AvailabilityBlockDtoEx({
            ...timeSlot,
            dayOfWeek: this._dateTimeService.getNextDayOfWeek(timeSlot.dayOfWeek),
            selected: true,
        });

        this.availability.blocks.push(duplicated);

        this.availability.isSystemDefault = false;
    }

    /**
     * Returns true if availability block is not the only block added for day of week
     * @param timeSlot
     * @returns
     */
    isDeleteBlockAllowed(timeSlot: AvailabilityBlockDto): boolean {
        return this.availabilityBlocks.filter((x) => x.dayOfWeek === timeSlot.dayOfWeek).length > 1;
    }

    /**
     * Returns true if dayOfWeek has availability blocks added
     * @param dayOfWeek
     * @returns
     */
    isWeekDaySelected(dayOfWeek: DayOfWeek): boolean {
        return this.availabilityBlocks?.some((x) => x.dayOfWeek === dayOfWeek);
    }

    closeSettingsModal() {
        this.settingsModal.close();
    }

    openOnlineSettingsModal() {
        this.settingsModal.getSettingsAndOpenModal();
    }

    resetDefaults(): void {
        this.resetDefaultsConfirmModal.show();
    }

    resetDefaultsAccepted(): void {
        /**
         * User Story 16579: Tour Scheduling - Manage Availability_Default Availabilty
         * when the user clicks "Reset Defaults", it will just update the tour times for the selected duration.  However, it will not be a "save" operation, it will just be a UX operation.  If the user wants to save the reseted defaults they will have to click "Save Schedule".  I think this will be intuitive and makes logical sense".
         */
        return this.loadDefaultAvailability();
    }

    resetDefaultsRejected(): void {
        this.resetDefaultsConfirmModal.hide();
    }

    /**
     * Handles when an availability block tour type checkbox is clicked
     * @param event
     * @param block
     * @param index
     * @returns
     */
    tourTypeClicked(event: Event, block: AvailabilityBlockDtoEx) {

        const input = event.target as HTMLInputElement;

        if (input.checked) {
            // Adding a new tour type to block

            // Don't need to show any warnings, just add to block's tourTypes
            block.tourTypes.push(TourTypesEnum[input.value]);

            this.availability.isSystemDefault = false;

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

    /**
     * Remove tour type accepted
     */
    tourTypeRemoveAccepted(): void {
        // Filter out the tour type that was being removed
        this.currentInput.checked = false;
        this.currentBlock.tourTypes = this.currentBlock.tourTypes.filter((x) => x != this.currentInput.value);
        this.availability.isSystemDefault = false;

        this.currentBlock = null;
        this.currentInput = null;

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
        this.discardModal.show();
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
        this._toursEditorService.execute(false);
    }

    discardChanges() {
        this.discardModal.hide();
        this._toursEditorService.execute(true);
    }

    save(): void {
        this.spinnerService.show('content');

        if(this.hasAnyAvailabilityBlocksMistmatchDurationTime()) {
            this.spinnerService.hide('content');
            this.mismatchTourDurationWarningModal.show();
            return;
        }

        // Return false if any existing timeslots overlap this new timeslot for the same type
        const isValid = this.availability.blocks.every((block, index, blocks) => {
            if(index == blocks.length - 1) return true; // validate if block is the last block of blocks.

            const tmpBlocks = blocks.slice(index + 1); // rest blocks to cycle through and validate the current selected block.
            //validate if exist overlapping timeslot.
            return tmpBlocks.every(tmpBlock => {
                let isExistTour =  block.tourTypes.some( type =>tmpBlock.tourTypes.includes(type) );
                if( tmpBlock.dayOfWeek === block.dayOfWeek && isExistTour ) {
                    return !this._dateTimeService.isOverlappingExclusive(block.startTime, block.endTime, tmpBlock.startTime, tmpBlock.endTime);
                }
                return true;
            });
        });

        if (!isValid) {
            this.overlapWarningModal.show();
            this.spinnerService.hide('content');
            return;
        }

        combineLatest([
            this._toursSettingsApiClientFacade.saveTourSettings(this.appSession.school.crmId, this.tourSettings),
            this._toursSettingsApiClientFacade.saveAvailability(this.appSession.school.crmId, this.availability),
        ])
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                ([settings, availability]) => {
                    this.onSuccessSavingTourAvailability();
                },
                (error) => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    displayErrorSaving(error): void {
        console.error(error);
        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
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

    openAvailabilityExceptionsModal() {
        this.exceptionModal.open();
    }

    /**
     * Creates a new block with times that follows specified `block` for default tour duration
     * @param block
     * @returns
     */
    private createFollowingBlock(block: AvailabilityBlockDtoEx) {

        // Set new start time to end time of previous timeslot
        const newStartTime = block.endTime;

        // Set new end time for default duration
        const newEndTime = newStartTime.plus({
            minutes: this.tourSettings.defaultTourDuration,
        });

        const result = new AvailabilityBlockDtoEx({
            dayOfWeek: block.dayOfWeek,
            startTime: newStartTime,
            // Set new end time to new start time + default duration
            endTime: newEndTime,
            tourTypes: [TourTypesEnum.InPerson],
        });

        return result;
    }

    /**
     * Initialize day of weeks options
     */
    private initDayOfWeekOptions() {
        let daysOfWeek = Object.values(DayOfWeek).filter((x) => x !== DayOfWeek.Saturday && x !== DayOfWeek.Sunday);
        for (let index = 0; index < daysOfWeek.length; index++) {
            this.dayOfWeekOptions.push({
                text: camelCaseToDisplayName(`${daysOfWeek[index]}`),
                value: `${daysOfWeek[index]}`,
            });
        }

        this.dayOfWeekOptions.push({
            text: camelCaseToDisplayName(`${DayOfWeek.Saturday}`),
            value: `${DayOfWeek.Saturday}`,
        });

        this.dayOfWeekOptions.push({
            text: camelCaseToDisplayName(`${DayOfWeek.Sunday}`),
            value: `${DayOfWeek.Sunday}`,
        });
    }

    /**
     * Initialize tour type options
     */
    private initTourTypeOptions() {
        let types = Object.values(TourTypesEnum);
        for (let index = 0; index < types.length; index++) {
            this.tourTypeOptions.push({
                text: camelCaseToDisplayName(types[index]).replace(TourType.Online, `Live ${TourType.Online}`),
                value: types[index],
            });
        }
    }

    /**
     * Loads availability
     */
    private loadAvailability(availability?:Observable<AvailabilityDto>) {

        this.spinnerService.show('content');

        if (!availability) {
            availability = this._toursSettingsApiClientFacade
                .getAvailability(this.appSession.school.crmId)
        }

        availability
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (availability) => {
                    // Clear out disabled blocks cache
                    this.disabledBlocksCache.length = 0;

                    // Map blocks to our extended DTO class for add'l functionality
                    availability.blocks = availability.blocks.map(
                        (x) =>
                            new AvailabilityBlockDtoEx(x)
                    );
                    this.availability = availability;
                },
                (error): void => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    /**
     * Loads default availability from API
     */
    private loadDefaultAvailability() {
        return this.loadAvailability(this._toursSettingsApiClientFacade.getDefaultAvailability(this.appSession.school.crmId, this.tourSettings.defaultTourDuration))
    }

    private loadTourGuides() {
        this.spinnerService.show('content');
        this._toursApiClientFacade
            .getSchoolGuides(this.appSession.school.crmId)
            .pipe(
                finalize(() => {
                    this.spinnerService.hide('content');
                })
            )
            .subscribe(
                (response: TourGuideDto[]) => {
                    this.tourGuides = response;
                },
                (error) => {
                    console.error('Error fetching school guides:', error);
                }
            );
    }

    private loadTourSettings() {
        this.spinnerService.show('content');

        this._toursSettingsApiClientFacade
            .getTourSettings(this.appSession.school.crmId)
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (settings) => {
                    this.tourSettings = settings as AppTourSettingsDto;
                },
                (error) => {
                    console.error('[Error]', error);
                }
            );
    }

    /**
     * Gets availability blocks for dayOfWeek
     * @param dayOfWeek
     * @returns
     */
    private getBlocksForDayOfWeek(dayOfWeek: DayOfWeek): AvailabilityBlockDto[] {
        const result = this.availabilityBlocks.filter((x) => x.dayOfWeek === dayOfWeek);
        return result;
    }

    private onSuccessSavingTourAvailability() {
        abp.message.success(this.l('Success_Update_Msg_Real_Time'), this.l('Success_Update_Title')).then(() => {
            this.loadAvailability();
            this.loadTourSettings();
        });
    }

    /**
     * Replace selected block to default block.
     */
    minimumRequiredReplace(): void {
        // get the default blocks to compare with the existing blocks.
        this._toursSettingsApiClientFacade.getDefaultAvailability(this.appSession.school.crmId, this.tourSettings.defaultTourDuration)
        .subscribe(
            (availability) => {
                availability.blocks = availability.blocks.map(
                    (x) =>
                        new AvailabilityBlockDtoEx(x)
                );

                if (this.currentBlock) { // Verify if the chosen block is valid.
                    // remove the selected block from the array.
                    const indexToRemove = this.availabilityBlocks.findIndex((x) => x === this.currentBlock);
                    if (indexToRemove > -1) {
                        this.availability.blocks.splice(indexToRemove, 1);
                    }

                    // narrow the default blocks based on the day of the week of the selected block.
                    availability.blocks = availability.blocks.filter((x) => x.dayOfWeek === this.currentBlock.dayOfWeek);
                    for (var i=0; i < availability.blocks.length; i++) {
                        // Ensure that default block is a match for one of the existing blocks.
                        const index = this.availabilityBlocks.findIndex((x) => 
                            x.dayOfWeek === availability.blocks[i].dayOfWeek &&
                            x.startTime.hour === availability.blocks[i].startTime.hour &&
                            x.startTime.minute === availability.blocks[i].startTime.minute &&
                            x.endTime.hour === availability.blocks[i].endTime.hour &&
                            x.endTime.minute === availability.blocks[i].endTime.minute
                        );
                        if (index < 0) { // if the default block doesn't match for the one of the existing blocks with the same day of the week of the selected block, include it in the array.
                            this.availability.blocks.push(availability.blocks[i]);
                            break;
                        }
                    }

                    this.currentBlock = null;
            
                    this.minimumRequiredConfirmModal.hide();
    
                    this.availability.isSystemDefault = false;
                }
            }
        );
    }

    minimumRequiredLeave(): void {
        this.currentBlock = null;
        this.minimumRequiredConfirmModal.hide();
    }
}

import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import { Component, EventEmitter, Injector, OnInit, Output, ViewChild } from '@angular/core';
import { ExtendedSchoolInfoResponse } from '@app/shared/common/apis/generated/content';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { AppTourSettingsDto, OnlineOptionsDto, SaveOnlineTourSettingsInput } from '@shared/service-proxies/service-proxies';
import { ToursSettingsApiClientFacade } from '@shared/service-proxies/tours-settings-api-client-facade.service';
import { Angulartics2 } from 'angulartics2';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppConsts } from '@shared/AppConsts';
import { combineLatest, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ModalType } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { GoddardConfirmationModalComponent } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

/**
 * Online Tour Settings Modal component
 */
@Component({
    selector: 'app-edit-tours-availability-settings',
    templateUrl: './edit-tours-availability-settings.component.html',
    styleUrls: ['./edit-tours-availability-settings.component.css'],
})
export class EditToursAvailabilitySettingsComponent extends AppComponentBase implements OnInit {
    @ViewChild('SettingsModal', { static: true }) SettingsModal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @Output() save: EventEmitter<AppTourSettingsDto> = new EventEmitter<AppTourSettingsDto>();
    //test boolean for pre-recorder-tour
    preRecordedTourIsActive: boolean = true;
    validatedPreRecorderToursPage = false;
    _school: ExtendedSchoolInfoResponse;
    _settings: AppTourSettingsDto;
    _originalSettings: AppTourSettingsDto;
    preRecordedToursLink: string | undefined = undefined;
    preRecordedToursMailTo = 'creativeservices@goddardsystems.com';
    _settingsOptions: OnlineOptionsDto;
    modalType = ModalType;
    public get minConferenceParticipants(): number {
        return this._settingsOptions?.allowedMaxOpenHouseParticipants
            ? this._settingsOptions?.allowedMaxOpenHouseParticipants[0]
            : ToursEditorConstants.DEFAULT_MIN_OPEN_HOUSE_PARTICIPANTS;
    }
    public get maxConferenceParticipants(): number {
        return this._settingsOptions?.allowedMaxOpenHouseParticipants
            ? this._settingsOptions?.allowedMaxOpenHouseParticipants?.slice(-1)[0]
            : ToursEditorConstants.DEFAULT_MAX_OPEN_HOUSE_PARTICIPANTS;
    }

    constructor(
        injector: Injector,
        private _angulartics2: Angulartics2,
        private _toursSettingsApiClientFacade: ToursSettingsApiClientFacade,
        private _contentAPI: ContentApiClientFacade
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.SettingsModal.config.keyboard = false;
        this.SettingsModal.config.backdrop = 'static';
    }

    open() {
        this.SettingsModal.show();
    }

    close() {
        this.SettingsModal.hide();
    }

    getSettingsAndOpenModal() {
        this.spinnerService.show('content');
        this.addSubscription(
            combineLatest([
                this._contentAPI.getSchool(this.appSession.school.crmId),
                this._toursSettingsApiClientFacade.getTourSettings(this.appSession.school.crmId),
            ])
                .pipe(finalize(() => this.spinnerService.hide('content')))
                .subscribe(
                    ([school, settings]) => {
                        this._school = school;

                        //We should check if the settings for maxOpenHouseParticipants are included in
                        //the range allowedMaxOpenHouseParticipants and set to 1 by default if not.
                        //https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/16584/
                        if (
                            !settings.onlineOptions.allowedMaxOpenHouseParticipants.includes(
                                settings.maxOpenHouseParticipants
                            )
                        ) {
                            settings.maxOpenHouseParticipants =
                                ToursEditorConstants.DEFAULT_MIN_OPEN_HOUSE_PARTICIPANTS;
                        }

                        this._settings = AppTourSettingsDto.fromJS(settings);
                        this._originalSettings = AppTourSettingsDto.fromJS(this._settings);
                        this._settingsOptions = OnlineOptionsDto.fromJS(settings.onlineOptions);

                        this.preRecordedToursLink = this._contentAPI.getPageLinkFromSchoolScheduleTourUrl(
                            school?.scheduleTourUrl,
                            AppConsts.virtualToursPageAlias
                        );

                        if (this.validatedPreRecorderToursPage) {
                            this.open();
                            return;
                        }

                        this.validatePreRecordedPageExists();
                    },
                    (err): void => {
                        this.preRecordedTourIsActive = false;
                    }
                )
        );
    }

    private validatePreRecordedPageExists() {
        this._contentAPI
            .validatePageExistsObservable(this.preRecordedToursLink)
            .pipe(
                finalize(() => {
                    this.open();
                })
            )
            .subscribe(
                (response: boolean) => {
                    this.preRecordedTourIsActive = response;
                    this.validatedPreRecorderToursPage = true;
                },
                (err): void => {
                    this.preRecordedTourIsActive = false;
                }
            );
    }

    /**
     * Save online tour settings
     */
    saveOnlineTourSettings(): void {
        this.spinnerService.show('content');
        this.saveTourSettingsInner()
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (response) => {
                    abp.message
                        .success(this.l('Success_Update_Msg_Real_Time'), this.l('Success_Update_Title'))
                        .then(() => {
                            this.close();
                            this.save.emit(this._settings);
                        });
                },
                (error) => {
                    this.displayErrorSaving(error);
                }
            );
    }

    private saveTourSettingsInner(): Observable<void> {
        return this._toursSettingsApiClientFacade.saveOnlineTourSettings(
            this.appSession.school.crmId,
            SaveOnlineTourSettingsInput.fromJS({ ...this._settings })
        );
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
        return JSON.stringify(this._settings) !== JSON.stringify(this._originalSettings);
    }

    discardChanges() {
        this._settings = AppTourSettingsDto.fromJS(this._originalSettings);
        this.closeDiscardChangesModal();
        this.close();
    }

    displayErrorSaving(error): void {
        console.error(error);
        this.spinnerService.hide('content');
        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
    }

    displaySuccess(): void {
        let popovers = document.getElementsByClassName('popover');    // Prevents hover text from appearing before the Copied toast is finished displaying.
        for (let index = 0; index < popovers.length; index++) {
                popovers[index]?.classList.add('d-none');
                setTimeout(() => {
                    popovers[index]?.classList.remove('d-none');
                }, 1500);
        }

        Swal.mixin({
            toast: true,
            target: '#copied-alert-target',
            customClass: {
                container: 'position-absolute',
                htmlContainer: 'my-0',
            },
            showCloseButton: false,
            showConfirmButton: false,
            timer: 1500,
            width: '130px',
        }).fire({
            text: 'Copied',
        });
    }
}

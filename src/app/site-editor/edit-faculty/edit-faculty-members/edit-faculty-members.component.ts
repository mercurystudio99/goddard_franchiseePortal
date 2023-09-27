import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import {
    Component,
    Input,
    Injector,
    ViewChild,
    Output,
    EventEmitter,
    ElementRef,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { FacultyApiClientFacade } from '@shared/service-proxies/faculty-api-client-facade.service';
import { SiteEditorService } from '@app/site-editor/services';
import { FacultyBios } from '@app/shared/common/apis/generated/faculty';
import { catchError, concatMap, finalize, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { PostFacultyBiosRequest } from '@shared/service-proxies/service-proxies';
import { ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { ExtendedSchoolInfoResponse } from '@app/shared/common/apis/generated/content';
import { v4 as uuidv4 } from 'uuid';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { AppConsts } from '@shared/AppConsts';
@Component({
    selector: 'app-edit-faculty-members',
    templateUrl: './edit-faculty-members.component.html',
    styleUrls: ['./edit-faculty-members.component.css'],
    animations: [appModuleAnimation()],
})
export class EditFacultyMembersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Input() facultyMemberDOMElement;
    @ViewChild('editFacultyMemberModal', { static: true }) modal: ModalDirective;
    @ViewChild('cropImageModal', { static: true }) cropImageModal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('clearSpotlightedFacultyModal', { static: true })
    clearSpotlightedModal: GoddardConfirmationModalComponent;
    @ViewChild('facultyImgFile') facultyImgFile: ElementRef;
    @ViewChild('facultyMemberForm') facultyMemberForm: NgForm;
    modalType = ModalType;
    facultyMember: FacultyBios | undefined;
    originalFacultyMember: FacultyBios | undefined;
    _selectedFaculty: FacultyBios | undefined;
    imageChangedEvent: any = '';
    croppedImage: ImageCroppedEvent | undefined;
    selectedImage: any;
    changeFacultyImage = false;
    deleteImageSelected = false;
    cropperScale = 1;
    cropperRotation = 0;
    cropperTramsform: ImageTransform = {};
    imageUrlOrBase64: string = '';
    imgBlob: Blob;
    maxBiographyLength: number = 1000;
    acceptedFileTypes: string = '.jpg,.jpeg,.png'; //Comma delimited accepted file extensions
    defaultImageFormat: string = 'jpeg'; //Default format to configure cropper and set the file name correctly
    thumbnailUrl = '';
    JOB_CATEGORIES: { id: string; text: string; alternateText: string }[] = [
        { id: '', text: 'Select Job Title', alternateText: '' },
        { id: '2', text: 'Assistant Teacher', alternateText: 'AssistantTeacher' },
        { id: '3', text: 'Director', alternateText: 'Director' },
        { id: '5', text: 'Lead Teacher', alternateText: 'LeadTeacher' },
        { id: '10', text: 'Owner', alternateText: 'Owner' },
        { id: '11', text: 'Assistant Director', alternateText: 'AssistantDirector' },
        { id: '12', text: 'Resource', alternateText: 'Resource' },
    ];
    tooltips = AppConsts.TOOLTIPS;
    private _school: ExtendedSchoolInfoResponse;

    constructor(
        injector: Injector,
        private facultyApiClientFacade: FacultyApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _contentAPI: ContentApiClientFacade,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.addSubscription(
            this._siteEditorService.currentFacultySubject.subscribe((facultyBios) => {
                // Re-initialize state variables
                this.changeFacultyImage = false;
                this.deleteImageSelected = false;
                this.cropperScale = 1;
                this.cropperRotation = 0;
                this.imageUrlOrBase64 = '';
                this.thumbnailUrl = '';
                this._selectedFaculty = facultyBios;
                this.imageUrlOrBase64 = '';
                this.getFacultyMemberObservable().subscribe(this.setFacultyMemberAndOpenModal, this.displayError);
            })
        );

        this.addSubscription(
            this._contentAPI
                .getSchool(this.appSession.school.crmId)
                .pipe(catchError((error) => abp.message.error(this.l('AnErrorOccurred'), this.l('Error'))))
                .subscribe((school) => {
                    this._school = school;
                })
        );
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    saveFacultyMember() {
        //trigger form validation since form submit is enabled
        //https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/13932
        this.facultyMemberForm.form.markAllAsTouched();
        if (!this.facultyMemberForm.form.valid) {
            return;
        }

        this._siteEditorService.showSpinner(true);

        if (!this.facultyMember.isSpotlighted) {
            // Faculty member is not marked to be spotlighted

            // Can save without checking if another member is spotlighted
            this.saveCurrentFaculty();

            return;
        }

        // Faculty member is spotlighted
        // Show modal if another member is spotlighted
        this.isAnotherFacultyMemberSpotlighted().subscribe(
            (isSpotlighted) => {
                if (!isSpotlighted) {
                    // There is no one else spotlighted

                    // No need to show modal
                    this.saveCurrentFaculty();
                    return;
                }

                // Another faculty member is spotlighted

                // Show modal confirming that we want to switch spotlighted
                // faculty member
                this._siteEditorService.showSpinner(false);
                this.showClearSpotlightedModal();
            },
            (error) => {
                abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
            }
        );
    }

    /**
     * On confirmation it is okay to clear previous spotlighted faculty member
     */
    public onConfirmClearPreviousSpotlightedFaculty() {
        this._siteEditorService.showSpinner(true);

        this.closeClearSpotlightedModal();

        // Saving current faculty member
        // 20220106RBP - No need to clear previous spotlighted faculty member
        // because it is being handled in the stored procedure
        this.saveCurrentFaculty();
    }

    private isAnotherFacultyMemberSpotlighted(): Observable<boolean> {
        // Find if there is another faculty member that is spotlighted
        return this.facultyApiClientFacade.getFaculty(this.appSession.school.fmsId, 1, 1000).pipe(
            map((response) => {
                return response.items?.some((x) => x.isSpotlighted && x.id !== this.facultyMember.id);
            })
        );
    }

    /**
     * Inner save that does _not_ check if there is another spotlighted faculty member
     */
    private saveCurrentFaculty() {
        // If there is an image to be uploaded:
        if (this.changeFacultyImage === true && !this.isDefaultFacultyImage()) {
            this.uploadImageAndSaveFacultyMember();
        } else {
            //if user selects to delete the image but is a legacy image
            // just clear out the image to run standard save pipeline
            if (this.deleteImageSelected && this.facultyMember.isLegacyImage) {
                this.facultyMember.photoUrl = '';
            }

            //delete AEM Faculty image and then save the faculty member
            if (this.deleteImageSelected && !this.facultyMember.isLegacyImage) {
                this.deleteImageAndSaveFacultyMember();
            } else {
                //run standard save faculty member pipeline
                this.updateFacultyMember();
            }
        }
    }

    private updateFacultyMember() {
        //post only the filename as the photoUrl to not break API compatibility
        if (this.facultyMember.isLegacyImage && this.facultyMember.photoUrl) {
            this.facultyMember.photoUrl = this.facultyMember.photoUrl.split('/').pop().trim();
        }
        this.saveFacultyObservable()
            .pipe(
                finalize(() => {
                    this._siteEditorService.showSpinner(false);
                })
            )
            .subscribe(
                () => {
                    this.onSuccessSavingFaculty();
                },
                (error) => {
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                }
            );
    }

    private deleteImageAndSaveFacultyMember() {
        this.facultyApiClientFacade
            .deleteFacultyImage(this.facultyMember)
            .pipe(
                tap((resp) => console.log('[DELETE IMAGE RESPONSE]: ' + JSON.stringify(resp))),
                concatMap((resp) => {
                    this.facultyMember.photoUrl = '';
                    return this.saveFacultyObservable();
                }),
                finalize(() => {
                    this._siteEditorService.showSpinner(false);
                })
            )
            .subscribe(
                () => {
                    this.onSuccessSavingFaculty();
                },
                (error) => {
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                }
            );
    }

    private uploadImageAndSaveFacultyMember() {
        this._school.facultyDamPath;

        /*
         * First upload the new image, delete the old image, and concatenate the responses so that if every call succeed
         * we update the faculty member
         */
        // Set the image filename with a timestamp to make them all unique
        let newImageFilename = `${this.facultyMember.facultyFileNameId}-${new Date().getTime()}.${
            this.defaultImageFormat
        }`;

        this._contentAPI
            .uploadAsset(this.appSession.school.crmId, this._school.facultyDamPath, newImageFilename, this.imgBlob)
            .pipe(
                tap((resp) => console.log('[UPLOAD IMAGE RESPONSE]: ' + JSON.stringify(resp))),
                concatMap((value) => {
                    if (!this.facultyMember.isLegacyImage) {
                        return this.facultyApiClientFacade.deleteFacultyImage(this.facultyMember);
                    }

                    return of({});
                }),
                concatMap((_): any => {
                    return this.getFacultyMemberObservable().pipe(
                        map((response) => {
                            this.setFacultyMemberImagePath(response);
                        })
                    );
                }),
                concatMap((_) => {
                    return this.saveFacultyObservable();
                }),
                finalize(() => {
                    this._siteEditorService.showSpinner(false);
                })
            )
            .subscribe(
                () => {
                    this.onSuccessSavingFaculty();
                },
                (error) => {
                    console.log(error);
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                }
            );
    }

    private saveFacultyObservable() {
        return this.facultyApiClientFacade.saveFaculty([PostFacultyBiosRequest.fromJS({ ...this.facultyMember })]);
    }

    private onSuccessSavingFaculty() {
        this.close();
        this.save.emit(true);

        // analytics
        this._angulartics2.eventTrack.next({
            action: 'Faculty',
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this._appSessionService.school?.advertisingName,
            },
        });
    }

    getFacultyMemberObservable(): Observable<FacultyBios> {
        this.spinnerService.show();
        return this.facultyApiClientFacade
            .getFacultyById(this._selectedFaculty.id)
            .pipe(finalize(() => this.spinnerService.hide()));
    }

    setFacultyMemberAndOpenModal = (response: FacultyBios): void => {
        this.facultyMember = response;
        if (!this.facultyMember.jobTitle) {
            this.facultyMember.jobTitle = this.facultyMember.facultyTitleDisplay;
        }
        this.originalFacultyMember = { ...response };

        //check if employee does not have an image associated with or is the default Faculty image
        if (
            !this.facultyMember?.photoUrl ||
            this._selectedFaculty.photoUrl?.includes(SiteEditorConstants.FACULTY_FALLBACK_IMAGE_NAME)
        ) {
            this.imageUrlOrBase64 = `${SiteEditorConstants.FACULTY_FALLBACK_IMAGE}`;
        } else {
            this.imageUrlOrBase64 = `${this.facultyMember.photoUrl}?cacheRefreshId=${uuidv4()}`;
        }

        this.openModal();
    };

    setFacultyMemberImagePath = (response: FacultyBios): void => {
        this.facultyMember.photoUrl = response.photoUrl;
    };

    displayError = (error: any): void => {
        console.log(error);
        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
    };

    openModal() {
        this.modal.show();
    }

    close() {
        this.modal.hide();
    }

    showDiscardChangesModal(): void {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.close();
        }
    }

    pendingChanges(): boolean {
        //Compare to validate if changed
        return (
            this.changeFacultyImage || JSON.stringify(this.facultyMember) !== JSON.stringify(this.originalFacultyMember)
        );
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        this.facultyMember = { ...this.originalFacultyMember };
        this.closeDiscardChangesModal();
        this.close();
    }

    /*IMAGE CROPPER */

    onPickImage(): void {
        this.facultyImgFile.nativeElement.click();
    }

    onFileDropped(event) {
        const ext = event.dataTransfer.files[0].name.substring(event.dataTransfer.files[0].name.lastIndexOf('.'));
        if (this.validateFileType(ext)) {
            this.imageChangedEvent = event;
            this.selectedImage = event.dataTransfer.files[0];
            this.imageLoaded();
        }
    }

    fileChangeEvent(event: any): void {
        const ext = event.target.files[0].name.substring(event.target.files[0].name.lastIndexOf('.'));
        if (this.validateFileType(ext)) {
            this.imageChangedEvent = event;
            this.selectedImage = event.target.files[0];
            // reset the input field to allow user to re-add the same file
            event.target.value = '';
            this.imageLoaded();
        }
    }

    showCropImageModal() {
        this.cropImageModal.show();
    }

    closeCropImageModal() {
        this.resetImage();
        this.cropImageModal.hide();
    }

    onSelectImageChanges(): void {
        this.changeFacultyImage = true;

        //Change faculty image in the faculty edit modal to reflect image-edited selected
        this.imageUrlOrBase64 = this.croppedImage.base64;
        fetch(this.imageUrlOrBase64)
            .then((res) => res.blob())
            .then((bl) => {
                this.imgBlob = bl;
            });
        this.closeCropImageModal();
    }

    onClearImageChanges(): void {
        this.changeFacultyImage = false;

        //update back the faculty image in the faculty edit modal with the user original photo
        this.imageUrlOrBase64 = this.originalFacultyMember.photoUrl;
    }

    imageLoaded() {
        // show cropper
        this.showCropImageModal();
    }

    loadImageFailed() {
        // show message
    }

    cropperReady() {
        // cropper ready
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event;
        this.thumbnailUrl = event.base64;
    }

    resetImage() {
        this.cropperScale = 1;
        this.cropperRotation = 0;
        this.cropperTramsform = {};
    }

    zoomImage(event: any) {
        this.cropperScale = event.target.value;
        this.cropperTramsform = {
            ...this.cropperTramsform,
            scale: this.cropperScale,
        };
    }

    rotateImage(event: any) {
        this.cropperRotation = event.target.value;
        this.cropperTramsform = {
            ...this.cropperTramsform,
            rotate: this.cropperRotation,
        };
    }

    private validateFileType(ext: string): boolean {
        const validFileType = this.acceptedFileTypes.split(',').includes(ext.toLowerCase());
        if (!validFileType) {
            abp.message.warn(this.l('FacultyImage_Warn_FileType'));
        }
        return validFileType;
    }

    showClearSpotlightedModal(): void {
        this.clearSpotlightedModal.show();
    }

    closeClearSpotlightedModal() {
        this.clearSpotlightedModal.hide();
    }

    isDefaultFacultyImage(): boolean {
        return this.imageUrlOrBase64?.includes(SiteEditorConstants.FACULTY_FALLBACK_IMAGE_NAME);
    }

    onDeleteImageClick(): void {
        abp.message.confirm('', this.l('Faculty_Delete_Image_Warning_Message'), (result: boolean) => {
            if (result) {
                this.imageUrlOrBase64 = SiteEditorConstants.FACULTY_FALLBACK_IMAGE;
                this.deleteImageSelected = true;
            }
        });
    }

    highlightRemainingCharactersLabel(): boolean {
        return this.facultyMember.biography?.length > this.maxBiographyLength;
    }
}

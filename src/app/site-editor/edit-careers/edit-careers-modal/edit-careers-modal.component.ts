import { ModalType } from './../../../shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { Component, Injector, ViewChild, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { GoddardConfirmationModalComponent } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { SiteEditorService } from '@app/site-editor/services';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CareersApiClientFacade } from '@shared/service-proxies/careers-api-client-facade';
import { DateTime } from 'luxon';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Editor } from 'primeng/editor';
import { finalize } from 'rxjs/operators';
import { ApiException, Career } from '../../../../shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'edit-careers-modal',
    templateUrl: './edit-careers-modal.component.html',
    styleUrls: ['./edit-careers-modal.component.css'],
    animations: [appModuleAnimation()],
})
export class EditCareersModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<Career> = new EventEmitter<Career>();
    @ViewChild('CareerModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('shortDescription') editor: Editor;
    enabledDates: Date[] = [];
    dateFormat = SiteEditorConstants.DEFAULT_DATE_FORMAT;
    // customized config
    datePickerConfig = SiteEditorConstants.DEFAULT_DATEPICKER_CONFIG;
    maxDescriptionLength = 4000;
    currentCareerSubscription: any;
    career: Career;
    originalCareer: Career;
    descriptionHolder: string; //retain description to validate and prevent user to enter more than the max allowed characters
    positionTypes: { value: number; text: string }[] = [
        { value: 1, text: 'Full-Time' },
        { value: 2, text: 'Part-Time' },
    ];
    editorFormatsWhitelist: string[] = ['link', 'bold', 'italic'];
    tooltips = AppConsts.TOOLTIPS;

    remainingCharacters(): number {
        if (!this.career?.shortDescription?.length) {
            return this.maxDescriptionLength;
        }

        let remaining = this.maxDescriptionLength - this.career?.shortDescription?.length;
        return remaining > 0 ? remaining : 0;
    }
    modalType = ModalType;

    constructor(
        injector: Injector,
        private _careersClientFacade: CareersApiClientFacade,
        private _siteEditorService: SiteEditorService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.enabledDates = this._siteEditorService.fillinEnabledDates(
            SiteEditorConstants.maxCareersEnabledCalendarDates
        );
        this.currentCareerSubscription = this._siteEditorService.currentCareerSubject.subscribe((career) => {
            this.setConvertedCareerModalData(career);
            this.originalCareer = Career.fromJS({ ...career });
            this.open();
            let quill = this.editor['valueAccessor']['quill'];
            quill['formats'] = this.editorFormatsWhitelist;
        });
    }

    private setConvertedCareerModalData(career: Career) {
        this.career = career;
        if (!this.career?.shortDescription) {
            this.career.shortDescription = '';
        }

        //Wrap not formatted html strings same a quill.js to show the correct remaining characters
        if (!this.career?.shortDescription?.startsWith('<p>')) {
            this.career.shortDescription = `<p>${this.career?.shortDescription}</p>`;
        }

        this.descriptionHolder = this.career.shortDescription;
    }

    ngOnDestroy(): void {
        this.currentCareerSubscription?.unsubscribe();
    }

    saveCareer(): void {
        this._siteEditorService.showSpinner(true);

        //Setting default values for new careers
        if (this.career.id === undefined) {
            this.career.schoolId = Number(this.appSession.school.fmsId);
            this.career.version = 1;
            this.career.isSystemGenerated = false;
        }

        /*
            When the Save for Later option is selected:
                The isActive flag should be set to false and the Publish Date should be sent as empty.
        */
        if (!this.career.isActive) {
            this.career.publishDate = undefined;
        }

        this._careersClientFacade
            .saveCareer(this.career)
            .pipe(finalize(() => this._siteEditorService.showSpinner(false)))
            .subscribe(
                (response) => {
                    this.close();
                    this.save.emit(response);
                },
                (error: ApiException) => {
                    //handling gracefully duplicate errors
                    if (error?.response?.includes(this.l('PostingCareerExistsErrorMessage'))) {
                        abp.message.error(this.l('PostingCareerExistsErrorMessage'), this.l('Error'));
                    } else {
                        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                    }
                }
            );
    }

    open() {
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

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    pendingChanges(): boolean {
        //Ensure comparing dates
        const careerPublishDate = this.career.publishDate
            ? new Date(this.career.publishDate.toString()).toLocaleDateString()
            : undefined;
        const originalCareerPublishDate = this.originalCareer.publishDate
            ? new Date(this.originalCareer.publishDate.toString()).toLocaleDateString()
            : undefined;

        //Compare to validate if changed
        let equals =
            this.career.position !== this.originalCareer.position ||
            this.career.positionType !== this.originalCareer.positionType ||
            this.career.shortDescription !== this.originalCareer.shortDescription ||
            this.career.isActive !== this.originalCareer.isActive ||
            careerPublishDate !== originalCareerPublishDate;

        return equals;
    }

    discardChanges() {
        this.career = Career.fromJS({ ...this.originalCareer });
        this.closeDiscardChangesModal();
        this.close();
    }

    /**
     * workaround to prevent user to enter more than the max characters
     * credits from https://stackoverflow.com/questions/42803413/how-can-i-set-character-limit-in-quill-editor
     */
    onDescriptionChange(context: any): void {
        if (!context || !context.htmlValue) {
            return;
        }

        let quill = this.editor['valueAccessor']['quill'];

        if (context.htmlValue.length > this.maxDescriptionLength) {
            const delta = quill.clipboard.convert(this.descriptionHolder);
            quill.setContents(delta, 'user');
        } else {
            this.descriptionHolder = context.htmlValue;
        }
        //this gives some time to allow user to see the message when reached the max characters and then revert it back
        setTimeout(() => {
            this.career.shortDescription = this.descriptionHolder;
        }, 2000);
    }

    onDisplayOnWebsiteClick(): void {
        //if user is updating and existent career that was 'saved for later'
        if (this.originalCareer.id && !this.originalCareer.isActive) {
            if (!this.career.publishDate) {
                //set default publish date to Today's date
                this.career.publishDate = DateTime.local();
            }
        }
    }
}

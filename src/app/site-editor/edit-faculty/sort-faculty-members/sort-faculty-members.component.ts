import { Component, Injector, ViewChild, OnInit, EventEmitter, Output } from '@angular/core';
import { FacultyBios } from '@app/shared/common/apis/generated/faculty';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { SiteEditorService } from '@app/site-editor/services';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FacultyApiClientFacade } from '@shared/service-proxies/faculty-api-client-facade.service';
import { PostFacultyBiosRequest } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-sort-faculty-members',
    templateUrl: './sort-faculty-members.component.html',
    styleUrls: ['./sort-faculty-members.component.css'],
    animations: [appModuleAnimation()],
})
export class SortFacultyMembersComponent extends AppComponentBase implements OnInit {
    @ViewChild('sortFacultyMemberModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    modalType = ModalType;
    _facultyMembers: FacultyBios[] = [];
    _originalFacultyMembers: FacultyBios[] = [];

    constructor(
        injector: Injector,
        private facultyApiClientFacade: FacultyApiClientFacade,
        private _siteEditorService: SiteEditorService
    ) {
        super(injector);
    }

    ngOnInit(): void {}

    public loadFacultyMembersAndOpenModal() {
        this._siteEditorService.showSpinner(true);
        this.addSubscription(
            this.facultyApiClientFacade
                .getFaculty(this.appSession.school.fmsId, 1, 1000)
                .pipe(
                    finalize(() => {
                        this._siteEditorService.showSpinner(false);
                    })
                )
                .subscribe(
                    (response) => {
                        this._facultyMembers = response.items;
                        this._originalFacultyMembers = [...this._facultyMembers];
                        this.openModal();
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }

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
        return JSON.stringify(this._originalFacultyMembers) !== JSON.stringify(this._facultyMembers);
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        this.closeDiscardChangesModal();
        this.close();
    }

    onReorderFacultyMember(reorderEvent: { dragIndex: number; dropIndex: number }): void {
        if (reorderEvent.dropIndex !== reorderEvent.dragIndex) {
            for (let index = 0; index < this._facultyMembers.length; index++) {
                this._facultyMembers[index].ordinal = index + 1;
            }
        }
    }

    saveFacultyMembers(): void {
        this._siteEditorService.showSpinner(true);
        this.addSubscription(
            this.facultyApiClientFacade
                .saveFaculty([
                    ...this._facultyMembers.map((member) => {
                        return PostFacultyBiosRequest.fromJS({ ...member });
                    }),
                ])
                .pipe(
                    finalize(() => {
                        this._siteEditorService.showSpinner(false);
                    })
                )
                .subscribe(
                    (response) => {
                        this.close();
                        this.save.emit(true);
                    },
                    (error) => {
                        abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                    }
                )
        );
    }
}

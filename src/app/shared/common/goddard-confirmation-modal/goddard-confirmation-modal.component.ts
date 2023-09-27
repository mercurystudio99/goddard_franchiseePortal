import { Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

export enum ModalType {
    Information = 1,
    Success = 2,
    Warning = 3,
    Alert = 4,
    DiscardChanges = 5,
}

@Component({
    selector: 'goddard-confirmation-modal',
    templateUrl: './goddard-confirmation-modal.component.html',
    styleUrls: ['./goddard-confirmation-modal.component.css'],
})
export class GoddardConfirmationModalComponent extends AppComponentBase implements OnInit {
    @ViewChild('discardChangesModal', { static: true }) modal: ModalDirective;
    @Output() accept: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() reject: EventEmitter<string> = new EventEmitter<string>(); // string is the source of the event
    @Input() modalType: ModalType = ModalType.Success;
    @Input() useDefaultsForType: boolean = false;
    @Input() title: string = '';
    @Input() messageBody: string = '';
    @Input() okButtonText: string;
    @Input() cancelButtonText: string;
    public color: string;
    public icon: string;

    public $confirmationSubject = new Subject<boolean>();
    $confirmationSubjectObservable = this.$confirmationSubject.asObservable();
    onUserConfirmation(confirm: boolean) {
        this.$confirmationSubject.next(confirm);
    }

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
        if (this.useDefaultsForType) {
            this.setDefaults();
        }
    }

    private setDefaults() {
        switch (this.modalType) {
            case ModalType.Warning:
                this.color = 'warning';
                this.icon = 'la la-exclamation-circle';
                this.title = this.l('WarningHeading');
                break;
            case ModalType.Success:
                this.color = 'success';
                this.icon = 'la la-check-circle';
                this.title = this.l('SuccessHeading');
                break;
            case ModalType.Information:
                this.color = 'tertiary';
                this.icon = 'la la-exclamation-circle';
                this.title = this.l('InformationHeading');
                break;
            case ModalType.Alert:
                this.color = 'secondary';
                this.title = this.l('AlertHeading');
                this.icon = 'la la-exclamation-circle';
                break;
            case ModalType.DiscardChanges:
                this.color = 'warning';
                this.icon = 'la la-exclamation-circle';
                this.title = this.title ? this.title : this.l('Warning!');
                this.messageBody = this.messageBody ? this.messageBody : this.l('DiscardChangesConfirmation');
                this.okButtonText = this.okButtonText ? this.okButtonText : this.l('DiscardOkButtonText');
                this.cancelButtonText = this.cancelButtonText
                    ? this.cancelButtonText
                    : this.l('DiscardCancelButtonText');
                break;
            default:
                this.color = 'warning';
                this.icon = 'la la-exclamation-circle';
                this.title = this.l('WarningHeading');
                break;
        }
    }

    show() {
        this.modal.show();
    }

    hide() {
        this.modal.hide();
    }

    confirm() {
        this.accept.emit(true);
        this.onUserConfirmation(true);
        this.hide();
    }

    cancel(event: string) {
        this.reject.emit(event);
        this.onUserConfirmation(false);
        this.hide();
    }
}

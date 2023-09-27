import { Component, ViewChild, Injector, Output, EventEmitter, OnInit, ElementRef} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { ResourceLinksServiceProxy, CreateOrEditResourceLinkDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DateTime } from 'luxon';

             import { DateTimeService } from '@app/shared/common/timing/date-time.service';



@Component({
    selector: 'createOrEditResourceLinkModal',
    templateUrl: './create-or-edit-resourceLink-modal.component.html'
})
export class CreateOrEditResourceLinkModalComponent extends AppComponentBase implements OnInit{

    @ViewChild('createOrEditModal', { static: true }) modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    resourceLink: CreateOrEditResourceLinkDto = new CreateOrEditResourceLinkDto();

    constructor(
        injector: Injector,
        private _resourceLinksServiceProxy: ResourceLinksServiceProxy,
             private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    show(resourceLinkId?: number): void {


        if (!resourceLinkId) {
            this.resourceLink = new CreateOrEditResourceLinkDto();
            this.resourceLink.id = resourceLinkId;


            this.active = true;
            this.modal.show();
        } else {
            this._resourceLinksServiceProxy.getResourceLinkForEdit(resourceLinkId).subscribe(result => {
                this.resourceLink = result.resourceLink;



                this.active = true;
                this.modal.show();
            });
        }


    }

    save(): void {
            this.saving = true;



            this._resourceLinksServiceProxy.createOrEdit(this.resourceLink)
             .pipe(finalize(() => { this.saving = false;}))
             .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
             });
    }













    close(): void {
        this.active = false;
        this.modal.hide();
    }

     ngOnInit(): void {

     }
}

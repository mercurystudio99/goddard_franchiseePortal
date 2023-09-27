import {AppConsts} from "@shared/AppConsts";
import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { GetResourceLinkForViewDto, ResourceLinkDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'viewResourceLinkModal',
    templateUrl: './view-resourceLink-modal.component.html'
})
export class ViewResourceLinkModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal', { static: true }) modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    item: GetResourceLinkForViewDto;


    constructor(
        injector: Injector
    ) {
        super(injector);
        this.item = new GetResourceLinkForViewDto();
        this.item.resourceLink = new ResourceLinkDto();
    }

    show(item: GetResourceLinkForViewDto): void {
        this.item = item;
        this.active = true;
        this.modal.show();
    }
    
    

    close(): void {
        this.active = false;
        this.modal.hide();
    }
}

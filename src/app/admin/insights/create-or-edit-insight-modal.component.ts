import { Component, ViewChild, Injector, Output, EventEmitter, OnInit, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { InsightsServiceProxy, CreateOrEditInsightDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';

@Component({
    selector: 'createOrEditInsightModal',
    templateUrl: './create-or-edit-insight-modal.component.html',
})
export class CreateOrEditInsightModalComponent extends AppComponentBase implements OnInit {
    @ViewChild('createOrEditModal', { static: true }) modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    insight: CreateOrEditInsightDto = new CreateOrEditInsightDto();
    maxHeaderLength = 68;
    maxBodyLength = 70;
    remainingHeaderCharacters(): number {
        if (!this.insight?.header?.length) {
            return this.maxHeaderLength;
        }
        let remaining = this.maxHeaderLength - this.insight?.header?.length;
        return remaining > 0 ? remaining : 0;
    }
    remainingBodyCharacters(): number {
        if (!this.insight?.body?.length) {
            return this.maxBodyLength;
        }
        let remaining = this.maxBodyLength - this.insight?.body?.length;
        return remaining > 0 ? remaining : 0;
    }

    constructor(
        injector: Injector,
        private _insightsServiceProxy: InsightsServiceProxy,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    show(insightId?: number): void {
        if (!insightId) {
            this.insight = new CreateOrEditInsightDto();
            this.insight.id = insightId;

            this.active = true;
            this.modal.show();
        } else {
            this._insightsServiceProxy.getInsightForEdit(insightId).subscribe((result) => {
                this.insight = result.insight;

                this.active = true;
                this.modal.show();
            });
        }
    }

    save(): void {
        this.saving = true;

        this._insightsServiceProxy
            .createOrEdit(this.insight)
            .pipe(
                finalize(() => {
                    this.saving = false;
                })
            )
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

    ngOnInit(): void {}
}

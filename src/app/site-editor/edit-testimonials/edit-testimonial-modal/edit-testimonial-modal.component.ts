import { ActivatedRoute } from '@angular/router';
import { Component, Injector, ViewChild, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { SiteEditorService } from '@app/site-editor/services';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TestimonialsApiClientFacade } from '@shared/service-proxies/testimonials-api-client-facade';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TestimonialDto } from '@shared/service-proxies/service-proxies';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'edit-testimonial-modal',
    templateUrl: './edit-testimonial-modal.component.html',
    styleUrls: ['./edit-testimonial-modal.component.css'],
    animations: [appModuleAnimation()],
})
export class EditTestimonialModalComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<TestimonialDto> = new EventEmitter<TestimonialDto>();
    @ViewChild('testimonialModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    modalType = ModalType;
    testimonial: TestimonialDto;
    originalTestimonial: TestimonialDto;
    throwApiError: boolean | undefined = false;
    currentTestimonialSubscription: any;
    throwErrSubscription: any;

    get programs() {
        return SiteEditorConstants.getPrograms();
    }

    constructor(
        injector: Injector,
        private _siteEditorService: SiteEditorService,
        private _testimonialsFacadeAPI: TestimonialsApiClientFacade,
        private activatedRoute: ActivatedRoute,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.currentTestimonialSubscription = this._siteEditorService.currentTestimonialSubject.subscribe(
            (testimonial) => {
                this.testimonial = testimonial;
                this.originalTestimonial = TestimonialDto.fromJS({ ...testimonial });
                this.open();
            }
        );
        if (!environment.production) {
            this.throwErrSubscription = this.activatedRoute.queryParams.subscribe((params) => {
                this.throwApiError = Boolean(params['throwApiError']);
            });
        }
    }

    // Unsubscribing from these fixes the backdrop not hiding correctly.  See:
    // https://github.com/valor-software/ngx-bootstrap/issues/1139#issuecomment-357296408
    ngOnDestroy(): void {
        this.currentTestimonialSubscription?.unsubscribe();
        // if environment == production we're not binding to the throwErrorSubscription
        this.throwErrSubscription?.unsubscribe();
    }

    saveTestimonial(): void {
        this.spinnerService.show('content');
        this._testimonialsFacadeAPI
            .saveTestimonial(this.testimonial, this.throwApiError)
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (response) => {
                    this.close();
                    this.save.emit(this.testimonial);

                    // analytics
                    this._angulartics2.eventTrack.next({
                        action: 'Testimonial Publish',
                        properties: {
                            category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                            label: this._appSessionService.school?.advertisingName,
                        },
                    });
                },
                (error) => {
                    console.log(error);
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
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
        //Compare to validate if changed
        return JSON.stringify(this.testimonial) !== JSON.stringify(this.originalTestimonial);
    }

    discardChanges() {
        this.testimonial = TestimonialDto.fromJS({ ...this.originalTestimonial });
        this.closeDiscardChangesModal();
        this.close();
    }

    allowNumbersOnly(event) {
        const seperator = '^([0-9])';
        const maskSeperator = new RegExp(seperator, 'g');
        let result = maskSeperator.test(event.key);
        return result;
    }
}

import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { Testimonial } from '@app/shared/common/apis/generated/testimonials';
import { SiteEditorService } from '@app/site-editor/services';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TestimonialDto } from '@shared/service-proxies/service-proxies';
import { TestimonialsApiClientFacade } from '@shared/service-proxies/testimonials-api-client-facade';
import { finalize } from 'rxjs/operators';
import { EditTestimonialModalComponent } from '../edit-testimonial-modal/edit-testimonial-modal.component';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './edit-testimonials-published.component.html',
    styleUrls: ['./edit-testimonials-published.component.css'],
})
export class EditTestimonialsPublishedComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('editTestimonialModal') editTestimonialModal: EditTestimonialModalComponent;
    testimonials: Testimonial[] = [];
    maxContentLength = SiteEditorConstants.maxTestimonialContent;
    tooltips = AppConsts.TOOLTIPS;

    constructor(
        injector: Injector,
        private _testimonialsFacadeAPI: TestimonialsApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        this.getTestimonials();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    getTestimonials(): void {
        this.spinnerService.show('content');
        this.addSubscription(
            this._testimonialsFacadeAPI
                .getPublishedTestimonials(this.appSession.school.fmsId, 1, 1000)
                .pipe(finalize(() => this.spinnerService.hide('content')))
                .subscribe(
                    (response) => {
                        this.testimonials = response.items;
                    },
                    (error) => {
                        console.log(error);
                        abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                    }
                )
        );
    }

    unpublish(id: number): void {
        const testimonial = this.testimonials.find((x) => x.id === id);
        abp.message.confirm('', this.l('UnpublishTestimonialConfirmation', testimonial.headline), (result: boolean) => {
            if (result) {
                this.saveTestimonial(TestimonialDto.fromJS({ ...testimonial, activeFlag: false }));
            }
        });
    }

    showEditModal(id: number) {
        const testimonial = this.testimonials.find((x) => x.id === id);
        this._siteEditorService.setCurrentTestimonial(TestimonialDto.fromJS({ ...testimonial, activeFlag: true }));
    }

    onReorderTestimonial(reorderEvent: { dragIndex: number; dropIndex: number }): void {
        if (reorderEvent.dropIndex !== reorderEvent.dragIndex) {
            const testimonial = this.testimonials[reorderEvent.dropIndex];
            this.saveTestimonial(
                TestimonialDto.fromJS({ ...testimonial, activeFlag: true, ordinal: reorderEvent.dropIndex + 1 }),
                true
            );
        }
    }

    private saveTestimonial(testimonialDto: TestimonialDto, reloadTestimonialsOnError: boolean = false) {
        this.spinnerService.show('content');
        this._testimonialsFacadeAPI
            .saveTestimonial(testimonialDto)
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (_response) => {
                    this.onSaveTestimonial(testimonialDto);

                    // analytics
                    this._angulartics2.eventTrack.next({
                        action: 'Testimonial Unpublish',
                        properties: {
                            category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                            label: this._appSessionService.school?.advertisingName,
                        },
                    });
                },
                (error) => {
                    console.log(error);
                    abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title')).then(() => {
                        if (reloadTestimonialsOnError) {
                            this.getTestimonials();
                        }
                    });
                }
            );
    }

    onSaveTestimonial(testimonial: TestimonialDto): void {
        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.getTestimonials();
        });
    }
}

import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { EditTestimonialModalComponent } from './../edit-testimonial-modal/edit-testimonial-modal.component';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SiteEditorService } from '@app/site-editor/services';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TestimonialsApiClientFacade } from '@shared/service-proxies/testimonials-api-client-facade';
import { finalize } from 'rxjs/operators';
import { GetUnpublishedTestimonialResult } from '@app/shared/common/apis/generated/testimonials';
import { TestimonialDto } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './edit-testimonials-unpublished.component.html',
    styleUrls: ['./edit-testimonials-unpublished.component.css'],
})
export class EditTestimonialsUnpublishedComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('editTestimonialModal') editTestimonialModal: EditTestimonialModalComponent;
    testimonials: GetUnpublishedTestimonialResult[] = [];
    maxContentLength = SiteEditorConstants.maxTestimonialContent;

    constructor(
        injector: Injector,
        private _testimonialsFacadeAPI: TestimonialsApiClientFacade,
        private _siteEditorService: SiteEditorService
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
                .getUnPublishedTestimonials(this.appSession.school.fmsId, 1, 1000)
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

    showEditModal(systinoSurveyResponseId: string) {
        const testimonial = this.testimonials.find((x) => x.systinoSurveyResponseId === systinoSurveyResponseId);
        this._siteEditorService.setCurrentTestimonial(
            TestimonialDto.fromJS({
                id: null,
                activeFlag: true,
                fmsSchoolId: testimonial.fmsSchoolId,
                content: testimonial.content,
                children: testimonial.children,
                relationship: testimonial.relationship,
                parent: testimonial.parent,
                parentID: testimonial.parentId,
                systinoSurveyResponseId: testimonial.systinoSurveyResponseId,
                headline: '',
            })
        );
    }

    onSaveTestimonial(testimonial: TestimonialDto): void {
        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.getTestimonials();
        });
    }
}

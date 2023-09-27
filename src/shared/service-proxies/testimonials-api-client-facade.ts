import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
    GetUnpublishedTestimonialResultPagedResponse,
    TestimonialPagedResponse,
    TestimonialsService,
} from '@app/shared/common/apis/generated/testimonials';
import { catchError, tap } from 'rxjs/operators';
import { Testimonial, TestimonialDto, TestimonialsEditorServiceServiceProxy } from './service-proxies';

@Injectable({ providedIn: 'root' })
export class TestimonialsApiClientFacade {
    constructor(
        private _testimonialsAPI: TestimonialsService,
        private _testimonialsEditorServiceProxy: TestimonialsEditorServiceServiceProxy
    ) {}

    public getPublishedTestimonials(
        fmsSchoolId?: string,
        page?: number,
        pageSize?: number
    ): Observable<TestimonialPagedResponse> {
        return this._testimonialsAPI.apiV1TestimonialsGet(fmsSchoolId, page, pageSize).pipe(
            //tap((resp) => console.log('[TESTIMONIALS]: ' + JSON.stringify(resp))),
            catchError(this.handleError)
        );
    }

    public getUnPublishedTestimonials(
        fmsSchoolId?: string,
        page?: number,
        pageSize?: number
    ): Observable<GetUnpublishedTestimonialResultPagedResponse> {
        return this._testimonialsAPI.apiV1UnpublishedTestimonialsGet(fmsSchoolId, page, pageSize).pipe(
            //tap((resp) => console.log('[TESTIMONIALS]: ' + JSON.stringify(resp))),
            catchError(this.handleError)
        );
    }

    public saveTestimonial(
        testimonialDto: TestimonialDto,
        throwApiError?: boolean | undefined
    ): Observable<Testimonial> {
        if (throwApiError) {
            return this._testimonialsEditorServiceProxy.throwError();
        }

        return this._testimonialsEditorServiceProxy.saveTestimonial(testimonialDto).pipe(
            //tap((resp) => console.log('[TESTIMONIAL]: ' + JSON.stringify(resp))),
            catchError(this.handleError)
        );
    }

    private handleError(err: any) {
        console.error('[ERROR]: ' + JSON.stringify(err));
        return throwError(err);
    }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { TestimonialsApiClientFacade } from '@shared/service-proxies/testimonials-api-client-facade';
import { SiteEditorService } from '@app/site-editor/services/site-editor-service';
import { TestimonialsEditorServiceServiceProxy } from '@shared/service-proxies/service-proxies';
import { FormsModule } from '@angular/forms';
import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditTestimonialModalComponent } from '../edit-testimonial-modal/edit-testimonial-modal.component';

describe(' EditTestimonialModalComponent ', () => {
    let component: EditTestimonialModalComponent;
    let fixture: ComponentFixture<EditTestimonialModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                AppModule,
                UtilsModule,
                AppRoutingModule,
                RootModule,
                ServiceProxyModule,
                ModalModule,
                AppBsModalModule,
                HttpClientTestingModule,
                FormsModule,
            ],
            declarations: [EditTestimonialModalComponent],
            providers: [
                SiteEditorService,
                TestimonialsApiClientFacade,
                TestimonialsEditorServiceServiceProxy,
                { provide: LOCALE_ID, useValue: 'en' },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditTestimonialModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

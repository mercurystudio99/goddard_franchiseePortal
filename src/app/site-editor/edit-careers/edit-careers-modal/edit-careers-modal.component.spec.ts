import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { CareersApiClientFacade } from '@shared/service-proxies/careers-api-client-facade';
import { SiteEditorService } from '@app/site-editor/services/site-editor-service';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditCareersModalComponent } from './edit-careers-modal.component';

describe(' EditCareersModalComponent ', () => {
    let component: EditCareersModalComponent;
    let fixture: ComponentFixture<EditCareersModalComponent>;

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
                BsDatepickerModule,
            ],
            declarations: [EditCareersModalComponent],
            providers: [SiteEditorService, CareersApiClientFacade, { provide: LOCALE_ID, useValue: 'en' }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditCareersModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

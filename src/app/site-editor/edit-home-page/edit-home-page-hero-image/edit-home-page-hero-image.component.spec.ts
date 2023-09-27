import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditHomePageHeroImageComponent } from './edit-home-page-hero-image.component';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { IframeService } from '@app/shared/common/services/iframe-service';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { SiteEditorService } from '@app/site-editor/services/site-editor-service';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';

import { LOCALE_ID } from '@angular/core';

describe('EditHomePageHeroImageComponent', () => {
    let component: EditHomePageHeroImageComponent;
    let fixture: ComponentFixture<EditHomePageHeroImageComponent>;

    beforeEach(async () => {
        const iframeServiceSpy = jasmine.createSpyObj('IframeService', ['getCurrentIframe']);
        iframeServiceSpy.currentIframe = {
            subscribe: function () {},
        };

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
            ],
            declarations: [EditHomePageHeroImageComponent],
            providers: [
                SiteEditorService,
                { provide: IframeService, useValue: iframeServiceSpy },
                { provide: LOCALE_ID, useValue: 'en' },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditHomePageHeroImageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

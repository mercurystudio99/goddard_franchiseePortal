import { ComponentFixture, TestBed } from '@angular/core/testing';
/* Module Imports */
import { UtilsModule } from '@shared/utils/utils.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LOCALE_ID } from '@angular/core';

import { AppSessionService } from '@shared/common/session';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { IframeService } from '@app/shared/common/services/iframe-service';

import { GoddardPagePreviewComponent } from './goddard-page-preview.component';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe('GoddardPagePreviewComponent', () => {
    let component: GoddardPagePreviewComponent;
    let fixture: ComponentFixture<GoddardPagePreviewComponent>;

    beforeEach(async () => {
        const iframeServiceSpy = jasmine.createSpyObj('IframeService', ['getCurrentIframe']);
        iframeServiceSpy.currentIframe = {
            subscribe: function () {},
        };

        await TestBed.configureTestingModule({
            imports: [
                Angulartics2RouterlessModule.forRoot(),
                UtilsModule,
                ServiceProxyModule,
                AppBsModalModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
            ],
            declarations: [GoddardPagePreviewComponent],
            providers: [
                AppSessionService,
                AppUiCustomizationService,
                AppUrlService,
                { provide: IframeService, useValue: iframeServiceSpy },
                { provide: LOCALE_ID, useValue: 'en' },
                AppNavigationService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GoddardPagePreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

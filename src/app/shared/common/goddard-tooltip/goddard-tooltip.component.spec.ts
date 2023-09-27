import { ComponentFixture, TestBed } from '@angular/core/testing';
/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AppSessionService } from '@shared/common/session';
import { IframeService } from '@app/shared/common/services/iframe-service';
import { SiteEditorServiceProxy } from '@shared/service-proxies/service-proxies';

import { GoddardTooltipComponent } from './goddard-tooltip.component';
import { LOCALE_ID } from '@angular/core';

describe('GoddardTooltipComponent', () => {
    let component: GoddardTooltipComponent;
    let fixture: ComponentFixture<GoddardTooltipComponent>;

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
            ],
            declarations: [GoddardTooltipComponent],
            providers: [
                AppSessionService,
                IframeService,
                SiteEditorServiceProxy,
                { provide: LOCALE_ID, useValue: 'en' },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GoddardTooltipComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

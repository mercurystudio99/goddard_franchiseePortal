import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { SiteEditorService } from '@app/site-editor/services/site-editor-service';

import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditFeaturesComponent } from './edit-features.component';
import { GoddardTooltipComponent } from '@app/shared/common/goddard-tooltip/goddard-tooltip.component';
import { IframeService } from '@app/shared/common/services/iframe-service';

describe('EditFeaturesComponent', () => {
    let component: EditFeaturesComponent;
    let fixture: ComponentFixture<EditFeaturesComponent>;

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
            declarations: [EditFeaturesComponent, GoddardTooltipComponent],
            providers: [SiteEditorService, IframeService, { provide: LOCALE_ID, useValue: 'en' }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditFeaturesComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

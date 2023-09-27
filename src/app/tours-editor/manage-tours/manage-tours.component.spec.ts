import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LeadDto, SessionServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { AppUrlService } from '@shared/common/nav/app-url.service';

import { ToursEditorServiceServiceProxy, SchoolInfoDto } from '@shared/service-proxies/service-proxies';
import { ManageToursComponent } from './manage-tours.component';
import { ToursEditorService } from '../services/tours-editor.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LocalizePipe } from '@shared/common/pipes/localize.pipe';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { FormsModule } from '@angular/forms';
describe('ManageToursComponent', () => {
    let component: ManageToursComponent;
    let fixture: ComponentFixture<ManageToursComponent>;

    class AppSessionMock {
        get school(): SchoolInfoDto {
            return {
                crmId: 'abcd',
                fmsId: null,
                advertisingName: null,
                hours: null,
                address: null,
                init: null,
                toJSON: null,
                timeZone: 'Eastern Standard Time',
            };
        }
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                AppUiCustomizationService,
                SessionServiceProxy,
                { provide: AppSessionService, useClass: AppSessionMock },
                AppUrlService,
                AppLocalizationService,
                ServiceProxyModule,
                ToursEditorService,
                DateTimeService,
                ToursEditorServiceServiceProxy,
            ],
            imports: [
                Angulartics2RouterlessModule.forRoot(),
                HttpClientTestingModule,
                AppBsModalModule,
                ServiceProxyModule,
                AppCommonModule,
                FormsModule,
            ],
            declarations: [ManageToursComponent, LocalizePipe],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ManageToursComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

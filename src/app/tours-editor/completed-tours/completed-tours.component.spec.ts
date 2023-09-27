import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { CompletedToursComponent } from './completed-tours.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SchoolInfoDto, SessionServiceProxy, ToursEditorServiceServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ToursEditorService } from '../services/tours-editor.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { LocalizePipe } from '@shared/common/pipes';
import { AppBsModalModule } from '../../../shared/common/appBsModal/app-bs-modal.module';
import { ServiceProxyModule } from '../../../shared/service-proxies/service-proxy.module';
import { AppCommonModule } from '../../shared/common/app-common.module';
import { FormsModule } from '@angular/forms';

describe('CompletedToursComponent', () => {
    let component: CompletedToursComponent;
    let fixture: ComponentFixture<CompletedToursComponent>;

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
                timeZone: 'Eastern Standard Time'
            };
        }
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CompletedToursComponent, LocalizePipe],            
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
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CompletedToursComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

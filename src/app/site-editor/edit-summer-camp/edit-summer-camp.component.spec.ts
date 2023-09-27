import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { UtilsModule } from '@shared/utils/utils.module';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PagePreviewComponent } from '@app/site-editor/page-preview/page-preview.component';
import { AppSessionService } from '@shared/common/session/';
import { SchoolInfoDto } from '@shared/service-proxies/service-proxies';

import { IframeService, SiteEditorService } from '../services';
import { EditSummerCampComponent } from './edit-summer-camp.component';
import { GoddardIconsComponent } from '@app/shared/common/goddard-icons/goddard-icons.component';
import { EditSummerCampInfoComponent } from './edit-summer-camp-info/edit-summer-camp-info.component';
import { EditSummerCampEventsComponent } from './edit-summer-camp-events/edit-summer-camp-events.component';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe('EditSummerCampComponent', () => {
    let component: EditSummerCampComponent;
    let fixture: ComponentFixture<EditSummerCampComponent>;
    const iframeServiceSpy = jasmine.createSpyObj('IframeService', ['getCurrentIframe']);
    iframeServiceSpy.currentIframe = {
        subscribe: function () {},
    };
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
            imports: [
                ModalModule.forRoot(),
                AppBsModalModule,
                Angulartics2RouterlessModule.forRoot(),
                HttpClientTestingModule,
                NoopAnimationsModule,
                ServiceProxyModule,
                UtilsModule,
            ],
            declarations: [
                EditSummerCampComponent,
                EditSummerCampInfoComponent,
                EditSummerCampEventsComponent,
                PagePreviewComponent,
                GoddardIconsComponent,
            ],
            providers: [
                AppUiCustomizationService,
                AppUrlService,
                SiteEditorService,
                { provide: IframeService, useValue: iframeServiceSpy },
                { provide: AppSessionService, useClass: AppSessionMock },
                AppNavigationService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditSummerCampComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

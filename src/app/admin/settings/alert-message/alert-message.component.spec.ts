import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertMessageComponent } from './alert-message.component';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { AppSessionService } from '@shared/common/session';
import { SchoolInfoDto } from '@shared/service-proxies/service-proxies';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';

describe('AlertMessageComponent', () => {
    let component: AlertMessageComponent;
    let fixture: ComponentFixture<AlertMessageComponent>;
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
            declarations: [AlertMessageComponent],
            providers: [
                AppUiCustomizationService,
                AppUrlService,
                AppNavigationService,
                { provide: AppSessionService, useClass: AppSessionMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AlertMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppCommonModule } from '../../shared/common/app-common.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
/* Services */
import { LOCALE_ID } from '@angular/core';
import { SiteEditorService } from '@app/site-editor/services';

import { EditEventsComponent } from './edit-events.component';
import { LocalizePipe } from '@shared/common/pipes';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AppSessionService } from '@shared/common/session';

describe(' EditEventsComponent', () => {
    let component: EditEventsComponent;
    let fixture: ComponentFixture<EditEventsComponent>;

    beforeEach(async () => {

        await TestBed.configureTestingModule({
            imports: [
                ServiceProxyModule,
                HttpClientTestingModule,
                AppCommonModule.forRoot(),
                NoopAnimationsModule
            ],
            declarations: [EditEventsComponent, LocalizePipe],
            providers: [
                AppSessionService,
                AppUiCustomizationService,
                AppUrlService,
                SiteEditorService,
                { provide: LOCALE_ID, useValue: 'en' }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditEventsComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

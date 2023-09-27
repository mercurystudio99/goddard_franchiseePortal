import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { UtilsModule } from '@shared/utils/utils.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { SiteEditorService } from '@app/site-editor/services';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppCommonModule } from '@app/shared/common/app-common.module';

import { LOCALE_ID } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditEventsTemplatesComponent } from './edit-events-templates.component';
import { Angulartics2RouterlessModule }  from 'angulartics2/routerlessmodule';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AppSessionService } from '@shared/common/session';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe(' EditEventsTemplateComponent', () => {
    let component: EditEventsTemplatesComponent;
    let fixture: ComponentFixture<EditEventsTemplatesComponent>;

    beforeEach(async () => {

        await TestBed.configureTestingModule({
            imports: [
                UtilsModule,
                ServiceProxyModule,
                HttpClientTestingModule,
                Angulartics2RouterlessModule.forRoot()
            ],
            declarations: [EditEventsTemplatesComponent],
            providers: [
                AppSessionService,
                AppUiCustomizationService,
                AppUrlService,
                SiteEditorService,
                AppLocalizationService,
                DateTimeService,
                { provide: LOCALE_ID, useValue: 'en' },
                AppNavigationService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditEventsTemplatesComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

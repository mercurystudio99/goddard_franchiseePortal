import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventTemplateModalComponent } from './event-template-modal.component';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';

import { SiteEditorService } from '@app/site-editor/services/';
import { DescriptionLengthValidatorService, GetFromBetweenService, QuilljsExtensionsService } from '@shared/utils/';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { FormsModule } from '@angular/forms';
import { LocalizePipe } from '@shared/common/pipes';
import { AppSessionService } from '@shared/common/session';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';

describe('EventTemplateModalComponent', () => {
    let component: EventTemplateModalComponent;
    let fixture: ComponentFixture<EventTemplateModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EventTemplateModalComponent, LocalizePipe],
            imports: [
                ModalModule.forRoot(),
                AppBsModalModule,
                HttpClientTestingModule,
                ServiceProxyModule,
                AppCommonModule,
                FormsModule,
            ],
            providers: [
                AppSessionService,
                AppUrlService,
                AppUiCustomizationService,
                SiteEditorService,
                DescriptionLengthValidatorService,
                GetFromBetweenService,
                QuilljsExtensionsService,
                DateTimeService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EventTemplateModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

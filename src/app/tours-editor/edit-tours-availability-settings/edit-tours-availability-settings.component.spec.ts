import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FranchiseePortalCommonModule } from '@shared/common/common.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { EditToursAvailabilitySettingsComponent } from './edit-tours-availability-settings.component';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LocalizePipe } from '@shared/common/pipes/localize.pipe';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SchoolInfoDto } from '@shared/service-proxies/service-proxies';
import { AppCommonModule } from '@app/shared/common/app-common.module';

describe('EditToursAvailabilitySettingsComponent', () => {
    let component: EditToursAvailabilitySettingsComponent;
    let fixture: ComponentFixture<EditToursAvailabilitySettingsComponent>;

    let appSettingsStub: Partial<AppSessionService>;
    let schoolStub: Partial<SchoolInfoDto>;
    schoolStub = { crmId: 'abcd' };
    appSettingsStub = {
        school: schoolStub as SchoolInfoDto,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditToursAvailabilitySettingsComponent, LocalizePipe],
            imports: [
                AppCommonModule.forRoot(),
                Angulartics2RouterlessModule.forRoot(),
                FranchiseePortalCommonModule.forRoot(),
                ModalModule.forRoot(),
                AppBsModalModule,
                ServiceProxyModule,
                HttpClientTestingModule,
            ],
            providers: [{ provide: AppSessionService, useValue: appSettingsStub }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditToursAvailabilitySettingsComponent);

        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTeaserComponent } from './edit-teaser.component';

import { IframeService, SiteEditorService } from '../../services/';
import { FranchiseePortalCommonModule } from '@shared/common/common.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LocalizePipe } from '@shared/common/pipes/localize.pipe';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { FormsModule } from '@angular/forms';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe('EditTeaserComponent', () => {
    let component: EditTeaserComponent;
    let fixture: ComponentFixture<EditTeaserComponent>;

    beforeEach(async () => {
        const iframeServiceSpy = jasmine.createSpyObj('IframeService', ['getCurrentIframe']);
        iframeServiceSpy.currentIframe = {
            subscribe: function () {},
        };
        await TestBed.configureTestingModule({
            declarations: [EditTeaserComponent, LocalizePipe],
            imports: [
                Angulartics2RouterlessModule.forRoot(),
                FranchiseePortalCommonModule.forRoot(),
                ServiceProxyModule,
                HttpClientTestingModule,
                ModalModule.forRoot(),
                AppBsModalModule,
                FormsModule,
            ],
            providers: [
                SiteEditorService,
                { provide: IframeService, useValue: iframeServiceSpy },
                AppNavigationService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditTeaserComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

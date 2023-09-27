import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { UtilsModule } from '@shared/utils/utils.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';

import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditFacultyComponent } from './edit-faculty.component';
import { IframeService, SiteEditorService } from '../services';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { AppSessionService } from '@shared/common/session';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EditFacultyMembersComponent } from './edit-faculty-members/edit-faculty-members.component';
import { PagePreviewComponent } from '../page-preview/page-preview.component';
import { SaveButtonComponent } from '@app/site-editor/save-button/save-button.component';

import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ImageCropperModule } from 'ngx-image-cropper';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe('EditFacultyComponent', () => {
    let component: EditFacultyComponent;
    let fixture: ComponentFixture<EditFacultyComponent>;

    beforeEach(async () => {
        const iframeServiceSpy = jasmine.createSpyObj('IframeService', ['getCurrentIframe']);
        iframeServiceSpy.currentIframe = {
            subscribe: function () {},
        };

        await TestBed.configureTestingModule({
            imports: [
                Angulartics2RouterlessModule.forRoot(),
                UtilsModule,
                ServiceProxyModule,
                ModalModule.forRoot(),
                AppBsModalModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                FormsModule,
                TableModule,
                ImageCropperModule,
            ],
            declarations: [
                EditFacultyComponent,
                EditFacultyMembersComponent,
                PagePreviewComponent,
                SaveButtonComponent,
            ],
            providers: [
                AppSessionService,
                AppUiCustomizationService,
                AppUrlService,
                SiteEditorService,
                { provide: IframeService, useValue: iframeServiceSpy },
                { provide: LOCALE_ID, useValue: 'en' },
                AppNavigationService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditFacultyComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
/* Module Imports */
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { UtilsModule } from '@shared/utils/utils.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TextComponentDto, TitleComponentDto } from '@app/shared/common/apis/generated/content/model/models';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { SiteEditorService } from '@app/site-editor/services';
import { FacultyApiClientFacade } from '../../../../shared/service-proxies/faculty-api-client-facade.service';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { FormsModule } from '@angular/forms';
import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditSummerCampInfoComponent } from './edit-summer-camp-info.component';
import { AppSessionService } from '@shared/common/session';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { GoddardIconsComponent } from '@app/shared/common/goddard-icons/goddard-icons.component';
import { LocalizationService } from 'abp-ng2-module';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe(' EditSummerCampInfoComponent', () => {
    let component: EditSummerCampInfoComponent;
    let fixture: ComponentFixture<EditSummerCampInfoComponent>;

    let contentApiSpy: jasmine.SpyObj<ContentApiClientFacade>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('ContentApiClientFacade', ['getTextContent', 'getTitleContent']);

        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                UtilsModule,
                ServiceProxyModule,
                Angulartics2RouterlessModule.forRoot(),
                ModalModule.forRoot(),
                AppBsModalModule,
                HttpClientTestingModule,
            ],
            declarations: [EditSummerCampInfoComponent, GoddardIconsComponent],
            providers: [
                SiteEditorService,
                AppSessionService,
                AppUiCustomizationService,
                AppUrlService,
                FacultyApiClientFacade,
                LocalizationService,
                { provide: ContentApiClientFacade, useValue: spy },
                { provide: LOCALE_ID, useValue: 'en' },
                AppNavigationService,
            ],
        }).compileComponents();

        contentApiSpy = TestBed.inject(ContentApiClientFacade) as jasmine.SpyObj<ContentApiClientFacade>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditSummerCampInfoComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not detect changes if removing html tags isnt triggered with no apparent changes', () => {
        // Arrange
        component._school = {
            summerCampPageCustomHeadlineComponentPath: '/',
            summerCampPageCustomDescriptionComponentPath: '/',
        };
        const textComponent: TextComponentDto = { text: '<p>Test</p>' };
        const titleComponent: TitleComponentDto = { title: '<p>Test</p>' };

        component.modal.show = () => {};

        contentApiSpy.getTextContent.and.returnValue(of(textComponent));
        contentApiSpy.getTitleContent.and.returnValue(of(titleComponent));

        // Act
        component.openModal();

        // Assert no pending changes
        expect(component.pendingChanges()).toBe(false);
    });

    it('should trim leading white space', () => {
        // Arrange
        component._school = {
            summerCampPageCustomHeadlineComponentPath: '/',
            summerCampPageCustomDescriptionComponentPath: '/',
        };
        const textComponent: TextComponentDto = { text: ' <p>Test</p>' };
        const titleComponent: TitleComponentDto = { title: 'Test Title' };

        component.modal.show = () => {};

        contentApiSpy.getTextContent.and.returnValue(of(textComponent));
        contentApiSpy.getTitleContent.and.returnValue(of(titleComponent));

        // Act
        component.openModal();

        // Assert (p tag removed)
        expect(component.originalSummerCampInfo.description).toBe('Test');
    });
});

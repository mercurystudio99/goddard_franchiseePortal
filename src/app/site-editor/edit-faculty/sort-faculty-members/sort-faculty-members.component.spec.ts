import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { IframeService } from '@app/shared/common/services/iframe-service';
import { SiteEditorService } from '@app/site-editor/services';
import { FacultyApiClientFacade } from '../../../../shared/service-proxies/faculty-api-client-facade.service';
import { FormsModule } from '@angular/forms';
import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SortFacultyMembersComponent } from './sort-faculty-members.component';

describe(' EditFacultyMembersComponent', () => {
    let component: SortFacultyMembersComponent;
    let fixture: ComponentFixture<SortFacultyMembersComponent>;

    beforeEach(async () => {
        const iframeServiceSpy = jasmine.createSpyObj('IframeService', ['getCurrentIframe']);
        iframeServiceSpy.currentIframe = {
            subscribe: function () {},
        };
        await TestBed.configureTestingModule({
            imports: [
                AppModule,
                FormsModule,
                UtilsModule,
                AppRoutingModule,
                RootModule,
                ServiceProxyModule,
                ModalModule,
                AppBsModalModule,
                HttpClientTestingModule,
            ],
            declarations: [SortFacultyMembersComponent],
            providers: [
                SiteEditorService,
                FacultyApiClientFacade,
                { provide: LOCALE_ID, useValue: 'en' },
                { provide: IframeService, useValue: iframeServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SortFacultyMembersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

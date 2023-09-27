import { ComponentFixture, TestBed } from '@angular/core/testing';
/* Module Imports */
import { AppModule } from '@app/app.module';
import { SiteEditorModule } from '@app/site-editor/site-editor.module';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from '@app/app-routing.module';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { RootModule } from 'root.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FullCalendarModule } from '@fullcalendar/angular';
import { SiteEditorService } from '@app/site-editor/services/site-editor-service';
import { GoddardIconsComponent } from '@app/shared/common/goddard-icons/goddard-icons.component';


import { LOCALE_ID } from '@angular/core';

import { EditEventsCalendarComponent } from './edit-events-calendar.component';
import { EditEventModalComponent } from './edit-event-modal/edit-event-modal.component';
import { EventTemplateModalComponent } from '../edit-events-templates/event-template-modal/event-template-modal.component';

describe('EditEventsCalendarComponent', () => {
    let component: EditEventsCalendarComponent;
    let fixture: ComponentFixture<EditEventsCalendarComponent>;
    abp.localization.sources['FranchiseePortal'] = {};
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                AppModule,
                SiteEditorModule,
                AppRoutingModule,
                RootModule,
                ServiceProxyModule,
                ModalModule,
                OverlayPanelModule,
                AppBsModalModule,
                HttpClientTestingModule,
                BrowserAnimationsModule,
                FullCalendarModule,
                FormsModule
            ],
            declarations: [EditEventsCalendarComponent, GoddardIconsComponent, EditEventModalComponent, EventTemplateModalComponent ],
            providers: [SiteEditorService, { provide: LOCALE_ID, useValue: 'en' }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditEventsCalendarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

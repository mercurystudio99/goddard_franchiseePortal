import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { UtilsModule } from '@shared/utils/utils.module';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { AppSessionService } from '@shared/common/session/';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { SiteEditorService } from '@app/site-editor/services';
import { FormsModule } from '@angular/forms';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditSummerCampEventsComponent } from './edit-summer-camp-events.component';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { GoddardIconsComponent } from '@app/shared/common/goddard-icons/goddard-icons.component';
import { TableModule } from 'primeng/table';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { of } from 'rxjs';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe(' EditSummerCampEventsComponent', () => {
    let component: EditSummerCampEventsComponent;
    let fixture: ComponentFixture<EditSummerCampEventsComponent>;

    class ContentAPIMock {
        getImages(path: string) {
            return of([]);
        }
    }
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                Angulartics2RouterlessModule.forRoot(),
                FormsModule,
                TableModule,
                UtilsModule,
                ServiceProxyModule,
                ModalModule.forRoot(),
                AppBsModalModule,
                HttpClientTestingModule,
            ],
            declarations: [EditSummerCampEventsComponent, GoddardIconsComponent],
            providers: [
                { provide: ContentApiClientFacade, useClass: ContentAPIMock },
                AppUiCustomizationService,
                AppUrlService,
                SiteEditorService,
                AppSessionService,
                AppNavigationService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditSummerCampEventsComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

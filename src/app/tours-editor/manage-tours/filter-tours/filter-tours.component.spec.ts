import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterToursComponent } from './filter-tours.component';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';
import { ToursEditorService } from '../../services/tours-editor.service';
import { FeaturesEditorServiceServiceProxy, ToursEditorServiceServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SessionServiceProxy } from '@shared/service-proxies/service-proxies';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { LocalStorageService } from '@shared/utils/local-storage.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';

describe('FilterToursComponent', () => {
  let component: FilterToursComponent;
  let fixture: ComponentFixture<FilterToursComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, ModalModule.forRoot(), AppBsModalModule],
            providers: [
                DateTimeService,
                AppLocalizationService,
                appModuleAnimation,
                ToursApiClientFacade,
                ToursEditorService,
                AppSessionService,
                ToursEditorServiceServiceProxy,
                FeaturesEditorServiceServiceProxy,
                SessionServiceProxy,
                AppUiCustomizationService,
                AppUrlService,
                LocalStorageService,
                AppNavigationService,
            ],
            declarations: [FilterToursComponent],
        }).compileComponents();
    });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterToursComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

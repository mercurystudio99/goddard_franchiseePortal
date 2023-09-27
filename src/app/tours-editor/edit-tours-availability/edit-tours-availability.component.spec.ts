// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { FranchiseePortalCommonModule } from '@shared/common/common.module';
// import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
// // import { EditToursAvailabilityComponent } from './edit-tours-availability.component';
// import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { LocalizePipe } from '@shared/common/pipes/localize.pipe';
// import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
// import { ToursEditorService } from '../services/tours-editor.service';
// import { ToursEditorServiceServiceProxy } from '@shared/service-proxies/service-proxies';
// import { AppSessionService } from '@shared/common/session/app-session.service';
// import { SessionServiceProxy } from '@shared/service-proxies/service-proxies';
// import { LocalStorageService } from '@shared/utils/local-storage.service';
// import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
// import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
// import { ModalModule } from 'ngx-bootstrap/modal';
// import { DateTimeService } from '@app/shared/common/timing/date-time.service';

// describe('EditToursAvailabilityComponent', () => {
//     let component: EditToursAvailabilityComponent;
//     let fixture: ComponentFixture<EditToursAvailabilityComponent>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             declarations: [EditToursAvailabilityComponent, LocalizePipe],
//             imports: [
//                 Angulartics2RouterlessModule.forRoot(),
//                 FranchiseePortalCommonModule.forRoot(),
//                 ModalModule.forRoot(),
//                 ServiceProxyModule,
//                 HttpClientTestingModule,
//                 AppBsModalModule,
//             ],
//             providers: [
//                 DateTimeService,
//                 AppLocalizationService,
//                 ToursEditorService,
//                 AppSessionService,
//                 ToursEditorServiceServiceProxy,
//                 SessionServiceProxy,
//                 LocalStorageService,
//                 AppNavigationService,
//             ],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(EditToursAvailabilityComponent);
//         component = fixture.componentInstance;
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });

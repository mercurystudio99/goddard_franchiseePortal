// import { LocalizePipe } from './../../../shared/common/pipes/localize.pipe';
// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { TourScheduleComponent } from './tour-schedule.component';
// import { DateTimeService } from '@app/shared/common/timing/date-time.service';
// import { appModuleAnimation } from '@shared/animations/routerTransition';
// import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
// import { AppUrlService } from '@shared/common/nav/app-url.service';
// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
// import { ToursEditorService } from '../services/tours-editor.service';
// import { SchoolInfoDto, SchoolTourAvailabilityDto, ToursEditorServiceServiceProxy, TourTypes } from '@shared/service-proxies/service-proxies';
// import { AppSessionService } from '@shared/common/session/app-session.service';
// import { SessionServiceProxy } from '@shared/service-proxies/service-proxies';
// import { LocalStorageService } from '@shared/utils/local-storage.service';
// import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
// import { Observable, of } from 'rxjs';
// import { ToursApiClientFacade } from '@shared/service-proxies/tours-api-client-facade.service';

// describe('TourScheduleComponent', () => {
//     let component: TourScheduleComponent;
//     let fixture: ComponentFixture<TourScheduleComponent>;

//     class AppSessionMock {
//         get school(): SchoolInfoDto {
//             return {
//                 crmId: 'abcd',
//                 fmsId: null,
//                 advertisingName: null,
//                 hours: null,
//                 address: null,
//                 init: null,
//                 toJSON: null,
//                 timeZone: 'Eastern Standard Time'
//             };
//         }
//     }

//     class TourApiClientFacadeMock {
//         getSchoolToursAvailabilities(crmId: string) : Observable<SchoolTourAvailabilityDto[]> {
//             const dto = SchoolTourAvailabilityDto.fromJS({
//                 id: '1',
//                 startTime: '2023-05-03T00:00.000Z',
//                 endTime: '2023-05-03T00:00.000Z',
//                 tourTypes: [TourTypes.InPerson]
//             });

//             return of([dto])
//         }
//     }

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [HttpClientTestingModule],
//             providers: [
//                 DateTimeService,
//                 AppLocalizationService,
//                 appModuleAnimation,
//                 ToursEditorService,
//                 ToursEditorServiceServiceProxy,
//                 SessionServiceProxy,
//                 { provide: ToursApiClientFacade, useClass: TourApiClientFacadeMock },
//                 { provide: AppSessionService, useClass: AppSessionMock },
//                 AppUiCustomizationService,
//                 AppUrlService,
//                 LocalStorageService,
//                 AppUiCustomizationService,
//                 AppNavigationService,
//             ],
//             declarations: [TourScheduleComponent, LocalizePipe],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(TourScheduleComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });

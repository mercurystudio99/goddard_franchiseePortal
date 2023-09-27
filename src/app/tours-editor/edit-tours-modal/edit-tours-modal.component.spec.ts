import { ModalModule } from 'ngx-bootstrap/modal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FranchiseePortalCommonModule } from '@shared/common/common.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { FormsModule } from '@angular/forms';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { Angulartics2RouterlessModule } from 'angulartics2/routerlessmodule';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LocalizePipe } from '@shared/common/pipes/localize.pipe';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { ToursEditorService } from '../services/tours-editor.service';
import { AppSessionService } from '@shared/common/session/';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { LocalStorageService } from '@shared/utils/local-storage.service';

import { EditToursModalComponent } from './edit-tours-modal.component';
import { DateTime } from 'luxon';
import {
    TourItemDto,
    TourType,
    SchoolInfoDto,
    AppTourSettingsDto,
    TourStatus,
} from '@shared/service-proxies/service-proxies';
import { Observable, of } from 'rxjs';
import { ToursSettingsApiClientFacade } from '@shared/service-proxies/tours-settings-api-client-facade.service';
import { TourItemDtoExt } from '../model/tour-ext';
import { ToursEditorConstants } from '../tours-editor-constants';

describe('EditToursModalComponent', () => {
    let component: EditToursModalComponent;
    let fixture: ComponentFixture<EditToursModalComponent>;
    let TIME_ZONE_OFFSET = '-04:00';

    class AppSessionMock {
        get school(): SchoolInfoDto {
            return {
                crmId: 'abcd',
                fmsId: null,
                advertisingName: null,
                hours: null,
                address: null,
                init: null,
                toJSON: null,
                timeZone: 'Eastern Standard Time',
            };
        }
    }

    class ToursEditorServiceMock {
        getTourSettings(crmId: string): Observable<AppTourSettingsDto> {
            return of({
                toJSON: null,
                init: null,
                maxOpenHouseParticipants: 1,
                schoolId: '0',
                defaultTourDuration: null,
                defaultTourGuideId: null,
                onlineOptions: null,
                allowedTourDurationOptionsInMinutes: null,
            });
        }
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditToursModalComponent, LocalizePipe],
            imports: [
                Angulartics2RouterlessModule.forRoot(),
                FranchiseePortalCommonModule.forRoot(),
                ModalModule.forRoot(),
                ServiceProxyModule,
                HttpClientTestingModule,
                FormsModule,
                AppBsModalModule,
            ],
            providers: [
                ToursEditorService,
                DateTimeService,
                AppLocalizationService,
                LocalStorageService,
                AppNavigationService,
                { provide: AppSessionService, useClass: AppSessionMock },
                { provide: ToursSettingsApiClientFacade, useClass: ToursEditorServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditToursModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('#shouldDisplayConflictingTourScheduleWarning("2023-02-13T11:30:00") should return "true" for InPerson Tour when 5 attendees and times overlap', () => {
        let date = DateTime.fromISO('2023-02-13T00:00:00'); // browser local time, time is unused and set with start/end time below

        component.startDate = date.toJSDate();
        component.startTime = '06:00'; // Eastern Standard Time (-5)
        component.endTime = '06:30';
        component.tour = TourItemDtoExt.fromJS({ type: TourType.InPerson });
        component._settings = AppTourSettingsDto.fromJS({ maxOpenHouseParticipants: 5 });
        let tour = component.getBaseTourData();
        let result = component.shouldDisplayConflictingTourScheduleWarning(
            [
                TourItemDto.fromJS({
                    type: TourType.InPerson,
                    startDateTime: '2023-02-13T11:00:00Z',
                    endDateTime: '2023-02-13T12:00:00Z',
                }),
            ],
            tour
        );
        expect(result).toBeTruthy();
    });

    it('#shouldDisplayConflictingTourScheduleWarning("2023-02-15T09:00:00") should return "true" for Online Tour when 1 attendee already and times overlap', () => {
        let date = DateTime.fromISO('2023-02-15T00:00:00'); // browser local time
        component.startDate = date.toJSDate();
        component.startTime = '04:00'; //Eastern Standard Time (-5)
        component.endTime = '04:30';
        component.tour = TourItemDtoExt.fromJS({ type: TourType.Online });
        component._settings = AppTourSettingsDto.fromJS({ maxOpenHouseParticipants: 1 });

        let tour = component.getBaseTourData();
        let result = component.shouldDisplayConflictingTourScheduleWarning(
            [
                TourItemDto.fromJS({
                    type: TourType.Online,
                    startDateTime: '2023-02-15T09:00:00Z',
                    endDateTime: '2023-02-15T09:30:00Z',
                }),
            ],
            tour
        );
        expect(result).toBeTruthy();
    });

    it('Should display warning for InPerson when single tour overlap', () => {
        component._settings = AppTourSettingsDto.fromJS({ maxOpenHouseParticipants: 2 });
        let tour = new TourItemDtoExt({
            startDateTime: DateTime.fromISO('2023-03-20T09:00:00'),
            endDateTime: DateTime.fromISO('2023-03-20T09:30:00'),
            type: TourType.InPerson,
        });

        let result = component.shouldDisplayConflictingTourScheduleWarning(
            [
                TourItemDto.fromJS({
                    type: TourType.InPerson,
                    startDateTime: '2023-03-20T09:08:00',
                    endDateTime: '2023-03-20T09:09:00',
                }),
            ],
            tour
        );

        expect(result).toBeTrue();
    });

    it('#Should not display conflicting warning when end of tour matches start of next tour', () => {
        let tour = new TourItemDtoExt({
            startDateTime: DateTime.fromISO('2023-03-20T09:00:00'),
            endDateTime: DateTime.fromISO('2023-03-20T09:30:00'),
            type: TourType.InPerson,
        });

        component._settings = AppTourSettingsDto.fromJS({ maxOpenHouseParticipants: 2 });

        let result = component.shouldDisplayConflictingTourScheduleWarning(
            [
                TourItemDto.fromJS({
                    type: TourType.InPerson,
                    startDateTime: '2023-03-20T09:30:00',
                    endDateTime: '2023-03-20T10:00:00',
                }),
            ],
            tour
        );

        expect(result).toBeFalsy();
    });

    it('#Should display conflicting tour warning for online when groupings do not necessarily overlap', () => {
        let tour = TourItemDtoExt.fromJS({
            startDateTime: DateTime.fromISO('2023-03-20T10:00:00'),
            endDateTime: DateTime.fromISO('2023-03-20T10:30:00'),
            type: TourType.Online,
        });

        component._settings = AppTourSettingsDto.fromJS({ maxOpenHouseParticipants: 2 });

        let result = component.shouldDisplayConflictingTourScheduleWarning(
            [
                TourItemDto.fromJS({
                    type: TourType.Online,
                    startDateTime: '2023-03-20T10:00:00',
                    endDateTime: '2023-03-20T10:30:00',
                }),
                TourItemDto.fromJS({
                    type: TourType.Online,
                    startDateTime: '2023-03-20T10:00:00',
                    endDateTime: '2023-03-20T11:00:00',
                }),
            ],
            tour
        );

        expect(result).toBeTrue();
    });

    it('#Should NOT check for conflicting scheduled tours when user is editing tour but is not rescheduling the Tour', () => {
        const date = DateTime.now().plus({ days: 1 }).toFormat('yyyy-LL-dd');
        const time = DateTime.now().toFormat(DateTimeService.TIME_FORMAT_24_HOURS);
        let startDateTime = DateTime.fromISO(`${date}T${time}:00.000${TIME_ZONE_OFFSET}`, { setZone: true });
        let tour = TourItemDtoExt.fromJS({
            id: '123',
            startDateTime: startDateTime,
            endDateTime: startDateTime.plus({ hours: ToursEditorConstants.DEFAULT_TOUR_DURATION }),
            status: TourStatus.Scheduled,
        });
        component.tour = TourItemDtoExt.fromJS({ ...tour });
        component.originalTour = TourItemDtoExt.fromJS({ ...tour });

        let result = component.shouldCheckForConflictingSchedule(tour);

        expect(result).toBeFalse();
    });

    it('#Should check for conflicting scheduled tours when user is editing tour and changes the tour time', () => {
        const date = DateTime.now().plus({ days: 1 }).toFormat('yyyy-LL-dd');
        const time = DateTime.now().toFormat(DateTimeService.TIME_FORMAT_24_HOURS);
        let startDateTime = DateTime.fromISO(`${date}T${time}:00.000${TIME_ZONE_OFFSET}`, { setZone: true });
        let tour = TourItemDtoExt.fromJS({
            id: '123',
            startDateTime: startDateTime,
            endDateTime: startDateTime.plus({ hours: ToursEditorConstants.DEFAULT_TOUR_DURATION }),
            status: TourStatus.Scheduled,
        });
        component.tour = TourItemDtoExt.fromJS({ ...tour });
        component.originalTour = TourItemDtoExt.fromJS({ ...tour, endDateTime: startDateTime.plus({ hours: 1 }) });

        let result = component.shouldCheckForConflictingSchedule(tour);

        expect(result).toBeTruthy();
    });

    it('#Should NOT check for conflicting scheduled tours when Tour status is not "Scheduled"', () => {
        const date = DateTime.now().plus({ days: 1 }).toFormat('yyyy-LL-dd');
        const time = DateTime.now().toFormat(DateTimeService.TIME_FORMAT_24_HOURS);
        let startDateTime = DateTime.fromISO(`${date}T${time}:00.000${TIME_ZONE_OFFSET}`, { setZone: true });
        let tour = TourItemDtoExt.fromJS({
            startDateTime: startDateTime,
            endDateTime: startDateTime.plus({ hours: ToursEditorConstants.DEFAULT_TOUR_DURATION }),
            status: TourStatus.Completed,
        });
        component.tour = TourItemDtoExt.fromJS({ ...tour });
        component.originalTour = TourItemDtoExt.fromJS({ ...tour });

        let result = component.shouldCheckForConflictingSchedule(tour);

        expect(result).toBeFalsy();
    });

    it('#Should check for conflicting scheduled tours for new scheduled TOUR and future time', () => {
        const date = DateTime.now().plus({ days: 1 }).toFormat('yyyy-LL-dd');
        const time = DateTime.now().toFormat(DateTimeService.TIME_FORMAT_24_HOURS);
        let startDateTime = DateTime.fromISO(`${date}T${time}:00.000${TIME_ZONE_OFFSET}`, { setZone: true });
        let tour = TourItemDtoExt.fromJS({
            startDateTime: startDateTime,
            endDateTime: startDateTime.plus({ hours: ToursEditorConstants.DEFAULT_TOUR_DURATION }),
            status: TourStatus.Scheduled,
        });
        component.tour = TourItemDtoExt.fromJS({ ...tour });
        component.originalTour = TourItemDtoExt.fromJS({ ...tour });

        let result = component.shouldCheckForConflictingSchedule(tour);

        expect(result).toBeTruthy();
    });

    it('#Should check for conflicting scheduled tours for new scheduled TOUR and 1 minute future time', () => {
        // started one minute ago
        const startDate = DateTime.now().plus({ minutes: 1});
        let tour = TourItemDtoExt.fromJS({
            startDateTime: startDate,
            endDateTime: startDate.plus({ hours: ToursEditorConstants.DEFAULT_TOUR_DURATION }),
            status: TourStatus.Scheduled,
        });

        component.tour = TourItemDtoExt.fromJS({ ...tour });
        component.originalTour = TourItemDtoExt.fromJS({ ...tour });

        let result = component.shouldCheckForConflictingSchedule(tour);

        expect(result).toBeTruthy();
    });

    it('#Should NOT check for conflicting scheduled tours when tour is in the PAST', () => {
        let startDateTime = DateTime.now().plus({minutes: -1});
        let tour = TourItemDtoExt.fromJS({
            startDateTime: startDateTime,
            endDateTime: startDateTime.plus({ hours: ToursEditorConstants.DEFAULT_TOUR_DURATION }),
            status: TourStatus.Scheduled,
        });
        component.tour = TourItemDtoExt.fromJS({ ...tour });
        component.originalTour = TourItemDtoExt.fromJS({ ...tour });

        let result = component.shouldCheckForConflictingSchedule(tour);

        expect(result).toBeFalsy();
    });

    it('Should map guideId on getUpdateTourData', () => {
        const testId = 'abcdef';
        let dto = new TourItemDtoExt ({
            guideId: testId
        });

        let result = component.getUpdateTourData(dto);
        expect(result.guideId === testId);
    });
});

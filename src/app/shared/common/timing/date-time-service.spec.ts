import { TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { AppLocalizationService } from '../localization/app-localization.service';
import { AppSessionService } from '@shared/common/session';
import { SchoolInfoDto } from '@shared/service-proxies/service-proxies';
import { DateTimeService } from './date-time.service';

describe('DateTimeService', () => {
    let dateTimeService: DateTimeService;
    let schoolTimeZone = 'Eastern Standard Time';

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

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DateTimeService,
              { provide: AppSessionService, useClass: AppSessionMock },
                {
                    provide: AppLocalizationService,
                    useValue: jasmine.createSpyObj('AppLocalizationService', ['l', 'ls']),
                },
            ],
        });

        dateTimeService = TestBed.inject(DateTimeService);
    });

    it('#getAge should return "1 Month" when age is under 40 Days old', () => {
        const date = DateTime.local().plus({ days: -40 }); //create date
        const age = dateTimeService.getAge(date).toString();
        expect(age === '1 Month').toBeTruthy();
    });

    it('#getAge should include "Months" when age is older that 1 month but younger that 1 year', () => {
        const date = DateTime.local().plus({ months: -11 }); //create date
        const age = dateTimeService.getAge(date).toString();
        expect(age.includes('Months')).toBeTruthy();
    });

    it('#getAge should return "1 Year" when age is 13 months old', () => {
        const date = DateTime.local().plus({ months: -13 }); //create date
        const age = dateTimeService.getAge(date).toString();
        expect(age === '1 Year').toBeTruthy();
    });

    it('#getAge should return "years" when a child is less than 24 months old', () => {
        const date = DateTime.local().plus({ months: -23 }); //create date
        const age = dateTimeService.getAge(date).toString();
        expect(age === '1 Year').toBeTruthy();
    });

    it('#getAge should return "years" when a child is at months old', () => {
        const date = DateTime.local().plus({ months: -24 }); //create date
        const age = dateTimeService.getAge(date).toString();
        expect(age === '2 Years').toBeTruthy();
    });

    it('getDateElementSelector returns date formatted in yyyy-mm-dd format', () => {
        const d = new Date(2022, 6, 2);
        // Date will shift in timezone ahead of GMT (offset < 0)
        if (d.getTimezoneOffset() < 0) {
            expect(d.toISOString().slice(0, 10)).toBe('2022-07-01');
        }

        expect(dateTimeService.getDateElementSelector(d)).toBe(`[data-date="2022-07-02"]`);
    });

    it('should return true if intervals overlap', () => {
        const start1 = DateTime.fromISO('2023-05-16T08:00:00');
        const end1 = DateTime.fromISO('2023-05-16T10:00:00');
        const start2 = DateTime.fromISO('2023-05-16T09:00:00');
        const end2 = DateTime.fromISO('2023-05-16T11:00:00');

        const result = dateTimeService.isOverlappingExclusive(start1, end1, start2, end2);

        expect(result).toBeTruthy();
    });

    it('should return true if intervals are the same', () => {
        const start1 = DateTime.fromISO('2023-05-16T08:00:00');
        const end1 = DateTime.fromISO('2023-05-16T10:00:00');
        const start2 = DateTime.fromISO('2023-05-16T08:00:00');
        const end2 = DateTime.fromISO('2023-05-16T10:00:00');

        const result = dateTimeService.isOverlappingExclusive(start1, end1, start2, end2);

        expect(result).toBeTruthy();
    });

    it('should return true if one interval is inside the other', () => {
        const start1 = DateTime.fromISO('2023-05-16T08:00:00');
        const end1 = DateTime.fromISO('2023-05-16T12:00:00');
        const start2 = DateTime.fromISO('2023-05-16T09:00:00');
        const end2 = DateTime.fromISO('2023-05-16T11:00:00');

        const result = dateTimeService.isOverlappingExclusive(start1, end1, start2, end2);

        expect(result).toBeTruthy();
    });

    it('should return false if intervals do not overlap', () => {
        const start1 = DateTime.fromISO('2023-05-16T08:00:00');
        const end1 = DateTime.fromISO('2023-05-16T10:00:00');
        const start2 = DateTime.fromISO('2023-05-16T11:00:00');
        const end2 = DateTime.fromISO('2023-05-16T12:00:00');

        const result = dateTimeService.isOverlappingExclusive(start1, end1, start2, end2);

        expect(result).toBeFalsy();
    });

    it('should parse a date time from the school start hour format am', () => {
        const startTime = '07:00 am';
        expect(dateTimeService.fromTimeString(startTime).get('hour')).toBe(7);
        expect(dateTimeService.fromTimeString(startTime).get('minute')).toBe(0);
    });

    it('should parse a date time from the school start hour format pm', () => {
        const startTime = '07:30 pm';
        expect(dateTimeService.fromTimeString(startTime).get('hour')).toBe(19);
        expect(dateTimeService.fromTimeString(startTime).get('minute')).toBe(30);
    });

    it('should parse a date time from the school start hour format pm', () => {
        const startTime = '7:30 am';
        expect(dateTimeService.fromTimeString(startTime).get('hour')).toBe(7);
        expect(dateTimeService.fromTimeString(startTime).get('minute')).toBe(30);
    });

    it('[toSchoolTimeZoneKeepTime]: should swap to school local time but keep the current clock time', () => {
        // Midnight ET
        const testTime = DateTime.fromISO('2023-05-16T04:00:00Z', { setZone: true });
        // Local time from AppSessionStub
        const converted  = dateTimeService.toSchoolTimeZoneKeepTime(testTime);
        expect(converted.toISO()).toBe(DateTime.fromISO('2023-05-16T04:00:00-04:00', { setZone: true }).toISO());
    });


});

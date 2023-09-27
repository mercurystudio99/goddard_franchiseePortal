import { TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { TourItemDtoExt } from './tour-ext';
import { TourGuideDto, TourItemDto } from '@shared/service-proxies/service-proxies';

describe('Tour', () => {
    let tourInput: TourItemDtoExt;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [],
        });
    });

    it('is equal to another tour with stringify', () => {
        let js = {
            startDateTime: DateTime.fromISO('2023-06-15T12:05:30.000+01:00'),
            endDateTime: DateTime.fromISO('2023-06-15T12:06:00.000+01:00'),
            guideId: 1,
            notes: 'Test notes',
            classRoom: 'Test classroom',
        };

        const tour = TourItemDtoExt.fromJS(js);

        const tour2 = TourItemDtoExt.fromJS(js);

        expect(tour.equalsStringify(tour2)).toBeTrue();
    });

    it('is equal to another tour on these fields', () => {
        let js = {
            startDateTime: DateTime.fromISO('2023-06-15T12:05:30.000+01:00'),
            endDateTime: DateTime.fromISO('2023-06-15T12:06:00.000+01:00'),
            guideId: 1,
            notes: 'Test notes',
            classRoom: 'Test classroom',
        };

        const tour = TourItemDtoExt.fromJS(js);

        const tour2 = TourItemDtoExt.fromJS(js);

        expect(tour.equals(tour2)).toBeTrue();
    });

    it('#isSameTime() should return "true" when start and end times are the same', () => {
        let start = DateTime.fromISO('2023-06-15T12:05:30.582+01:00');
        let end = DateTime.fromISO('2023-06-15T12:05:30.582+01:00');
        tourInput = TourItemDtoExt.fromJS({
            startDateTime: start,
            endDateTime: end,
        });
        const result = tourInput.isSameTime(
            TourItemDtoExt.fromJS({
                startDateTime: start,
                endDateTime: end,
            })
        );
        expect(result).toBeTruthy();
    });

    it('#isSameTime() should return "false" when new startDateTime is +1 milliseconds"', () => {
        let start = DateTime.fromISO('2023-06-15T12:05:30.582+01:00');
        let end = DateTime.fromISO('2023-06-15T12:05:30.581+01:00');
        tourInput = TourItemDtoExt.fromJS({
            startDateTime: start,
            endDateTime: end,
        });
        const result = tourInput.isSameTime(
            TourItemDtoExt.fromJS({
                startDateTime: start.plus({ milliseconds: 1 }),
                endDateTime: end,
            })
        );
        expect(result).toBeFalsy();
    });

    it('#isSameTime() should return "false" when date/times are the same but form different timezones"', () => {
        let start = DateTime.fromISO('2023-06-15T12:05:30.582+01:00');
        let end = DateTime.fromISO('2023-06-15T12:05:30.581+01:00');
        tourInput = TourItemDtoExt.fromJS({
            startDateTime: start,
            endDateTime: end,
        });
        const result = tourInput.isSameTime(
            TourItemDtoExt.fromJS({
                startDateTime: DateTime.fromISO('2023-06-15T12:05:30.582-06:00'),
                endDateTime: DateTime.fromISO('2023-06-15T12:05:30.581-06:00'),
            })
        );
        expect(result).toBeFalsy();
    });

    it('#fromDto() should assign the guideId from TourItemDto.guide.id', () => {
        const dto = TourItemDto.fromJS({ guide: TourGuideDto.fromJS({ id: 'abc' }) });
        const result = new TourItemDtoExt(dto);

        expect(result.guideId).toBe('abc');
    });

    it('constructor should initialize fields', () => {
        const dto = TourItemDto.fromJS({
                id: 'abcdef'
            });

        const result = new TourItemDtoExt(dto);

        expect(result.id).toBe('abcdef');
    });
});

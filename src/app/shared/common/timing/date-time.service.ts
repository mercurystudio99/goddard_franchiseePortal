import { Injectable } from '@angular/core';
import { DateTime, Interval } from 'luxon';
import { findIana } from 'windows-iana';
import { DayOfWeek } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session';

@Injectable()
export class DateTimeService {
    static TIME_FORMAT_24_HOURS = 'HH:mm';
    static TIME_FORMAT_12_HOURS = 'h:mm a';

    constructor(private _appSession: AppSessionService) {}

    getDate(): DateTime {
        if (abp.clock.provider.supportsMultipleTimezone) {
            return DateTime.local().setZone(abp.timing.timeZoneInfo.iana.timeZoneId);
        } else {
            return DateTime.local();
        }
    }

    getUTCDate(): DateTime {
        return DateTime.utc();
    }

    getYear(): number {
        return this.getDate().year;
    }

    getStartOfDay(): DateTime {
        return this.getDate().startOf('day');
    }

    getStartOfWeek(): DateTime {
        return this.getDate().startOf('week');
    }

    getStartOfDayForDate(date: DateTime | Date): DateTime {
        if (!date) {
            return date as DateTime;
        }

        if (date instanceof Date) {
            return this.getStartOfDayForDate(this.fromJSDate(date));
        }

        return date.startOf('day');
    }

    getStartOfDayMinusDays(daysFromNow: number): DateTime {
        let date = this.getDate();
        let newDate = this.minusDays(date, daysFromNow);
        return this.getStartOfDayForDate(newDate);
    }

    getEndOfDay(): DateTime {
        return this.getDate().endOf('day');
    }

    getEndOfDayForDate(date: DateTime | Date): DateTime {
        if (!date) {
            return date as DateTime;
        }

        if (date instanceof Date) {
            return this.getEndOfDayForDate(this.fromJSDate(date));
        }

        return date.endOf('day');
    }

    getEndOfDayPlusDays(daysFromNow: number): DateTime {
        let date = this.getDate();
        let newDate = this.plusDays(date, daysFromNow);
        return this.getEndOfDayForDate(newDate);
    }

    getEndOfDayMinusDays(daysFromNow: number): DateTime {
        let date = this.getDate();
        let newDate = this.minusDays(date, daysFromNow);
        return this.getEndOfDayForDate(newDate);
    }

    plusDays(date: DateTime | Date, dayCount: number): DateTime {
        if (date instanceof Date) {
            return this.plusDays(this.fromJSDate(date), dayCount);
        }

        return date.plus({ days: dayCount });
    }

    plusSeconds(date: DateTime, seconds: number) {
        if (!date) {
            return date;
        }

        if (date instanceof Date) {
            return this.plusSeconds(this.fromJSDate(date), seconds);
        }

        return date.plus({ seconds: seconds });
    }

    minusDays(date: DateTime, dayCount: number): DateTime {
        return date.minus({ days: dayCount });
    }

    fromISODateString(date: string): DateTime {
        return DateTime.fromISO(date);
    }

    formatISODateString(dateText: string, format: string): string {
        let date = this.fromISODateString(dateText);
        return date.toFormat(format);
    }

    formatJSDate(jsDate: Date, format: string): string {
        let date = DateTime.fromJSDate(jsDate);
        return date.toFormat(format);
    }

    formatDate(date: DateTime | Date, format: string): string {
        if (date instanceof Date) {
            return this.formatDate(this.fromJSDate(date), format);
        }

        return date.toFormat(format);
    }

    getDiffInSeconds(maxDate: DateTime | Date, minDate: DateTime | Date) {
        if (maxDate instanceof Date && minDate instanceof Date) {
            return this.getDiffInSeconds(this.fromJSDate(maxDate), this.fromJSDate(minDate));
        }

        return (maxDate as DateTime).diff(minDate as DateTime, 'seconds');
    }

    createJSDate(year: number, month: number, day: number): Date {
        return this.createDate(year, month, day).toJSDate();
    }

    createDate(year: number, month: number, day: number): DateTime {
        if (abp.clock.provider.supportsMultipleTimezone) {
            return DateTime.utc(year, month + 1, day);
        } else {
            return DateTime.local(year, month + 1, day);
        }
    }

    /**
     * Create a `DateTime` for UTC timezone for date provided at 12:00:00 midnight (00:00:00)
     * @param year
     * @param monthIndex
     * @param day
     * @returns
     */
    createUtcDate(year: number, monthIndex: number, day: number): DateTime {
        return DateTimeService._createUtcDate(year, monthIndex, day);
    }

    /**
     * Create a `DateTime` for UTC timezone for date provided at 12:00:00 midnight (00:00:00)
     * @param year
     * @param monthIndex
     * @param day
     * @returns
     */
    static _createUtcDate(year: number, monthIndex: number, day: number): DateTime {
        return DateTime.utc(year, monthIndex + 1, day);
    }

    /**
     * Converts `dateTime` representing date and time in school's timezone to browser's local timezone keeping the time as-is (i.e. changes timestamp)
     * to be used for displaying times in school's timezone
     *
     * For example we want to display a tour scheduled for 10:00AM ET (school local time) but we are located in PST (UTC-7).
     * Components will want the `dateTime` value as 10:00AM PST for correct display.  So we have to convert from 10:00AM ET
     * to 10:00AM PST.  If we don't do this the time would display at 7:00AM.
     * @param date
     */
    fromSchoolTimeZoneToLocalKeepTime(dateTime: DateTime): DateTime {

        const result = dateTime
            // First convert DateTime to school's zone without changing the timestamp
            .setZone(DateTimeService._findIanaTimezoneIfNeeded(this._appSession.school.timeZone))
            // Now convert to local zone preserving the time (changing timestamp)
            .setZone('local', { keepLocalTime: true});
        return result;
    }

    /**
     * Converts `dateTime` **with** timezone value received from server (ex. 2023-09-21T00:00:00Z) to equivalent local time keeping time as-is (i.e. changes timestamp).
     * This is useful for date-only values.  If we don't do this then a deserialized date-only `DateTime` will have the date set to the local system time which if in ET
     * the date would be 2023-09-20T17:00:00.000-04:00 in the previous example which is the day before
     * @param date
     */
    fromUtcToLocalKeepTime(dateTime: DateTime): DateTime {
        const result = dateTime.toUTC().setZone('local', { keepLocalTime: true });
        return result;
    }

    /**
     * Converts `date` from local browser time to current school's timezone keeping the time as-is (i.e. changes timestamp)
     * for saving on server.
     *
     * For example a user wants to schedule a tour time for 10:00AM ET (school local time) but we are located in PST (UTC-7).
     * Components will have the `date` value as 10:00AM PST.  Since we want to save in school's local time we need to convert
     * from 10:00AM PST to 10:00AM ET
     * @param date
     */
    toSchoolTimeZoneKeepTime(dateTime: DateTime): DateTime {

        const result = dateTime.setZone(
            DateTimeService._findIanaTimezoneIfNeeded(this._appSession.school.timeZone),
            { keepLocalTime: true });

        return result;
    }

    /**
     * Creates `DateTime` instance with date portion from `date` set to 12:00:00 midnight (00:00:00) UTC
     * @param date
     * @returns
     */
    toUtcDate(date: DateTime | Date): DateTime {
        return DateTimeService._toUtcDate(date);
    }

    /**
     * Creates `DateTime` instance with date portion from `date` set to 12:00:00 midnight (00:00:00) UTC
     * @param date
     * @returns
     */
    static _toUtcDate(date: DateTime | Date): DateTime {
        if (date instanceof Date) {
            return this._createUtcDate(date.getFullYear(), date.getMonth(), date.getDate());
        }

        return this._createUtcDate(date.year, date.month - 1, date.day);
    }

    /**
     * Sets the DateTime's zone to UTC but preserves the time.  i.e. if the instance is of local time 2000-01-01-T13:00
     * returned instance will be 2000-01-01-T13:00Z
     * @param date
     * @returns
     */
    static _toUtcKeepTime(date: DateTime): DateTime {
        return date.toUTC(null, { keepLocalTime: true });
    }

    fromJSDate(date: Date): DateTime {
        return DateTimeService._fromJSDate(date);
    }

    static _fromJSDate(date: Date): DateTime {
        return DateTime.fromJSDate(date);
    }

    fromNow(date: DateTime | Date): string {
        if (date instanceof Date) {
            return this.fromNow(this.fromJSDate(date));
        }

        return date.toRelative();
    }

    getAge(date: DateTime | Date): string | number {
        if (date instanceof Date) {
            return this.getAge(this.fromJSDate(date));
        }
        let months = Math.floor(Math.abs(date.diffNow('months').months));
        if (months >= 12) {
            let years = Math.floor(Math.abs(date.diffNow('months').months) / 12);

            return years > 1 ? years + ' Years' : years + ' Year';
        }
        return months > 1 ? months + ' Months' : months + ' Month';
    }

    getDiffInMinutes(start: DateTime, end: DateTime): number {
        return DateTimeService._getDiffInMinutes(start, end);
    }

    static _getDiffInMinutes(start: DateTime, end: DateTime): number {
        if (start > end) {
            return DateTimeService._getDiffInMinutes(end, start);
        }
        const interval = Interval.fromDateTimes(start, end);
        return Math.round(interval.length('minutes'));
    }

    getDateElementSelector(date: Date): string {
        const year = date.getFullYear();
        let month: string | number = date.getMonth() + 1;
        month = month < 10 ? '0' + month : '' + month;
        let day: string | number = date.getDate();
        day = day < 10 ? '0' + day : '' + day;

        return `[data-date="${year}-${month}-${day}"]`;
    }

    static _findIanaTimezoneIfNeeded(timeZone: string) {
        //convert to specified time zone, using findIana to convert from Windows format if needed
        const timeZones = findIana(timeZone);
        // Windows timezones may map to more than one IANA time zone
        // Is first one is the 'golden one'
        //   https://stackoverflow.com/questions/17348807/how-to-translate-between-windows-and-iana-time-zones
        if (timeZones.length > 0) {
            return timeZones[0];
        }
        return timeZone;
    }

    /*
      Converts either a string or a javascript Date to a Luxon DateTime object
    */
    ensureDateTime(date: DateTime | Date | string): DateTime | undefined {
        return DateTimeService._ensureDateTime(date);
    }

    static _ensureDateTime(date: DateTime | Date | string): DateTime | undefined {
        if (!date) {
            return undefined;
        }

        let dateTimeToUse: DateTime;
        if (typeof date === 'string' || date instanceof String) {
            dateTimeToUse = DateTime.fromISO(date.toString());
        } else if (date instanceof Date) {
            dateTimeToUse = DateTime.fromJSDate(date);
        } else {
            dateTimeToUse = date;
        }
        return dateTimeToUse;
    }

    getTimeZoneOffset(date: DateTime, timeZone: string, windowsTz: boolean = true): string {
        let timezone = DateTimeService._findIanaTimezoneIfNeeded(timeZone);
        let isoDateString = date.setZone(timezone).toISO(); //'2017-04-20T11:32:00.000-04:00'
        let lastDashIndex = isoDateString.lastIndexOf('+');
        if (lastDashIndex === -1) {
            lastDashIndex = isoDateString.lastIndexOf('-');
        }
        return isoDateString.substring(lastDashIndex); //return '-04 :00' or '+09:00'
    }

    getTime(date: DateTime | Date, addMeridian: boolean = false, is24HoursFormat: boolean = true): string {
        return DateTimeService._getTime(date, addMeridian, is24HoursFormat);
    }

    /**
     * Gets date as time string ("00:00")
     * @param date
     * @param addMeridian
     * @param is24HoursFormat
     * @returns
     */
    static _getTime(date: DateTime | Date, addMeridian: boolean = false, is24HoursFormat: boolean = true): string {
        if (date instanceof Date) {
            return DateTimeService._getTime(DateTimeService._fromJSDate(date));
        }
        return date.toFormat(`${is24HoursFormat ? 'HH' : 'hh'}${':mm'}${addMeridian ? ' a' : ''}`);
    }

    convertTimeSpanToDate(timeSpan: any): Date | undefined {
        if (timeSpan instanceof Date) {
            return timeSpan;
        }

        if (timeSpan) {
            const currentDate = new Date().toDateString();
            if (timeSpan.value) {
                return new Date(
                    `${currentDate} ${this.change24To12Hour(timeSpan.value.hours)}:${timeSpan.value.minutes}`
                );
            }
            return new Date(`${currentDate} ${this.change24To12Hour(timeSpan.hours)}:${timeSpan.minutes}`);
        }

        return timeSpan;
    }

    change24To12Hour(hours: number): number {
        return hours % 12;
    }

    getNextHour(): Date {
        let now = new Date();
        if (now.getMinutes() >= 1) {
            now.setHours(now.getHours() + 1);
        }
        now.setMinutes(0);
        return now;
    }

    /**
     * workaround functions to address issue converting from/to js local date-time
     * https://github.com/valor-software/ngx-bootstrap/issues/5635

        if offset equals -60 then the time zone offset is UTC+01
     * The number of minutes returned by getTimezoneOffset() is positive if the local time zone is behind UTC,
     * and negative if the local time zone is ahead of UTC. For example, for UTC+10, -600 will be returned.
     *
     * Note we're not shifting the time, just adding back the timezone so that the UI components are working with
     * local dates.
     *
     * This effectively causes whatever the user enters to be the time of the event and local time of the schools
     * timezone is always assumed.
     */
    convertUTCToLocalDate(date: Date): Date {
        let localDate = new Date(0);
        if (localDate.getTimezoneOffset() < 0) {
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        } else if (localDate.getTimezoneOffset() > 0) {
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        }
        return date;
    }

    /**
     * Then here we are removing the timezone so that we are saving whatever the user entered as a UTC date
     *
     */
    convertLocalDateToUTC(date: Date): Date {
        let localDate = new Date(0);
        if (localDate.getTimezoneOffset() < 0) {
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        } else if (localDate.getTimezoneOffset() > 0) {
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        }
        return date;
    }

    /**
     *
     * @param date date portion to be used
     * @param time string time: ie: 09:00 am, 02:30 pm
     * @param withSchoolTimeZone true for converting the date to the school time zone, false will only set the hour and time
     * @returns converted Datetime with hour and time updated
     */
    fromDatetimePickerWithTime(date: Date | DateTime, time: string): DateTime {
        if (date instanceof Date) {
            return this.fromDatetimePickerWithTime(DateTime.fromJSDate(date), time);
        }

        const dateTime = date as DateTime;

        const timeFormatted = this.formatTime(time);

        let timeAsDateTime = DateTime.fromISO(timeFormatted);

        const result = DateTime.local(
            dateTime.year,
            dateTime.month,
            dateTime.day,
            timeAsDateTime.hour,
            timeAsDateTime.minute
        );
        return result;
    }

    firstDateOfMonth(date: Date | DateTime): DateTime {
        if (date instanceof Date) {
            return this.firstDateOfMonth(DateTime.fromJSDate(date));
        }
        return date.startOf('month').set({ hour: 0, minute: 0, second: 0 });
    }

    lastDateOfMonth(date: Date | DateTime): DateTime {
        if (date instanceof Date) {
            return this.lastDateOfMonth(DateTime.fromJSDate(date));
        }
        return date.endOf('month').set({ hour: 23, minute: 59, second: 0 });
    }

    dateTimesAreSameDay(dateTime1: Date | DateTime, dateTime2: Date | DateTime) {
        return DateTimeService._dateTimesAreSameDay(dateTime1, dateTime2);
    }

    static _dateTimesAreSameDay(dateTime1: Date | DateTime, dateTime2: Date | DateTime) {
        dateTime1 = DateTimeService._ensureDateTime(dateTime1);
        dateTime2 = DateTimeService._ensureDateTime(dateTime2);

        return (
            dateTime1.year === dateTime2.year && dateTime1.month === dateTime2.month && dateTime1.day === dateTime2.day
        );
    }

    /**
     * ensure time is formatted in two digits, ie: 7:5 am should be 07:05 am
     */
    formatTime(time: string): string | undefined {
        if (!time) {
            return undefined;
        }

        let hours = time.split(':')[0];
        let minutes = time.split(':')[1];
        hours = hours.length === 1 ? 0 + hours : hours;
        minutes = minutes.length === 1 ? 0 + minutes : minutes;

        let ampm = time.split(':')[1].replace(minutes, '');

        return `${hours}:${minutes}${ampm?.toUpperCase()}`;
    }

    validateEndTimeGreaterThanStartTime(sDate: string | Date, eDate: string | Date): boolean {
        if (sDate == null || eDate == null) {
            return false;
        }

        if (sDate instanceof Date && eDate instanceof Date) {
            let startDate = new Date(sDate);
            let endDate = new Date(eDate);
            let startingTime = new Date(new Date().setUTCHours(startDate.getHours(), startDate.getMinutes(), 0, 0));
            let endingTime = new Date(new Date().setUTCHours(endDate.getHours(), endDate.getMinutes(), 0, 0));

            return endingTime.getTime() > startingTime.getTime();
        }

        let startTime = this.fromTimeString(sDate as string);
        let endTime = this.fromTimeString(eDate as string);

        return endTime.toMillis() > startTime.toMillis();
    }

    static _isMinuteDifferenceInMultipleOf(startDate: string, endDate: string, defaultTourDuration: number): boolean {
        if (startDate == null || endDate == null) {
            return false;
        }

        const _startDate = DateTimeService._fromTimeString(startDate);
        const _endDate = DateTimeService._fromTimeString(endDate);
        let minutes = DateTimeService._getDiffInMinutes(_startDate, _endDate);
        return minutes % defaultTourDuration === 0;
    }

    /**
     * Create a DateTime from `timeString` with the date portion set from `date` if specified
     * otherwise current local date
     * @param timeString time portion, IE: 08:30 AM, 14:45
     * @param date DateTime to use year, month and day, by default current local date
     * @returns
     */
    fromTimeString(timeString: string, date: DateTime = DateTime.local()): DateTime {
        return DateTimeService._fromTimeString(timeString, date);
    }

    /**
     * Create a DateTime from `timeString` with the date portion set from `date` if specified
     * otherwise current local date
     * @param timeString time portion, IE: 08:30 AM, 14:45
     * @param date DateTime to use year, month and day, by default current local date
     * @returns
     */
    static _fromTimeString(timeString: string, date: DateTime = DateTime.local()): DateTime {
        const timeFormat =
            timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')
                ? DateTimeService.TIME_FORMAT_12_HOURS
                : DateTimeService.TIME_FORMAT_24_HOURS;

        const time = DateTime.fromFormat(timeString, timeFormat).set({
            year: date.year,
            month: date.month,
            day: date.day,
            second: 0,
            millisecond: 0,
        });

        return time;
    }

    getNextDayOfWeek(currentDay: DayOfWeek): DayOfWeek {
        const days = Object.values(DayOfWeek);
        const currentIndex = days.indexOf(currentDay);
        const nextIndex = (currentIndex + 1) % days.length;
        return days[nextIndex];
    }

    /**
     * Returns true if date and time ranges overlap exclusively (ex. true for 10:00-11:00 and 10:30-11:30 but false for 10:00-11:00 and 11:00-12:000)
     * @param start1
     * @param end1
     * @param start2
     * @param end2
     * @returns
     */
    isOverlappingExclusive(start1: DateTime, end1: DateTime, start2: DateTime, end2: DateTime): boolean {
        // credit: https://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap#comment35041911_325939
        return start1 < end2 && start2 < end1;
    }
}

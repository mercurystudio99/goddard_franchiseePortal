import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { ScheduleDto } from '@shared/service-proxies/service-proxies';
import { DateTime } from 'luxon';

export class ScheduleDtoExt extends ScheduleDto {
    isSelectedOnDate(date: Date | DateTime): boolean {
        return DateTimeService._dateTimesAreSameDay(this.date, date) && this.items?.length > 0;
    }
}

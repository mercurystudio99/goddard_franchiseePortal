import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';

@Pipe({
    name: 'timeSpanToDate',
})
export class TimeSpanToDatePipe implements PipeTransform {
    constructor(private _dateTimeService: DateTimeService) {}

    transform(value: any): Date | undefined {
        return this._dateTimeService.convertTimeSpanToDate(value);
    }
}

import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

@Pipe({
    name: 'luxonDateFormat',
})
export class LuxonDatePipe implements PipeTransform {
    transform(value: DateTime | Date, format: string = 'LL/dd/yyyy'): any {
        if (!value) {
            return value;
        }
        let dateTimeToUse: DateTime;
        if (value instanceof Date) {
            dateTimeToUse = DateTime.fromJSDate(value);
        } else {
            dateTimeToUse = value;
        }

        return dateTimeToUse.toFormat(format);
    }
}

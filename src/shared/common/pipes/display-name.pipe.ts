import { camelCaseToDisplayName } from '@shared/utils/utils';
import { Pipe, PipeTransform } from '@angular/core';

/**
 * {{ someText | displayName }}
 */
@Pipe({
    name: 'displayName',
})
export class DisplayNamePipe implements PipeTransform {
    transform(text: string) {
        return camelCaseToDisplayName(text);
    }
}

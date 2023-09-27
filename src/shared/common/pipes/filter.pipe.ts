import { Pipe, PipeTransform } from '@angular/core';

/**
 * usage example: <li *ngFor="let item of items | filter:{foo:'bar'}">
 */
@Pipe({
    name: 'filter',
    pure: false,
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], filter: Record<string, any>): any {
        if (!items || !filter) {
            return items;
        }

        const key = Object.keys(filter)[0];
        const value = filter[key];

        return items.filter((e) => e[key].indexOf(value) !== -1);
    }
}

import { Pipe, PipeTransform } from '@angular/core';

/**
 * {{ someText | split: '{0}': 0 }}
 */
@Pipe({
    name: 'split',
})
export class SplitPipe implements PipeTransform {
    //credits: https://dev.to/kenan7/creating-split-custom-pipe-in-angular-3n8f
    transform(text: string, by: string, index: number = 0) {
        let arr = text.split(by);
        return arr[index];
    }
}

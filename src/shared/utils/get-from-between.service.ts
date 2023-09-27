import { Injectable } from '@angular/core';

//credits: https://stackoverflow.com/a/38885885
@Injectable()
export class GetFromBetweenService {
    private results: string[] = [];
    private source: string = '';

    getFromBetween(sub1: string, sub2: string): string {
        if (this.source.indexOf(sub1) < 0 || this.source.indexOf(sub2) < 0) {
            return '';
        }

        let SP = this.source.indexOf(sub1) + sub1.length;
        let string1 = this.source.substring(0, SP);
        let string2 = this.source.substring(SP);
        let TP = string1.length + string2.indexOf(sub2);

        return this.source.substring(SP, TP);
    }

    removeFromBetween(sub1: string, sub2: string) {
        if (this.source.indexOf(sub1) < 0 || this.source.indexOf(sub2) < 0) return false;
        let removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
        this.source = this.source.replace(removal, '');
    }

    getAllResults(sub1, sub2): void {
        // first check to see if we do have both substrings
        if (this.source.indexOf(sub1) < 0 || this.source.indexOf(sub2) < 0) {
            this.results.push(this.source);
            return;
        }

        // find one result
        let result = this.getFromBetween(sub1, sub2);

        // push it to the results array
        this.results.push(result);

        // remove the most recently found one from the string
        this.removeFromBetween(sub1, sub2);

        // if there's more substrings
        if (this.source.indexOf(sub1) > -1 && this.source.indexOf(sub2) > -1) {
            this.getAllResults(sub1, sub2);
        } else return;
    }

    getValueFromBetween(currentValue: string, sub1: string, sub2: string): string[] {
        this.results = [];
        this.source = currentValue;
        this.getAllResults(sub1, sub2);

        return this.results;
    }

    /**
     * Concat all values found inside the currentValue
     * @param currentValue
     * @param sub1: starting value that must be substring
     * @param sub2: ending value that must be substring
     * @returns concatenated values found in currentValue, after removing all other texts that might contain
     * I.E. "test <a>anchor 1</a> with some other text user may add<a> and anchor 2</a>." should return: "<a>anchor 1</a><a> and anchor 2</a>"
     */
    getValueFromBetweenConcat(currentValue: string, sub1: string, sub2: string): string {
        let result1 = this.getValueFromBetween(currentValue, sub1, sub2);
        let result = '';
        if (result1.length) {
            for (let index = 0; index < result1.length; index++) {
                result += `${sub1}${result1[index]}${sub2}`;
            }
        }
        return result;
    }

    /**
     * remove all values found from the currentValue
     * @param currentValue
     * @param sub1: starting value find the value that must be substring
     * @param sub2: ending value find the value that must be substring
     * @returns
     */
    removeAllFromBetweenConcat(currentValue: string, sub1: string, sub2: string): string {
        let result = this.getValueFromBetween(currentValue, sub1, sub2);
        if (result.length) {
            for (let index = 0; index < result.length; index++) {
                currentValue = currentValue.replace(`${sub1}${result[index]}${sub2}`, '');
            }
        }
        return currentValue;
    }
}

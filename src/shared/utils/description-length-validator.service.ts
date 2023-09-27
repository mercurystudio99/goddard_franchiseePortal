import { Injectable } from '@angular/core';
import { SiteEditorConstants } from '@app/site-editor/site-editor.constants';
import { AppConsts } from '@shared/AppConsts';
import { parseFromHtmlString } from './utils';

@Injectable()
export class DescriptionLengthValidatorService {
    constructor() {}

    /**
     * remove all values found in the substring criteria from the currentValue
     * and validate if the remaining characters length exceeds the maxLength
     * @param currentValue
     * @param maxLength: maxLength to validate
     * @returns
     */
    isMaxDescriptionLengthValid(currentValue: string, maxLength: number): boolean {
        let value = parseFromHtmlString(currentValue, 'p');
        return value?.length <= maxLength;
    }

    /**
     * Finds the length of all markup of the p and a tags in the box
     * @param currentValue
     * @param maxLength: maxLength to validate
     * @returns true if markup length is greater than maxlength, false otherwise
     */
    isMarkupLengthValid(currentValue: string, maxLength: number): boolean {
        if (!currentValue.includes(AppConsts.endingAnchor)) {
            // We will hit the description limit long before hitting the markup limit, no anchors, no problem
            return true;
        }

        // Get length of markup
        const outer = parseFromHtmlString(currentValue, 'p', true, (e) => e.outerHTML) ?? '';
        const inner = parseFromHtmlString(currentValue, 'p', true, (e) => e.innerHTML) ?? '';

        const aOuter = parseFromHtmlString(currentValue, 'a', true, (e) => e.outerHTML) ?? '';
        const aInner = parseFromHtmlString(currentValue, 'a', true, (e) => e.innerHTML) ?? '';

        const pMarkupLength = outer.length - inner.length;
        const aMarkupLength = aOuter.length - aInner.length;
        console.log('Total Markup length: ' + (aMarkupLength + pMarkupLength));
        return (pMarkupLength + aMarkupLength) <= maxLength;
    }

    /**
     * check how many characters can be added to a field using PrimeNG WYSIWYG editor
     */
    remainingCharacters(description: string, maxDescriptionLength: number): number {
        if (!description?.length || description === SiteEditorConstants.PRIMENG_EDITOR_TEXT_WRAPPER) {
            return maxDescriptionLength;
        }

        let descriptionOnly = parseFromHtmlString(description, 'p', true);
        let remaining = maxDescriptionLength - descriptionOnly?.length;

        return remaining > 0 ? remaining : 0;
    }
}

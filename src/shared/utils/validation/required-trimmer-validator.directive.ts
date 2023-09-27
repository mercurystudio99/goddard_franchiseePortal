import { AppConsts } from '@shared/AppConsts';
import { Attribute, Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
import { parseFromHtmlString } from '../utils';

@Directive({
    selector: '[validateRequired][formControlName],[validateRequired][formControl],[validateRequired][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => RequiredTrimmerValidator), multi: true }],
})
export class RequiredTrimmerValidator implements Validator {
    constructor(
        @Attribute('validateRequired') public validateRequired: string,
        @Attribute('trimStartToValidateRequired') public trimStartToValidateRequired: string,
        @Attribute('trimEndToValidateRequired') public trimEndToValidateRequired: string
    ) {}

    innerValidate(value: string): { [key: string]: any } {
        if (value?.startsWith(AppConsts.startingPTag)) {
            // selectAll = true so that we consider all html elements in the field
            value = parseFromHtmlString(value, 'p', true);
        }
        value = value?.trim();

        if (!value) {
            return {
                validateRequired: true,
            };
        }

        if (this.trimStartToValidateRequired && value.startsWith(this.trimStartToValidateRequired)) {
            value = value.substring(this.trimStartToValidateRequired.length);
        }

        if (this.trimEndToValidateRequired && value.endsWith(this.trimEndToValidateRequired)) {
            value = value.substring(0, value.length - this.trimEndToValidateRequired.length);
        }

        if (!value) {
            return {
                validateRequired: true,
            };
        }

        //return null on successful validation
        return null;
    }

    validate(control: AbstractControl): { [key: string]: any } {
        let value = control.value;
        const result = this.innerValidate(value);

        if (!result) {
            this.deleteErrors(control);
        }

        return result;
    }

    deleteErrors(control: AbstractControl) {
        if (control.errors) {
            delete control.errors['validateRequired'];
        }

        if (control.errors && !Object.keys(control.errors).length) {
            control.setErrors(null);
        }
    }
}

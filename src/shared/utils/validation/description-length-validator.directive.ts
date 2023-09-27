import { Attribute, Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
import { DescriptionLengthValidatorService } from '@shared/utils/description-length-validator.service';

@Directive({
    selector:
        '[validateMaxDescriptionLength][formControlName],[validateMaxDescriptionLength][formControl],[validateMaxDescriptionLength][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => DescriptionLengthValidator), multi: true }],
})
export class DescriptionLengthValidator implements Validator {
    private _validationRules = ['validateMaxLength', 'validateMaxLinksLength'];
    @Input() maxDescriptionLength: number | undefined = undefined;
    @Input() maxMarkupLength: number | undefined = undefined;

    constructor(private _maxDescriptionValidator: DescriptionLengthValidatorService) {}

    /**
     * Validates at once both: max length of the text and the links in it
     */
    validate(control: AbstractControl): { [key: string]: any } {
        let value = control.value;

        if (!value || !this.maxMarkupLength || !this.maxDescriptionLength) {
            this.deleteErrors(control, this._validationRules);
            return null;
        }

        let isValidDescLength = this._maxDescriptionValidator.isMaxDescriptionLengthValid(
            value,
            this.maxDescriptionLength
        );
        let isValidLinksLength = this._maxDescriptionValidator.isMarkupLengthValid(value, this.maxMarkupLength);

        if (value && isValidDescLength && isValidLinksLength) {
            this.deleteErrors(control, this._validationRules);
            return null;
        }

        let result = {};
        if (!isValidDescLength) {
            result[this._validationRules[0]] = true;
        } else {
            this.deleteErrors(control, [this._validationRules[0]]);
        }
        if (!isValidLinksLength) {
            result[this._validationRules[1]] = true;
        } else {
            this.deleteErrors(control, [this._validationRules[1]]);
        }

        return result;
    }

    deleteErrors(control: AbstractControl, validationRules: string[]) {
        if (control.errors) {
            for (let index = 0; index < validationRules.length; index++) {
                delete control.errors[validationRules[index]];
            }
        }

        if (control.errors && !Object.keys(control.errors).length) {
            control.setErrors(null);
        }
    }
}

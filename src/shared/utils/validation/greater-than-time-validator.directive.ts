import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { Attribute, Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
import { DateTime } from 'luxon';

//Got from: https://scotch.io/tutorials/how-to-implement-a-custom-validator-directive-confirm-password-in-angular-2
@Directive({
    selector:
        '[validateTimeGreaterThan][formControlName],[validateTimeGreaterThan][formControl],[validateTimeGreaterThan][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => GreaterThanTimeValidator), multi: true }],
})
export class GreaterThanTimeValidator implements Validator {
    constructor(
        private _dateTimeService: DateTimeService,
        @Attribute('validateTimeGreaterThan') public validateTimeGreaterThan: string,
        @Attribute('reverse') public reverse: string,
        @Attribute('skipValidation') public skipValidation: string
    ) {}
    private get isReverse() {
        if (!this.reverse) {
            return false;
        }
        return this.reverse === 'true';
    }
    private get isSkipValidation() {
        if (!this.skipValidation) {
            return false;
        }
        return this.skipValidation === 'true';
    }
    validate(control: AbstractControl): { [key: string]: any } {
        const pairControl = control.root.get(this.validateTimeGreaterThan);

        if (this.isSkipValidation) {
            return null;
        }
        if (!pairControl) {
            return null;
        }

        const value = control.value;
        const pairValue = pairControl.value;

        if (!value && !pairValue) {
            this.deleteErrors(pairControl);
            return null;
        }

        const isValid = this.isReverse ? this.validateDates(value, pairValue) : this.validateDates(pairValue, value);

        if (isValid) {
            this.deleteErrors(pairControl);
            return null;
        }

        const result = {
            validateTimeGreaterThan: true,
        };
        pairControl.setErrors(result);

        return result;
    }

    deleteErrors(control: AbstractControl) {
        if (control.errors) {
            delete control.errors['validateTimeGreaterThan'];
        }
        if (control.errors && !Object.keys(control.errors).length) {
            control.setErrors(null);
        }
    }

    validateDates(sDate: string | Date, eDate: string | Date): boolean {
        return this._dateTimeService.validateEndTimeGreaterThanStartTime(sDate, eDate);
    }
}

import { Attribute, Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
    selector: '[validateNoHtml][formControlName],[validateNoHtml][formControl],[validateNoHtml][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => NotHtmlValidator), multi: true }],
})
export class NotHtmlValidator implements Validator {
    constructor(@Attribute('validateNoHtml') public validateNoHtml: string) {}

    validate(control: AbstractControl): { [key: string]: any } {
        const value = control.value;
        //validates url starts with the protocol to prevent entering relative links
        let valid = /<(.|\n)*?>/g.test(value);

        if (!value) {
            this.deleteErrors(control);
            return null;
        }

        if (valid) {
            return {
                validateNoHtml: true,
            };
        }
    }

    deleteErrors(control: AbstractControl) {
        if (control.errors) {
            delete control.errors['validateNoHtml'];
        }

        if (control.errors && !Object.keys(control.errors).length) {
            control.setErrors(null);
        }
    }
}

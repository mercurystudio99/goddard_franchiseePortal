import { Attribute, Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
import { AppUrlService } from '@shared/common/nav/app-url.service';

@Directive({
    selector: '[validateURI][formControlName],[validateURI][formControl],[validateURI][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => URIValidator), multi: true }],
})
export class URIValidator implements Validator {
    constructor(@Attribute('validateURI') public validateURI: string, private appUrlService: AppUrlService) {}

    validate(control: AbstractControl): { [key: string]: any } {
        const value = control.value;
        //validates url starts with the protocol to prevent entering relative links
        let valid = this.appUrlService.validHttpProtocol(value);

        if (!value) {
            this.deleteErrors(control);
            return null;
        }

        if (!valid) {
            return {
                validateURI: true,
            };
        }
    }

    deleteErrors(control: AbstractControl) {
        if (control.errors) {
            delete control.errors['validateURI'];
        }

        if (control.errors && !Object.keys(control.errors).length) {
            control.setErrors(null);
        }
    }
}

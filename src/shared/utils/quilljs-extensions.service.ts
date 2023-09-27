import { Injectable } from '@angular/core';
import { Editor } from 'primeng/editor';

@Injectable()
export class QuilljsExtensionsService {
    validateUrl(editor: Editor, callBack: (isValid: boolean) => void) {
        const quill = editor['valueAccessor']['quill'];
        const tooltipSave = quill.theme.tooltip.save;

        // overwrite save link functionality
        quill.theme.tooltip.save = function () {
            // validate url
            let validUrl = /^(http(s)?:\/\/).{1,}/.test(this.textbox.value);

            if (validUrl) {
                tooltipSave.call(this);
            }
            callBack(validUrl);
        };
    }

    onTooltipHide(editor: Editor, callBack: () => void) {
        const quill = editor['valueAccessor']['quill'];
        const tooltipHide = quill.theme.tooltip.hide;

        quill.theme.tooltip.hide = function () {
            callBack();
            tooltipHide.call(this);
        };
    }
}

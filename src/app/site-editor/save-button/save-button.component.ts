import { Component, Injector, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SiteEditorService } from '../services';

@Component({
    selector: 'app-save-button',
    templateUrl: './save-button.component.html',
    styleUrls: ['./save-button.component.css'],
})
export class SaveButtonComponent extends AppComponentBase implements OnInit {
    @Input() className: string = 'btn btn-primary'; // default value if none is passed
    @Input() text: string = this.l('Save Updates'); // default value if none is passed
    @Input() type: string = 'button'; // default value if none is passed
    @Input() disabled: boolean = false; // default value if none is passed
    @Output() onClickEvent: EventEmitter<any> = new EventEmitter<any>();

    constructor(injector: Injector, private _siteEditorService: SiteEditorService) {
        super(injector);
    }

    ngOnInit(): void {
        //Subscribe to any changes for show or hide the spinner and also
        //to enable or disable the button
        this._siteEditorService.showSpinnerSubject.subscribe((showSpinner) => {
            //disable the button while showing the spinner
            this.disabled = showSpinner;
            if (showSpinner) {
                this.spinnerService.show();
            } else {
                this.spinnerService.hide();
            }
        });

        this._siteEditorService.disableButtonSubject.subscribe((disable) => {
            this.disabled = disable;
        });
    }

    onClick(): void {
        if (!this.disabled) {
            //raise onclick event to let parent save changes
            this.onClickEvent.emit();
        }
    }
}

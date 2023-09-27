import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DaysOfInterest, LeadDto } from '@shared/service-proxies/service-proxies';
import { ToursEditorService } from '../services/tours-editor.service';
import { ToursEditorConstants } from '../tours-editor-constants';

@Directive({
    selector: `[daysOfInterest]`,
})
export class DaysOfInterestDirective {
    @Input() lead: LeadDto;
    @Output() updateLead: EventEmitter<LeadDto> = new EventEmitter();
    allWeek: string = ToursEditorConstants.ALL_WEEK;

    constructor(private _toursEditorService: ToursEditorService) {}

    @HostListener('change', ['$event'])
    onDaysOfInterestChanged(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        if (!value) {
            return;
        }

        if (input.checked) {
            if (value === this.allWeek) {
                this._toursEditorService.addAllWeekDays(this.lead);
            } else {
                this._toursEditorService.safeAddSelectedDayOfInterest(value, this.lead);
                if (value === DaysOfInterest.ToBeDetermined) {
                    this._toursEditorService.removeAllWeekDays(this.lead);
                }
            }
        } else {
            if (value !== this.allWeek) {
                this._toursEditorService.removeDayOfInterest(value, this.lead);
            }
        }

        this.updateLead.emit(this.lead);
    }
}

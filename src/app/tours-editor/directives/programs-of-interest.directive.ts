import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FeatureInterestOption } from '@app/shared/common/apis/generated/features';
import { DaysOfInterest, LeadDto } from '@shared/service-proxies/service-proxies';
import { ToursEditorService } from '../services/tours-editor.service';
import { ToursEditorConstants } from '../tours-editor-constants';

@Directive({
    selector: `[programsOfInterest]`,
})
export class ProgramsOfInterestDirective {
    @Input() lead: LeadDto;
    @Input() programsOfInterestOptions: Array<FeatureInterestOption>;
    @Output() updateLead: EventEmitter<LeadDto> = new EventEmitter();
    allWeek: string = ToursEditorConstants.ALL_WEEK;

    constructor(private _toursEditorService: ToursEditorService) {}

    @HostListener('change', ['$event'])
    onProgramsOfInterestChanged(event: Event) {
        this._toursEditorService.onProgramOfInterestChanged(event, this.lead, this.programsOfInterestOptions);
    }
}

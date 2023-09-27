import { NgModule } from '@angular/core';
import { ToursEditorRoutingModule } from './tours-editor-routing.module';

import { CommonModule } from '@angular/common';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { ManageToursComponent } from './manage-tours/manage-tours.component';
import { CompletedToursComponent } from './completed-tours/completed-tours.component';
import { EditToursModalComponent } from './edit-tours-modal/edit-tours-modal.component';
import { EditAvailabilityExceptionsModal } from './edit-availability-exceptions-modal/edit-availability-exceptions-modal.component';
import { FilterToursComponent } from './manage-tours/filter-tours/filter-tours.component';
import { EditLeadModalComponent } from './edit-lead-modal/edit-lead-modal.component';
import { DaysOfInterestDirective } from './directives/days-of-interest.directive';
import { ProgramsOfInterestDirective } from './directives/programs-of-interest.directive';
import { TourScheduleComponent } from './tour-schedule/tour-schedule.component';
import { InputMaskModule } from 'primeng/inputmask';
import { EditToursAvailabilityComponent } from './edit-tours-availability/edit-tours-availability.component';
import { EditToursAvailabilitySettingsComponent } from './edit-tours-availability-settings/edit-tours-availability-settings.component';
@NgModule({
    imports: [
        AppSharedModule,
        CommonModule,
        AppBsModalModule,
        UtilsModule,
        ToursEditorRoutingModule,
        TimepickerModule.forRoot(),
        InputMaskModule
    ],
    declarations: [
        ManageToursComponent,
        CompletedToursComponent,
        EditToursAvailabilityComponent,
        EditToursAvailabilitySettingsComponent,
        EditToursModalComponent,
        EditAvailabilityExceptionsModal,
        FilterToursComponent,
        EditLeadModalComponent,
        DaysOfInterestDirective,
        ProgramsOfInterestDirective,
        TourScheduleComponent
    ],
    providers: [],
    exports: [DaysOfInterestDirective, ProgramsOfInterestDirective],
})
export class ToursEditorModule {}

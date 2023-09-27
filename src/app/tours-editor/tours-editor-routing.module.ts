import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DeactivateGuardService } from '@shared/utils/deactivate-guard.service';
import { CompletedToursComponent } from './completed-tours/completed-tours.component';
import { EditToursAvailabilityComponent } from './edit-tours-availability/edit-tours-availability.component';
import { ManageToursComponent } from './manage-tours/manage-tours.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'manage-tours', component: ManageToursComponent },
                    { path: 'edit-completed-tours', component: CompletedToursComponent },
                    {
                        path: 'edit-tours-availability',
                        component: EditToursAvailabilityComponent,
                        canDeactivate: [DeactivateGuardService],
                    },
                    { path: '', redirectTo: 'manage-tours', pathMatch: 'full' },
                    { path: '**', redirectTo: 'manage-tours' },
                ],
            },
        ]),
    ],
    exports: [RouterModule],
})
export class ToursEditorRoutingModule {}

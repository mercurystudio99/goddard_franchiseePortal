import { EditFacultyComponent } from './edit-faculty/edit-faculty.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EditFeaturesComponent } from './edit-features/edit-features.component';
import { EditHomePageComponent } from './edit-home-page/edit-home-page.component';
import { EditTestimonialsComponent } from './edit-testimonials/edit-testimonials.component';
import { EditTestimonialsPublishedComponent } from './edit-testimonials/edit-testimonials-published/edit-testimonials-published.component';
import { EditTestimonialsUnpublishedComponent } from './edit-testimonials/edit-testimonials-unpublished/edit-testimonials-unpublished.component';
import { EditCareersComponent } from './edit-careers/edit-careers.component';
import { EditEventsComponent } from './edit-events/edit-events.component';
import { EditEventsCalendarComponent } from './edit-events/edit-events-calendar/edit-events-calendar.component';
import { EditEventsTemplatesComponent } from './edit-events/edit-events-templates/edit-events-templates.component';
import { EditSummerCampComponent } from './edit-summer-camp/edit-summer-camp.component';
import { DeactivateGuardService } from '@shared/utils/deactivate-guard.service';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'edit-home-page', component: EditHomePageComponent },
                    {
                        path: 'edit-features',
                        component: EditFeaturesComponent,
                        canDeactivate: [DeactivateGuardService],
                    },
                    { path: 'edit-faculty', component: EditFacultyComponent },
                    { path: 'edit-testimonials', component: EditTestimonialsComponent },
                    { path: 'edit-summer-camp', component: EditSummerCampComponent },
                    {
                        path: 'edit-testimonials',
                        component: EditTestimonialsComponent,
                        children: [
                            { path: '', redirectTo: 'published', pathMatch: 'full' },
                            { path: 'published', component: EditTestimonialsPublishedComponent },
                            { path: 'unpublished', component: EditTestimonialsUnpublishedComponent },
                        ],
                    },
                    { path: 'edit-careers', component: EditCareersComponent },
                    {
                        path: 'edit-events',
                        component: EditEventsComponent,
                        children: [
                            { path: '', redirectTo: 'calendar', pathMatch: 'full' },
                            { path: 'calendar', component: EditEventsCalendarComponent },
                            { path: 'templates', component: EditEventsTemplatesComponent },
                        ],
                    },
                    { path: '', redirectTo: 'edit-home-page', pathMatch: 'full' },
                    { path: '**', redirectTo: 'edit-home-page' },
                ],
            },
        ]),
    ],
    exports: [RouterModule],
})
export class SiteEditorRoutingModule {}

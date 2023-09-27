import { NgModule } from '@angular/core';
import { SiteEditorRoutingModule } from './site-editor-routing.module';
import { EditHomePageComponent } from './edit-home-page/edit-home-page.component';
import { PagePreviewComponent } from './page-preview/page-preview.component';
import { EditHomePageHeroImageComponent } from './edit-home-page/edit-home-page-hero-image/edit-home-page-hero-image.component';
import { EditHomePageCardsComponent } from './edit-home-page/edit-home-page-cards/edit-home-page-cards.component';
import { CommonModule } from '@angular/common';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { UtilsModule } from '@shared/utils/utils.module';
import { IframeService, SiteEditorService } from './services';
import { EditFeaturesComponent } from './edit-features/edit-features.component';
import { SaveButtonComponent } from './save-button/save-button.component';
import { EditFacultyComponent } from './edit-faculty/edit-faculty.component';
import { EditFacultyMembersComponent } from './edit-faculty/edit-faculty-members/edit-faculty-members.component';
import { SortFacultyMembersComponent } from './edit-faculty/sort-faculty-members/sort-faculty-members.component';
import { EditTestimonialsComponent } from './edit-testimonials/edit-testimonials.component';
import { EditTestimonialModalComponent } from './edit-testimonials/edit-testimonial-modal/edit-testimonial-modal.component';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { DragndropDirective } from './edit-faculty/dragndrop.directive';
import { EditTestimonialsPublishedComponent } from './edit-testimonials/edit-testimonials-published/edit-testimonials-published.component';
import { EditTestimonialsUnpublishedComponent } from './edit-testimonials/edit-testimonials-unpublished/edit-testimonials-unpublished.component';
import { EditCareersComponent } from './edit-careers/edit-careers.component';
import { EditCareersModalComponent } from './edit-careers/edit-careers-modal/edit-careers-modal.component';
import { EditEventsCalendarComponent } from './edit-events/edit-events-calendar/edit-events-calendar.component';
import { EditEventsTemplatesComponent } from './edit-events/edit-events-templates/edit-events-templates.component';
import { EditEventsComponent } from './edit-events/edit-events.component';
import { EditEventModalComponent } from './edit-events/edit-events-calendar/edit-event-modal/edit-event-modal.component';
import { HomePageImageCardsComponent } from './edit-home-page/home-page-image-cards/home-page-image-cards.component';
import { EditTeaserComponent } from './edit-home-page/edit-teaser/edit-teaser.component';
import { EventTemplateModalComponent } from './edit-events/edit-events-templates/event-template-modal/event-template-modal.component';
import { EditSummerCampComponent } from './edit-summer-camp/edit-summer-camp.component';
import { EditSummerCampInfoComponent } from './edit-summer-camp/edit-summer-camp-info/edit-summer-camp-info.component';
import { EditSummerCampEventsComponent } from './edit-summer-camp/edit-summer-camp-events/edit-summer-camp-events.component';

@NgModule({
    imports: [
        AppSharedModule,
        CommonModule,
        AppBsModalModule,
        UtilsModule,
        SiteEditorRoutingModule,
        TimepickerModule.forRoot(),
    ],
    declarations: [
        EditHomePageComponent,
        PagePreviewComponent,
        EditHomePageHeroImageComponent,
        EditHomePageCardsComponent,
        EditFeaturesComponent,
        SaveButtonComponent,
        EditFacultyComponent,
        EditFacultyMembersComponent,
        SortFacultyMembersComponent,
        EditSummerCampComponent,
        EditSummerCampInfoComponent,
        EditSummerCampEventsComponent,
        DragndropDirective,
        EditTestimonialsComponent,
        EditTestimonialModalComponent,
        EditTestimonialsPublishedComponent,
        EditTestimonialsUnpublishedComponent,
        EditCareersComponent,
        EditCareersModalComponent,
        EditEventsComponent,
        EditEventsCalendarComponent,
        EditEventsTemplatesComponent,
        EditEventModalComponent,
        HomePageImageCardsComponent,
        EditTeaserComponent,
        EventTemplateModalComponent,
    ],
    providers: [IframeService, SiteEditorService],
    exports: [],
})
export class SiteEditorModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from '@app/app-routing.module';
import { CoreModule } from '@metronic/app/core/core.module';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { TextMaskModule } from 'angular2-text-mask';
import { FileUploadModule } from 'ng2-file-upload';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ImageCropperModule } from 'ngx-image-cropper';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AppCommonModule } from './common/app-common.module';
import { ThemesLayoutBaseComponent } from './layout/themes/themes-layout-base.component';
import { GoddardIconsComponent } from './common/goddard-icons/goddard-icons.component';
import { EditorModule } from 'primeng/editor';
import { FullCalendarModule } from '@fullcalendar/angular';
import { DragDropModule } from 'primeng/dragdrop';
import { CarouselModule } from 'primeng/carousel';
import { TabViewModule } from 'primeng/tabview';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CalendarModule } from 'primeng/calendar';
import { MailtoLinkComponent } from './common/mailto-link/mailto-link.component';
import { GoddardTooltipComponent } from './common/goddard-tooltip/goddard-tooltip.component';
import { GoddardConfirmationModalComponent } from './common/goddard-confirmation-modal/goddard-confirmation-modal.component';
import { GoddardPagePreviewComponent } from './common/goddard-page-preview/goddard-page-preview.component';
import { SiteMarketingToolsPagePreviewComponent } from './common/site-marketing-tools-page-preview/site-marketing-tools-page-preview.component';

const imports = [
    CommonModule,
    FormsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    ModalModule,
    TabsModule,
    BsDropdownModule,
    PopoverModule,
    BsDatepickerModule,
    AppCommonModule,
    FileUploadModule,
    AppRoutingModule,
    UtilsModule,
    ServiceProxyModule,
    TableModule,
    PaginatorModule,
    ProgressBarModule,
    PerfectScrollbarModule,
    CoreModule,
    TextMaskModule,
    ImageCropperModule,
    AutoCompleteModule,
    NgxSpinnerModule,
    AppBsModalModule,
    TooltipModule,
    EditorModule,
    FullCalendarModule,
    DragDropModule,
    CarouselModule,
    TabViewModule,
    OverlayPanelModule,
    CalendarModule
];

@NgModule({
    imports: [...imports],
    exports: [
        ...imports,
        GoddardIconsComponent,
        MailtoLinkComponent,
        GoddardTooltipComponent,
        SiteMarketingToolsPagePreviewComponent,
        GoddardPagePreviewComponent,
        GoddardConfirmationModalComponent
    ],
    declarations: [
        ThemesLayoutBaseComponent,
        GoddardIconsComponent,
        MailtoLinkComponent,
        GoddardTooltipComponent,
        GoddardPagePreviewComponent,
        SiteMarketingToolsPagePreviewComponent,
        GoddardConfirmationModalComponent
    ],
})
export class AppSharedModule {}

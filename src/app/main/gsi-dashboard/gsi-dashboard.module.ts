import { NgModule } from '@angular/core';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { GsiDashboardComponent } from './gsi-dashboard.component';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { GsiDashboardRoutingModule } from './gsi-dashboard-routing.module';
import { WidgetYourInsightsComponent } from '@app/shared/common/customizable-dashboard/widgets/widget-your-insights/widget-your-insights.component';
import { WidgetTopToolsAndResourcesComponent } from '@app/shared/common/customizable-dashboard/widgets/widget-top-tools-and-resources/widget-top-tools-and-resources.component';
import { WidgetsMarketingToolsComponent } from '@app/shared/common/customizable-dashboard/widget-marketing-tools/widget-marketing-tools.component';
import { RouterModule } from '@angular/router';
import { Angulartics2Module } from 'angulartics2';
import { IframeService } from '@app/site-editor/services';
@NgModule({
    declarations: [
        GsiDashboardComponent,
        WidgetYourInsightsComponent,
        WidgetTopToolsAndResourcesComponent,
        WidgetsMarketingToolsComponent],
    imports: [
        AppSharedModule,
        AdminSharedModule,
        GsiDashboardRoutingModule,
        RouterModule,
        AppSharedModule,
        Angulartics2Module],
    providers:[
        IframeService
    ]
})
export class GsiDashboardModule {}

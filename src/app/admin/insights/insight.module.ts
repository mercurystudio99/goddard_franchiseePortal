import {NgModule} from '@angular/core';
import {AppSharedModule} from '@app/shared/app-shared.module';
import {AdminSharedModule} from '@app/admin/shared/admin-shared.module';
import {InsightRoutingModule} from './insight-routing.module';
import {InsightsComponent} from './insights.component';
import {CreateOrEditInsightModalComponent} from './create-or-edit-insight-modal.component';
import {ViewInsightModalComponent} from './view-insight-modal.component';



@NgModule({
    declarations: [
        InsightsComponent,
        CreateOrEditInsightModalComponent,
        ViewInsightModalComponent,
        
    ],
    imports: [AppSharedModule, InsightRoutingModule , AdminSharedModule ],
    
})
export class InsightModule {
}

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {InsightsComponent} from './insights.component';



const routes: Routes = [
    {
        path: '',
        component: InsightsComponent,
        pathMatch: 'full'
    },
    
    
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InsightRoutingModule {
}

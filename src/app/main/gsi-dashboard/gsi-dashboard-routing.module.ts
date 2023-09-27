import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GsiDashboardComponent} from './gsi-dashboard.component';

const routes: Routes = [{
    path: '',
    component: GsiDashboardComponent,
    pathMatch: 'full'
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class GsiDashboardRoutingModule {

}

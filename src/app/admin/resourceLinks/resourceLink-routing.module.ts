import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ResourceLinksComponent} from './resourceLinks.component';



const routes: Routes = [
    {
        path: '',
        component: ResourceLinksComponent,
        pathMatch: 'full'
    },
    
    
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ResourceLinkRoutingModule {
}

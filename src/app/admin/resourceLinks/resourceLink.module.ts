import {NgModule} from '@angular/core';
import {AppSharedModule} from '@app/shared/app-shared.module';
import {AdminSharedModule} from '@app/admin/shared/admin-shared.module';
import {ResourceLinkRoutingModule} from './resourceLink-routing.module';
import {ResourceLinksComponent} from './resourceLinks.component';
import {CreateOrEditResourceLinkModalComponent} from './create-or-edit-resourceLink-modal.component';
import {ViewResourceLinkModalComponent} from './view-resourceLink-modal.component';



@NgModule({
    declarations: [
        ResourceLinksComponent,
        CreateOrEditResourceLinkModalComponent,
        ViewResourceLinkModalComponent,

    ],
    imports: [AppSharedModule, ResourceLinkRoutingModule , AdminSharedModule ],
    exports: [ResourceLinksComponent, CreateOrEditResourceLinkModalComponent]
})
export class ResourceLinkModule {
}

import { Component, Injector, OnInit } from '@angular/core';
import { ResourceLinkDto, TenantDashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { WidgetComponentBaseComponent } from '../widget-component-base';
@Component({
    selector: 'app-widget-top-tools-and-resources',
    templateUrl: './widget-top-tools-and-resources.component.html',
    styleUrls: ['./widget-top-tools-and-resources.component.css'],
})
export class WidgetTopToolsAndResourcesComponent extends WidgetComponentBaseComponent implements OnInit {
    loading: boolean = true;
    title = 'TOP TOOLS & RESOURCES';
    resourceLinks: ResourceLinkDto[] = [];

    constructor(injector: Injector, private _tenantDashboardServiceProxy: TenantDashboardServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
        this.getResourceLinks();
    }

    getResourceLinks() {
        this._tenantDashboardServiceProxy
            .getAllResourceLinks()
            .pipe(
                finalize(() => {
                    this.loading = false;
                })
            )
            .subscribe(
                (result) => {
                    this.resourceLinks = result;
                },
                (error) => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }
}

import { Component, Injector, OnInit } from '@angular/core';
import { TenantDashboardServiceProxy, InsightDto } from '@shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { WidgetComponentBaseComponent } from '../widget-component-base';

@Component({
    selector: 'app-widget-your-insights',
    templateUrl: './widget-your-insights.component.html',
    styleUrls: ['./widget-your-insights.component.css'],
})
export class WidgetYourInsightsComponent extends WidgetComponentBaseComponent implements OnInit {
    loading: boolean = true;
    insightsAndUpdates: InsightDto[] = [];

    constructor(injector: Injector, private _dashboardServiceProxy: TenantDashboardServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
        this.getInsightsAndUpdates();
    }

    getInsightsAndUpdates() {
        //Limit Display of Insights to 4 most recent
        this._dashboardServiceProxy
            .getAllInsights(undefined, 'SortOrder', 0, 4)
            .pipe(
                finalize(() => {
                    this.loading = false;
                })
            )
            .subscribe(
                (result) => {
                    this.insightsAndUpdates = result?.insights;
                },
                (error) => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }
}

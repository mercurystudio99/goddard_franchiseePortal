import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './gsi-dashboard.component.html',
    styleUrls: ['./gsi-dashboard.component.less']
})

export class GsiDashboardComponent extends AppComponentBase {

    constructor(injector: Injector) {
        super(injector);
    }
}

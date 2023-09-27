import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'site-marketing-tools-email-marketing',
    templateUrl: './email-marketing.component.html',
    styleUrls: ['./email-marketing.component.css'],
    animations: [appModuleAnimation()],
})
export class EmailMarketingComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}
}

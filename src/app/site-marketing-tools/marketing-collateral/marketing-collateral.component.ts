import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'site-marketing-tools-marketing-collateral',
    templateUrl: './marketing-collateral.component.html',
    styleUrls: ['./marketing-collateral.component.css'],
    animations: [appModuleAnimation()],
})
export class MarketingCollateralComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}

    setEditors(iframeLoaded: boolean) {
        if (iframeLoaded) {
        }
    }
}

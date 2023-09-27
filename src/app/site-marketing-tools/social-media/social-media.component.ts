import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'site-marketing-tools-social-media',
    templateUrl: './social-media.component.html',
    styleUrls: ['./social-media.component.css'],
    animations: [appModuleAnimation()],
})
export class SocialMediaComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}
}

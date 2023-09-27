import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'site-marketing-tools-local-media',
    templateUrl: './local-media.component.html',
    styleUrls: ['./local-media.component.css'],
    animations: [appModuleAnimation()],
})
export class LocalMediaComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);
    }
    ngOnInit(): void {}
}

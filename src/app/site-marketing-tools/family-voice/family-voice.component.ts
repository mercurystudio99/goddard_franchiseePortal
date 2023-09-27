import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'site-marketing-tools-family-voice',
    templateUrl: './family-voice.component.html',
    styleUrls: ['./family-voice.component.css'],
    animations: [appModuleAnimation()],
})
export class FamilyVoiceComponent extends AppComponentBase implements OnInit {
    constructor(injector: Injector) {
        super(injector);
    }
    ngOnInit(): void {}
}

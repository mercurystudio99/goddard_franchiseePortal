import { GoddardPagePreviewComponent } from '@app/shared/common/goddard-page-preview/goddard-page-preview.component';
import { Component, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'site-marketing-tools-marketing-focus',
    templateUrl: './marketing-focus.component.html',
    styleUrls: ['./marketing-focus.component.css'],
    animations: [appModuleAnimation()],
})
export class MarketingFocusComponent extends AppComponentBase implements OnInit {
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.pagePreview.resizeFrame();
    }
    @ViewChild('pagePreview') pagePreview: GoddardPagePreviewComponent;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}

    setEditors(iframeLoaded: boolean) {
        if (iframeLoaded) {
        }
    }
}

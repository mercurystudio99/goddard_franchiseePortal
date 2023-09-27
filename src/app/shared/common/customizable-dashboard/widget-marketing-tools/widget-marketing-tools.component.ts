import { Component, Injector, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { GoddardPagePreviewComponent } from '../../goddard-page-preview/goddard-page-preview.component';

@Component({
    selector: 'app-widget-marketing-tools',
    templateUrl: './widget-marketing-tools.component.html',
    styleUrls: ['./widget-marketing-tools.component.css'],
})
export class WidgetsMarketingToolsComponent extends AppComponentBase implements OnInit {
    loading: boolean = true;
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

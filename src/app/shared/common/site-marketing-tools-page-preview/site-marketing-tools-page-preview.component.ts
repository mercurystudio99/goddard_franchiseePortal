import { Component, Injector, OnInit,HostListener, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';

import { GoddardPagePreviewComponent } from '@app/shared/common/goddard-page-preview/goddard-page-preview.component';
import { IframeService } from '@app/site-editor/services';
import { SiteMarketingToolsApiClientFacade } from '@shared/service-proxies/site-marketing-tools-api-client-facade.service';

@Component({
    selector: 'site-marketing-tools-page-preview',
    templateUrl: '../goddard-page-preview/goddard-page-preview.component.html',
    styleUrls: ['../goddard-page-preview/goddard-page-preview.component.css'],
})
export class SiteMarketingToolsPagePreviewComponent extends GoddardPagePreviewComponent implements OnInit {
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.resizeFrame();
    }
    constructor(
        injector: Injector,
        public _sanitizer: DomSanitizer,
        public renderer: Renderer2,
        public iframeService: IframeService,
        public spinner: NgxSpinnerService,
        public _smtAPI: SiteMarketingToolsApiClientFacade
    ) {
        super(injector, _sanitizer, renderer, iframeService, spinner);
    }


    ngOnInit(): void {
        this.loadPagePreview(
            () => this._smtAPI.getMarketingTool(this.pageId)
        );
    }
}

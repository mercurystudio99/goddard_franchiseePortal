import {
    Component,
    Injector,
    Input,
    Output,
    OnInit,
    ElementRef,
    ViewChild,
    Renderer2,
    EventEmitter,
    OnDestroy,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SiteEditorServiceProxy } from '@shared/service-proxies/service-proxies';
import { IframeService } from '../../shared/common/services/iframe-service';
import { NgxSpinnerService } from 'ngx-spinner';
import { v4 as uuidv4 } from 'uuid';
import { finalize } from 'rxjs/operators';
import { GoddardPagePreviewComponent } from '@app/shared/common/goddard-page-preview/goddard-page-preview.component';

@Component({
    selector: 'app-page-preview',
    templateUrl: '../../shared/common/goddard-page-preview/goddard-page-preview.component.html',
    styleUrls: ['../../shared/common/goddard-page-preview/goddard-page-preview.component.css'],
})
export class PagePreviewComponent extends GoddardPagePreviewComponent implements OnInit, OnDestroy {
    @Input() pageId: string;
    @Input() editorTriggers;
    @Output() iframeIsResized = new EventEmitter<boolean>();
    @ViewChild('iframe', { static: false }) iframe: ElementRef;
    data: SafeHtml;
    frameContent;
    frameCurrentHeight: number;
    isIframeLoaded = false;
    pollingInterval = 1; // polling interval in seconds

    constructor(
        injector: Injector,
        private _siteEditorServiceProxy: SiteEditorServiceProxy,
        public _sanitizer: DomSanitizer,
        public renderer: Renderer2,
        public iframeService: IframeService,
        public spinner: NgxSpinnerService
    ) {
        super(injector, _sanitizer, renderer, iframeService, spinner);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        this.loadSchoolSitePage();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    /**
     * (Re)loads school site page
     */
    loadSchoolSitePage(): void {
        this.loadPagePreview(
            () =>
                this._siteEditorServiceProxy
                    .getSchoolSitePage(this.appSession.school.crmId, this.pageId, uuidv4())
        );
    }
}

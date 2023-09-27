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
import { AppComponentBase } from '@shared/common/app-component-base';
import { NgxSpinnerService } from 'ngx-spinner';
import { v4 as uuidv4 } from 'uuid';
import { finalize } from 'rxjs/operators';
import { IframeService } from '../services/iframe-service';
import { Observable } from 'rxjs';
import { GetSitePageOutput } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'goddard-page-preview',
    templateUrl: './goddard-page-preview.component.html',
    styleUrls: ['./goddard-page-preview.component.css'],
})
export class GoddardPagePreviewComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Input() pageId: string;
    @Input() editorTriggers;
    @Input() disableAnchors: boolean = true;
    @Output() iframeIsResized = new EventEmitter<boolean>();
    @ViewChild('iframe', { static: false }) iframe: ElementRef;
    data: SafeHtml | undefined = undefined;
    frameContent;
    frameCurrentHeight: number;
    isIframeLoaded = false;
    pollingInterval = 1; // polling interval in seconds

    /**
     * Tracking field to determine when a data load request has completed
     */
    private isSrcDocDataLoading = false;

    constructor(
        injector: Injector,
        public _sanitizer: DomSanitizer,
        public renderer: Renderer2,
        public iframeService: IframeService,
        public spinner: NgxSpinnerService
    ) {
        super(injector);
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    loadPagePreview(getPageObservable: () => Observable<GetSitePageOutput>): void {

        this.isSrcDocDataLoading = true;

        // Showing "content" spinner instead of main spinner so that users can still navigate
        // while iframe is loading.  Otherwise the entire browser window is blocked.
        this.spinner.show('content');
        this.addSubscription(
            getPageObservable()
                .subscribe(
                    (result) => this.onSuccessLoadingPage(result),
                    () => this.spinner.hide('content')));
    }

    /**
     * iframe load event handler
     */
    onLoad(): void {
        this.resizeFrame();

        if (!this.isSrcDocDataLoading) {
            // load event gets triggered many times by <iframe> but we only want to hide
            // the content spinner when the load event is triggered _after_ the [srcdoc]="data"
            // field has finished [re]loading
            this.spinner.hide('content');
        }

    }

    // Will poll the page at the polling interval and check to see if our frame has been loaded
    runIsFrameLoadedTimer() {
        this.iframeService.runIsFrameLoadedTimer(this.iframe, () => {
            this.resizeFrame();
        });
    }

    resizeFrame() {
        if (this.iframeService.resizeFrame(this.iframe, this.renderer, this.disableAnchors)) {
            this.iframeIsResized.emit(true);
            this.removeContent();
            if (!this.disableAnchors) {
                this.iframeService.modifyInternalAnchors(this.iframe, this.renderer);
            }
        }
    }

    removeContent() {
        //remove common content
        this.iframeService.removeContent(this.iframe, this.renderer);

        //remove content from school's home page
        const content: Element = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;

        // Adjust Body paging
        const body: Element =
            content.querySelectorAll('.school-home-page')[0] || content.querySelectorAll('.school-content-page')[0];
        body?.classList.add('pt-0');
    }

    getEditingItemInfo(identifer: string) {
        const content = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
        let elements = content.querySelectorAll(identifer);
        return elements;
    }

    private onSuccessLoadingPage(result: GetSitePageOutput): void {
        if (!result || !result.pageHTML) {
            this.isSrcDocDataLoading = false;
            return;
        }
        this.data = this._sanitizer.bypassSecurityTrustHtml(result.pageHTML);
        this.isSrcDocDataLoading = false;
        this.iframeService.setCurrentIframe(this.iframe);

        // 20220429RBP - FIX: Moved this call from ngOnInit to here
        // to fix issue when we are reloading the iframe srcDoc
        // because the load event doesn't seem to fire on srcDoc changes
        this.runIsFrameLoadedTimer();
    }
}

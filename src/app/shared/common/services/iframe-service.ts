import { Injectable, ElementRef, Renderer2 } from '@angular/core';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class IframeService {
    constructor(private _appUrlService: AppUrlService, private router: Router) {}

    public subject = new Subject<ElementRef>();
    currentIframe = this.subject.asObservable();

    setCurrentIframe(message: ElementRef) {
        this.subject.next(message);
    }

    getEditingItemInfo(iframe: ElementRef, identifier: string) {
        if (!iframe) {
            return undefined;
        }
        var content = iframe.nativeElement.contentDocument || iframe.nativeElement.contentWindow;
        let elements = content.querySelectorAll(identifier);
        return elements;
    }

    getAttributeValue(content: any, identifer: string) {
        return content.getAttribute(identifer);
    }

    isFrameLoaded(iframe: ElementRef): boolean {
        if (!iframe) {
            return false;
        } else {
            let response = true;
            let content = iframe.nativeElement.contentDocument || iframe.nativeElement.contentWindow;
            let contentMedia = content?.querySelectorAll('body')[0]?.querySelectorAll('img');
            contentMedia.forEach((element) => {
                if (element.complete == false || element.naturalHeight == 0) {
                    response = false;
                }
            });
            return response;
        }
    }

    disablePreviewAnchors(iframe: ElementRef, renderer: Renderer2) {
        let content = iframe.nativeElement.contentDocument || iframe.nativeElement.contentWindow;
        let elements = content.querySelectorAll('a[href]');
        elements.forEach((element) => {
            renderer.setStyle(element, 'pointer-events', 'none');
        });
    }

    resizeFrame(iframe: ElementRef, renderer: Renderer2, disablePreviewAnchors: boolean = true): boolean {
        const nativeElement = iframe?.nativeElement;
        if (!nativeElement) {
            return false;
        }

        let content = nativeElement?.contentDocument || nativeElement?.contentWindow;
        if (!content) {
            return false;
        }

        renderer.setStyle(nativeElement, 'height', content.body.scrollHeight + 'px');
        if (disablePreviewAnchors) {
            this.disablePreviewAnchors(iframe, renderer);
        }
        this.removeContent(iframe, renderer);

        return true;
    }

    removeContent(iframe: ElementRef, renderer: Renderer2) {
        const content: Element = iframe.nativeElement.contentDocument || iframe.nativeElement.contentWindow;
        // Remove content with class gsi-hide-in-fbp
        // See Bug 16359
        const contentToHide: NodeListOf<Element> = content.querySelectorAll(
            '.gsi-hide-in-fbp,#acs-commons-env-indicator'
        );
        if (contentToHide && contentToHide.length) {
            contentToHide.forEach((element) => {
                renderer.setAttribute(element, 'style', 'display:none!important');
            });
        }
    }

    // Will poll the page at the polling interval and check to see if our frame has been loaded
    runIsFrameLoadedTimer(iframe: ElementRef, callback: () => void, pollingInterval: number = 1) {
        setTimeout(() => {
            if (this.isFrameLoaded(iframe)) {
                this.setCurrentIframe(iframe);
                callback();
            } else {
                this.runIsFrameLoadedTimer(iframe, callback, pollingInterval);
            }
        }, pollingInterval * 1000);
    }

    modifyInternalAnchors(iframe: ElementRef, renderer: Renderer2) {
        let content = iframe.nativeElement.contentDocument || iframe.nativeElement.contentWindow;
        let elements = content.querySelectorAll('a[href]');

        elements.forEach((element) => {
            const href = element.href;
            if (this._appUrlService.isInternalURL(href)) {
                let relativePath = this._appUrlService.getRelativePathFromURL(href);
                renderer.listen(element, 'click', (event) => {
                    event.preventDefault();
                    this.router.navigate([relativePath]);
                });
            }
        });
    }
}

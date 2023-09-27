import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

/**
 * credits: https://netbasal.com/create-reusable-copy-to-clipboard-directive-in-angular-fc1139b9e755
 */
@Directive({
    selector: '[copy]',
})
export class CopyDirective implements OnInit, OnDestroy {
    @Input() copy: string;
    subscription: Subscription;

    constructor(private _element: ElementRef) {}

    ngOnInit() {
        this.subscription = fromEvent(this._element.nativeElement, 'click')
            .pipe(
                switchMap(() => navigator.clipboard.writeText(this.copy)),
                finalize(() => {})
            )
            .subscribe(() => console.log('copy', this.copy));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

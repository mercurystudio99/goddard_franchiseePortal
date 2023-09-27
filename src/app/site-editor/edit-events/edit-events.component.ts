import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SiteEditorService } from '../services';
import { PostEvents } from '@shared/service-proxies/service-proxies';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'edit-events',
    templateUrl: './edit-events.component.html',
    styleUrls: ['./edit-events.component.css'],
    animations: [appModuleAnimation()],
})
export class EditEventsComponent extends AppComponentBase implements OnInit, OnDestroy {
    private routerSub: Subscription;
    public isCalendarView: boolean;
    public isTemplateView: boolean;

    constructor(
        injector: Injector,
        private _router: Router,
        private _siteEditorService: SiteEditorService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.routerSub = this._router.events
            .pipe(
                // Filter router events for completed navigation
                filter((event) => event instanceof NavigationEnd),
                // First event will already be complete
                // when this component inits, use initial
                // router state to start with
                startWith(this._router)
            )
            .subscribe((event: RouterEvent) => {
                // Get last url segment
                // It will be either 'calendar' or 'templates'
                const segments = event.url.toLowerCase().split('/');
                const lastSegment = segments[segments.length - 1];
                this.isCalendarView = lastSegment === 'calendar';
                this.isTemplateView = lastSegment === 'templates';
            });
    }

    ngOnDestroy(): void {
        this.routerSub.unsubscribe();
    }

    public addNewCalendarEvent(): void {
        const defaultEvent = this._siteEditorService.defaultCalendarEvent();
        this._siteEditorService.setCurrentEventCalendar(defaultEvent);
    }

    public addNewEventTemplate(): void {
        const defaultTemplate = this._siteEditorService.defaultEventTemplate();
        this._siteEditorService.setCurrentEventTemplate(defaultTemplate);
    }
}

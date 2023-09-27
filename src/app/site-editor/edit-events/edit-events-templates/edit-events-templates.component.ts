import { EventTemplate } from '@app/shared/common/apis/generated/school-events';
import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { catchError, finalize } from 'rxjs/operators';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { Angulartics2 } from 'angulartics2';
import { SiteEditorConstants } from '../../site-editor.constants';
import { combineLatest, of, throwError } from 'rxjs';
import { SiteEditorService } from '../../services';
import { OriginalAsset } from '@app/shared/common/apis/generated/content/model/originalAsset';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { EventTemplatesApiClientFacade } from '@shared/service-proxies/event-templates-api-client-facade';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
@Component({
    selector: 'edit-events-templates',
    templateUrl: './edit-events-templates.component.html',
    styleUrls: ['./edit-events-templates.component.css'],
    animations: [appModuleAnimation()],
})
export class EditEventsTemplatesComponent extends AppComponentBase implements OnInit {
    maxDescriptionLength: 100; //Limit for showing description
    _eventTemplates: EventTemplate[] = [];
    renditions: OriginalAsset[];

    constructor(
        injector: Injector,
        private _eventTemplatesService: EventTemplatesApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _contentApiClientFacade: ContentApiClientFacade,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.getEventTemplates();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    getEventTemplates() {
        this.spinnerService.show('content');
        this.addSubscription(
            combineLatest([
                this._eventTemplatesService.getEventTemplates(+this.appSession.school.fmsId),
                this._contentApiClientFacade
                    .getImages(SiteEditorConstants.calendarEventsIconsPath)
                    .pipe(catchError((err) => this.handleGetImagesError(err))),
            ])
                .pipe(finalize(() => this.spinnerService.hide('content')))
                .subscribe(
                    ([eventTemplates, icons]) => {
                        this._eventTemplates = eventTemplates;
                        this.setupIcons(icons);
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }

    private setupIcons(icons: OriginalAsset[]) {
        this._siteEditorService.setCurrentAssets(icons);
        this.renditions = this._siteEditorService.filterRenditions(
            icons,
            SiteEditorConstants.eventsCalendarIconsSizes,
            'png'
        );
        this.renditions = this.renditions.map((rendition) => ({
            ...rendition,
            type: icons.find((x) => rendition.contentPath.includes(x.contentPath))?.name,
            title: icons
                .find((x) => rendition.contentPath.includes(x.contentPath))
                ?.name.split('.')
                .slice(0, -1)
                .join('.'),
        }));
    }

    findIconUrlByName(iconName: string | undefined): string | undefined {
        return iconName ? this.renditions?.find((x) => x.href === iconName)?.publishUrl : '';
    }

    openModal(id: number | undefined) {
        if (id) {
            this._siteEditorService.setCurrentEventTemplate(this._eventTemplates.find((x) => x.id === id));
            return;
        }
        const defaultTemplate = this._siteEditorService.defaultEventTemplate();
        this._siteEditorService.setCurrentEventTemplate(defaultTemplate);
    }

    onDelete(id: number): void {
        let eventTemplate = { ...this._eventTemplates.find((x) => x.id === id) };

        //Confirm to delete event template
        abp.message.confirm(
            this.l('EventTemplateDeleteWarningMessage', `: ${eventTemplate.name}`),
            this.l('AreyouSure'),
            (result: boolean) => {
                if (result) {
                    this.delete(eventTemplate);
                }
            }
        );
    }

    delete(eventTemplate: EventTemplate): void {
        this.spinnerService.show('content');

        this._eventTemplatesService
            .deleteEventTemplate(this.appSession.school.crmId, eventTemplate.id)
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (response) => {
                    this.onSuccessSavingEventTemplate('Events Templates Delete');
                },
                (error) => {
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                }
            );
    }

    onSaveEventTemplate(event: EventTemplate): void {
        this.onSuccessSavingEventTemplate('Events Templates Publish');
    }

    onSuccessSavingEventTemplate(analyticsMessage: string): void {
        // analytics
        this._angulartics2.eventTrack.next({
            action: analyticsMessage,
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this._appSessionService.school?.advertisingName,
            },
        });

        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.getEventTemplates();
        });
    }

    private handleGetImagesError(err: any) {
        if (err.status === 404) {
            return of(new Array<OriginalAsset>());
        }
        return throwError(err);
    }
}

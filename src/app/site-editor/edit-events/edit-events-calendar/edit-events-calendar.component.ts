import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CalendarApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Calendar, CalendarOptions, DayCellContentArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { SchoolEventsApiClientFacade } from '@shared/service-proxies/school-events-api-client-facade';
import { SiteEditorService } from '../../services';
import { finalize } from 'rxjs/operators';
import { EditEventModalComponent } from './edit-event-modal/edit-event-modal.component';
import { EventTemplate, PostEvents } from '@shared/service-proxies/service-proxies';
import { Events } from '@app/shared/common/apis/generated/school-events';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { SiteEditorConstants } from '../../site-editor.constants';
import { OriginalAsset } from '@app/shared/common/apis/generated/content';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { DateClickArg } from '@fullcalendar/interaction';
import { GoddardConfirmationModalComponent, ModalType } from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'app-events-calendar',
    templateUrl: './edit-events-calendar.component.html',
    styleUrls: ['./edit-events-calendar.component.css'],
    animations: [appModuleAnimation()],
})
export class EditEventsCalendarComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('EventModal', { static: true }) modal: EditEventModalComponent;
    @ViewChild('calendar') calendarComponent: FullCalendarComponent;
    @ViewChild('deleteEventSeriesModal', { static: true }) deleteEventSeriesModal: GoddardConfirmationModalComponent;
    @ViewChild('removeEventConfirmModal', { static: true }) private removeEventConfirmModal: GoddardConfirmationModalComponent;

    calendarApi: CalendarApi;
    /**
     * 20220520: https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/15212/
     * use UTC to render event on the correct spot day calendar
     */
    GsiCalendarOptions: CalendarOptions = {
        timeZone: 'UTC',
        selectable: true,
        plugins: [dayGridPlugin, interactionPlugin],
        //weekends: false,
        views: {
            month: {
                columnHeaderFormat: 'dddd',
            },
        },
        headerToolbar: {
            start: '', // will normally be on the left. if RTL, will be on the right
            center: 'prev,title,next',
            end: '', // will normally be on the right. if RTL, will be on the left
        },
        titleFormat: { year: 'numeric', month: 'long' },
        customButtons: {
            next: {
                click: this.nextMonth.bind(this),
            },
            prev: {
                click: this.prevMonth.bind(this),
            },
        },
        dateClick: (info)=> {
            this.openModal(undefined, info.date);
        },
        dayCellClassNames: this.dayCellClasses.bind(this),
        height: 'auto'
    };
    events: Events[];
    renditions: OriginalAsset[] = [];
    firstDayOnCalendar: Date;
    deleteClass = 'gsi-event_delete';
    modalType = ModalType;
    daysToCompleteCalendar = 15; //days before and after the selected
    selectedEventId: number;
    isLoad: boolean = false;
    title: String = null;

    constructor(
        injector: Injector,
        private _schoolEventsClientFacade: SchoolEventsApiClientFacade,
        private _contentApiClientFacade: ContentApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        let currentDate = new Date();
        this.firstDayOnCalendar = this.addDays(
            new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            -this.daysToCompleteCalendar
        );
        this.getIconsAndEvents();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    getIconsAndEvents(): void {
        this.spinnerService.show('content');
        this.addSubscription(
            this._contentApiClientFacade
                .getImages(SiteEditorConstants.calendarEventsIconsPath)
                .pipe(
                    finalize(() => {
                        this.getEvents(
                            this.firstDayOnCalendar.toLocaleDateString('en-US'),
                            this.lastDayOnCalendar(this.firstDayOnCalendar).toLocaleDateString('en-US')
                        );
                    })
                )
                .subscribe(
                    (icons) => {
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
                    },
                    (error) => {
                        abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                    }
                )
        );
    }

    getEvents(startDate?: string, endDate?: string) {
        this.spinnerService.show('content');
        this._schoolEventsClientFacade
            .getEvents(this.appSession.school.fmsId, startDate, endDate)
            .pipe(finalize(() => {
                this.isLoad = true;
                this.spinnerService.hide('content');
            }))
            .subscribe(
                (events) => {
                    this.events = events;
                    this.setupEvents();
                    this.setupEventContent();
                },
                (error) => {
                    abp.message.error(this.l('AnErrorOccurred'), this.l('Error'));
                }
            );
    }

    private setupEvents() {
        this.GsiCalendarOptions.events = this.events.map((event) => ({
            ...event,
            id: event.id.toString(),
            start: event.startDateTime,
            end: event.endDateTime,
        }));

        this.GsiCalendarOptions.eventClick = (info): void => {
            info.jsEvent.preventDefault();

            let target = info.jsEvent.target as any;

            this.selectedEventId = Number(info.event.id);

            if (target?.classList?.contains(this.deleteClass)) {
                this.onDeleteEvent();
            } else {
                this.openModal(Number(info.event.id));
            }
        };
    }

    private setupEventContent() {
        this.GsiCalendarOptions.eventContent = (eventInfo, createElement) => {
            let eventName = eventInfo.event.title;
            let eventIconUrl = this.getIconImageUrl(eventInfo.event.extendedProps?.iconFileName);
            let startDateTime = new Date(eventInfo.event.start);
            let eventStartHour = this.getTime(startDateTime);
            startDateTime = this._dateTimeService.convertUTCToLocalDate(startDateTime);
            var today = new Date();

            //Allow to delete event if ending time is future
            let deleteOption =
                startDateTime.getTime() > today.getTime()
                    ? `<span class="d-inline-block position-absolute  ${this.deleteClass}">
                            &#x2715;
                        </span>`
                    : ``;

            return (createElement = {
                html:
                    `<div class="gsi-cal-event">
                        <img class="gsi-cal-event-img img-fluid" src="${eventIconUrl}" />
                        <div>
                            <div class="gsi-cal-event-title">${eventStartHour}</div>
                            <div>${eventName}</div>
                            ${deleteOption}
                        </div>
                    </div>`,
            });
        };
    }

    private getTime(date: Date): string {
        var hours = date.getUTCHours();
        var minutes = date.getUTCMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? 0 + minutes : minutes;
        //Show two digits
        return (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ampm;
    }

    openModal(id: number = null, startDate: Date = null) {
        if (id) {
            this._siteEditorService.setCurrentEventCalendar(PostEvents.fromJS(this.events.find((x) => x.id === id)));
            return;
        }
        const defaultEvent = this._siteEditorService.defaultCalendarEvent();
        this._siteEditorService.setCurrentEventCalendar(defaultEvent);
    }

    getIconImageUrl(iconFileName: string): string | undefined {
        return this.renditions?.find((x) => x.contentPath.includes(iconFileName))?.publishUrl;
    }

    /**
     * returns the last day of the current month plus this.daysToCompleteCalendar days
     * @param selectedDate
     * @returns
     */
    private lastDayOnCalendar(selectedDate: Date): Date {
        return this.addDays(
            new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0),
            this.daysToCompleteCalendar
        );
    }

    prevMonth(): void {
        this.calendarApi = this.calendarComponent.getApi();
        this.calendarApi.prev();
        this.firstDayOnCalendar = this.addDays(this.calendarApi.getDate(), -this.daysToCompleteCalendar);
        this.getEvents(
            this.firstDayOnCalendar.toLocaleDateString('en-US'),
            this.lastDayOnCalendar(this.firstDayOnCalendar).toLocaleDateString('en-US')
        );
    }

    nextMonth(): void {
        this.calendarApi = this.calendarComponent.getApi();
        this.calendarApi.next();
        this.firstDayOnCalendar = this.addDays(this.calendarApi.getDate(), -this.daysToCompleteCalendar);
        this.getEvents(
            this.firstDayOnCalendar.toLocaleDateString('en-US'),
            this.lastDayOnCalendar(this.firstDayOnCalendar).toLocaleDateString('en-US')
        );
    }

    onSaveEvent(event: Events): void {
        this.onSuccessSavingChanges('Events Publish');
    }

    onDeleteEvent(): void {
        let eventCalendar = PostEvents.fromJS({ ...this.events.find((x) => x.id === this.selectedEventId) });

        //show modal to delete event series
        if (eventCalendar.seriesID) {
            this.deleteEventSeriesModal.show();
        } else {
            this.title = eventCalendar.title;
            this.removeEventConfirmModal.show();
        }
    }

    /**
     * to delete an event:
            ->> ActiveFlag is false
            ->> Id is not null and SeriesId is null, then that particular record will be deleted
            ->> Id is null and SeriesId is not null, then data will get deleted for all the current and future events which are part of that series.
     * @param deleteSeries : flag to delete individual event or event series
     */
    delete(deleteSeries: boolean = false): void {
        let eventCalendar = PostEvents.fromJS({ ...this.events.find((x) => x.id === this.selectedEventId) });
        eventCalendar.activeFlag = false; //flag to delete event

        if (eventCalendar.seriesID) {
            if (deleteSeries) {
                //set id to null for deleting the entire event series
                eventCalendar.id = null;
            } else {
                //set seriesID to null for deleting single event
                eventCalendar.seriesID = null;
            }
        }

        this.spinnerService.show('content');
        this._schoolEventsClientFacade
            .saveEvent(eventCalendar)
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (response) => {
                    this.deleteEventSeriesModal.hide();
                    this.onSuccessSavingChanges('Events Delete');
                },
                (error) => {
                    abp.message.error(this.l('ErrorSavingData'), this.l('Error'));
                }
            );
    }

    closeDeleteModal() {
        this.deleteEventSeriesModal.hide();
    }

    addDays(date: Date, days: number) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    onSaveEventTemplate(eventTemplate: EventTemplate): void {
        this.onSuccessSavingChanges('Events Templates Publish');
    }

    onSuccessSavingChanges(analyticsMessage: string): void {
        // analytics
        this._angulartics2.eventTrack.next({
            action: analyticsMessage,
            properties: {
                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                label: this._appSessionService.school?.advertisingName,
            },
        });

        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.getEvents(
                this.firstDayOnCalendar.toLocaleDateString('en-US'),
                this.lastDayOnCalendar(this.firstDayOnCalendar).toLocaleDateString('en-US')
            );
        });
    }

    dayCellClasses(info:DayCellContentArg){
        if(!info.isPast){
            let dayClases = 'gsi-selectable-day';
            return dayClases;
        }
    }

    reject(event: string) {
        event == 'close'? this.closeDeleteModal() : this.delete(false);
    }

    /**
     * Remove event accepted
     */
    eventRemoveAccepted(): void {
        this.delete();
        this.title = null;
        this.removeEventConfirmModal.hide();
    }

    /**
     * Remove event rejected
     */
    eventRemoveRejected(): void {
        this.title = null;
        this.removeEventConfirmModal.hide();
    }
}



import { EventsService } from './../../app/shared/common/apis/generated/school-events/api/events.service';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Events } from '@app/shared/common/apis/generated/school-events';
import { EventsEditorServiceServiceProxy, PostEvents } from './service-proxies';

@Injectable({
    providedIn: 'root',
})
export class SchoolEventsApiClientFacade {
    constructor(private _eventsService: EventsService, private _eventsEditorService: EventsEditorServiceServiceProxy) {}

    public getEvents(fmsSchoolId?: string, startDate?: string, endDate?: string): Observable<Array<Events>> {
        return this._eventsService.apiV1EventsGet(fmsSchoolId, startDate, endDate).pipe(
            //tap((resp) => console.log('[EVENTS]: ' + JSON.stringify(resp))),
            catchError(this.handleError)
        );
    }

    saveEvent(body: PostEvents | undefined): Observable<PostEvents> {
        return this._eventsEditorService.saveEvent(body).pipe(catchError(this.handleError));
    }

    private handleError(err: any) {
        console.error('[ERROR]: ' + JSON.stringify(err));
        return throwError(err);
    }
}

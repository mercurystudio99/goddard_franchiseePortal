import { EventTemplatesEditorServiceServiceProxy, PostEventTemplate } from './service-proxies';
import { EventTemplatesService } from '../../app/shared/common/apis/generated/school-events/api/eventTemplates.service';
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { EventTemplate } from '@app/shared/common/apis/generated/school-events';

@Injectable({
    providedIn: 'root',
})
export class EventTemplatesApiClientFacade {
    constructor(
        private _eventTemplatesService: EventTemplatesService,
        private _eventTemplatesEditorService: EventTemplatesEditorServiceServiceProxy
    ) {}

    public getEventTemplates(fmsSchoolId?: number): Observable<Array<EventTemplate>> {
        return this._eventTemplatesService.apiV1EventTemplatesGet(fmsSchoolId).pipe(catchError(this.handleError));
    }

    createEventTemplate(body: PostEventTemplate): Observable<EventTemplate> {
        return this._eventTemplatesEditorService.createEventTemplate(body);
    }

    updateEventTemplate(templateId: number, body: PostEventTemplate): Observable<EventTemplate> {
        return this._eventTemplatesEditorService.updateEventTemplate(templateId, body);
    }

    saveEventTemplate(body: PostEventTemplate): Observable<EventTemplate> {
        if (body.id) {
            return this.updateEventTemplate(body.id, body);
        }
        return this.createEventTemplate(body);
    }

    deleteEventTemplate(crmId: string, templateId: number): Observable<void> {
        return this._eventTemplatesEditorService.deleteEventTemplate(crmId, templateId);
    }

    private handleError(err: any) {
        console.error('[ERROR]: ' + JSON.stringify(err));
        return throwError(err);
    }
}

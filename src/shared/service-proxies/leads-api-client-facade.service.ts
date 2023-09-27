import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import {
    LeadDto,
    LeadsEditorServiceServiceProxy,
    ApiV1SchoolLeadsInternalPostRequest,
    LeadFindDto
} from './service-proxies';

@Injectable({ providedIn: 'root' })
export class LeadsApiClientFacade {
    constructor(private _leadsEditorServiceProxy: LeadsEditorServiceServiceProxy) {}

    public findLeads(
        q: string | undefined,
        schoolId: string,
        leadName?: string | undefined,
        childAge?: number | undefined,
        startDate?: DateTime | undefined,
        endDate?: DateTime | undefined,
        programsOfInterest?: string[] | undefined,
        page?: number | undefined,
        pageSize?: number | undefined
    ): Observable<LeadFindDto[]> {
        return this._leadsEditorServiceProxy.find(
            q,
            schoolId,
            leadName,
            childAge,
            startDate,
            endDate,
            programsOfInterest,
            page,
            pageSize
        );
    }

    public getLead(crmId: string, id: string): Observable<LeadDto> {
        return this._leadsEditorServiceProxy.findLeadById(crmId, id);
    }

    public createLead(body: ApiV1SchoolLeadsInternalPostRequest, async: boolean = true): Observable<LeadDto> {
        return this._leadsEditorServiceProxy.createLead(async, body);
    }
}

import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { AppTourSettingsDto, TourSettingsEditorServiceServiceProxy, TourSettingsInputDto, AvailabilityDto, DateAvailabilityDto, SaveOnlineTourSettingsInput, DateAvailabilityInputDto } from './service-proxies';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { cloneDeep } from 'lodash'
/**
 * API client facade for tour availability and settings management
 */
@Injectable({ providedIn: 'root' })
export class ToursSettingsApiClientFacade {

    constructor(private _proxy: TourSettingsEditorServiceServiceProxy) { }

    getAvailability(schoolId: string): Observable<AvailabilityDto> {
        return this._proxy.getAvailability(schoolId);
    }

    getDateAvailability(schoolId: string, date: DateTime): Observable<DateAvailabilityDto> {
        return this._proxy.getDateAvailability(schoolId, DateTimeService._toUtcDate(date));
    }

    getDefaultAvailability(schoolId: string, tourDuration: number): Observable<AvailabilityDto> {
        return this._proxy.getDefaultAvailability(schoolId, tourDuration);
    }

    resetToDefaults(schoolId: string): Observable<void> {
        return this._proxy.resetToDefaults(schoolId);
    }

    saveAvailability(schoolId: string, body: AvailabilityDto): Observable<void> {
        body = cloneDeep(body);
        body.blocks.forEach(x => {
            // Change these time only fields in browser local time to UTC keeping time.
            // If we don't do this, assuming browser is in PST(-7) 11:00AM would get sent
            // over as '2023-09-18T18:00:00.000+00:00' and the API would lose the time intended
            x.endTime = DateTimeService._toUtcKeepTime(x.endTime);
            x.startTime = DateTimeService._toUtcKeepTime(x.startTime);
        });
        return this._proxy.saveAvailability(schoolId, body);
    }

    saveDateAvailability(schoolId: string, date: DateTime, body: DateAvailabilityInputDto): Observable<void> {
        body = cloneDeep(body);

        // Ensure we're working with UTC to avoid issues of
        // of date changing during serialization
        date = DateTimeService._toUtcDate(date);

        body.blocks.forEach(x => {
            // Change these time only fields from browser local time to UTC
            // so that when serialized by _proxy the time isn't altered
            x.endTime = DateTimeService._toUtcKeepTime(x.endTime);
            x.startTime = DateTimeService._toUtcKeepTime(x.startTime);
        });

        return this._proxy.saveDateAvailability(schoolId, date, body);
    }

    saveTourSettings(schoolId: string, body: TourSettingsInputDto): Observable<void> {
        return this._proxy.saveTourSettings(schoolId, body);
    }

    getTourSettings(schoolId: string): Observable<AppTourSettingsDto> {
        return this._proxy.getTourSettings(schoolId);
    }

    saveOnlineTourSettings(schoolId: string, body: SaveOnlineTourSettingsInput): Observable<void> {
        return this._proxy.saveOnlineTourSettings(schoolId, body);
    }

}

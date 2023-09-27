import { TourItemDto, TourType } from '@shared/service-proxies/service-proxies';
import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import {
    CreateTourInput,
    PagedResultDtoOfTourItemDto,
    ScheduleDto,
    TourGuideDto,
    ToursEditorServiceServiceProxy,
    TourStatus,
    UpdateTourInput,
} from './service-proxies';
import { ToursEditorConstants } from '@app/tours-editor/tours-editor-constants';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { tap } from 'rxjs/operators';
import { cloneDeep } from 'lodash';

/**
 * Tours API client facade for interacting with tours
 */
@Injectable({ providedIn: 'root' })
export class ToursApiClientFacade {
    constructor(
        private _toursEditorServiceProxy: ToursEditorServiceServiceProxy,
        private _dateTimeService: DateTimeService
    ) {}

    public getTours(
        schoolId: string,
        statuses: TourStatus[] | undefined,
        startDateTime?: DateTime | undefined,
        endDateTime?: DateTime | undefined,
        types?: TourType[] | undefined,
        guideNames?: string[] | undefined,
        leadName?: string | undefined,
        childAge?: number | undefined,
        leadStartDate?: DateTime | undefined,
        leadEndDate?: DateTime | undefined,
        programsOfInterest?: string[] | undefined,
        page: number | undefined = 1,
        pageSize: number | undefined = 10,
        sorting: string | undefined = ToursEditorConstants.DEFAULT_SORTING_SCHEDULED_TOURS
    ): Observable<PagedResultDtoOfTourItemDto> {
        if (startDateTime != null) {
            // Convert browser time to school's time to preserve the time intended
            startDateTime = this._dateTimeService.toSchoolTimeZoneKeepTime(startDateTime);
        }

        if (endDateTime != null) {
            // Convert from browser time to school's time to preserve the time intended
            endDateTime = this._dateTimeService.toSchoolTimeZoneKeepTime(endDateTime);
        }

        if (leadStartDate != null) {
            // Date-only values need to be in UTC
            leadStartDate = this._dateTimeService.toUtcDate(leadStartDate);
        }

        if (leadEndDate != null) {
            // Date-only values need to be in UTC
            leadEndDate = this._dateTimeService.toUtcDate(leadEndDate);
        }

        return this._toursEditorServiceProxy
            .findTours(
                schoolId,
                statuses,
                startDateTime,
                endDateTime,
                types,
                guideNames,
                leadName,
                childAge,
                leadStartDate,
                leadEndDate,
                programsOfInterest,
                page,
                pageSize,
                sorting,
                '' // sort: read-only property, not used
            )
            .pipe(
                tap((result) => {
                    result.items.forEach((item) => {
                        // Adjust times for local browser timezone
                        this.updateTourTimesForLocal(item);
                    });
                })
            );
    }

    public getTour(schoolId: string | undefined, id: string | undefined): Observable<TourItemDto> {
        return this._toursEditorServiceProxy.getTour(schoolId, id).pipe(
            tap((result) => {
                // Adjust times for local browser timezone
                this.updateTourTimesForLocal(result);
            })
        );
    }

    public getSchoolGuides(crmId: string | undefined): Observable<TourGuideDto[]> {
        return this._toursEditorServiceProxy.getSchoolGuides(crmId);
    }

    createTour(crmId: string, body: CreateTourInput | undefined): Observable<void> {
        if (body != null) {
            body = cloneDeep(body);
            body.schoolId = crmId;
            // Convert from browser local zone to school timezone preserving time
            body.startDateTime = this._dateTimeService.toSchoolTimeZoneKeepTime(body.startDateTime);
            body.endDateTime = this._dateTimeService.toSchoolTimeZoneKeepTime(body.endDateTime);
        }
        return this._toursEditorServiceProxy.createTour(body);
    }

    updateTour(tourId: string, body: UpdateTourInput): Observable<void> {
        if (body != null) {
            body = cloneDeep(body);

            // Convert from browser local zone to school timezone preserving time
            body.startDateTime = this._dateTimeService.toSchoolTimeZoneKeepTime(body.startDateTime);
            body.endDateTime = this._dateTimeService.toSchoolTimeZoneKeepTime(body.endDateTime);
        }
        return this._toursEditorServiceProxy.updateTour(tourId, body);
    }

    getSchedules(schoolId: string, startDate: DateTime, endDate: DateTime): Observable<ScheduleDto[]> {
        return this._toursEditorServiceProxy
            .getSchedules(schoolId, DateTimeService._toUtcDate(startDate), DateTimeService._toUtcDate(endDate))
            .pipe(
                tap((res) => {
                    res.forEach((schedule) => {
                        // NOTE: Don't need to do anything with `schedule.date` because the API sends it with unspecified
                        // timezone (ex. "2023-09-01T00:00:00").  This just gets deserialized as start of day
                        // in local browser time which is what we want.

                        // Convert schedule.[start|end]DateTime to browser local zone preserving time
                        // so times display in school's timezone
                        schedule.items.forEach((item) => {
                            item.endDateTime = this._dateTimeService.fromSchoolTimeZoneToLocalKeepTime(
                                item.endDateTime
                            );
                            item.startDateTime = this._dateTimeService.fromSchoolTimeZoneToLocalKeepTime(
                                item.startDateTime
                            );
                        });
                    });
                })
            );
    }

    /**
     * Updates times for local display
     * @param dto
     */
    private updateTourTimesForLocal(dto: TourItemDto) {
        dto.endDateTime = this._dateTimeService.fromSchoolTimeZoneToLocalKeepTime(dto.endDateTime);
        dto.startDateTime = this._dateTimeService.fromSchoolTimeZoneToLocalKeepTime(dto.startDateTime);
    }
}

import { FeaturesEditorServiceServiceProxy } from './service-proxies';
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Feature, SchoolFeature, FeatureInterestOption, FeaturesService } from '@app/shared/common/apis/generated/features';

@Injectable({
    providedIn: 'root',
})
export class FeaturesApiClientFacade {
    constructor(
        private _featuresService: FeaturesService,
        private _featuresEditorServiceProxy: FeaturesEditorServiceServiceProxy
    ) {}

    public getAllFeatures(): Observable<Array<Feature>> {
        return this._featuresService.apiV1FeaturesGet();
    }

    public getSchoolFeatures(crmSchoolIds?: Array<string>, features?: Array<string>): Observable<Array<SchoolFeature>> {
        return this._featuresService.apiV1SchoolFeaturesGet(crmSchoolIds, features);
    }

    public getSchoolLeadProgramInterestOptions(schoolCrmId: string) {
        return this._featuresService.apiV1SchoolFeaturesSchoolCrmIdLeadInterestOptionsGet(schoolCrmId);
    }

    /**
     * @param crmId (optional)
     * @param body (optional)
     * @return Success
     */
    saveSchoolFeatures(
        crmId: string | undefined,
        body: string[] | undefined,
        throwApiError: boolean | undefined
    ): Observable<void> {
        if (throwApiError) {
            return this._featuresEditorServiceProxy.throwError();
        }

        return this._featuresEditorServiceProxy.saveSchoolFeatures(crmId, body);
    }
}

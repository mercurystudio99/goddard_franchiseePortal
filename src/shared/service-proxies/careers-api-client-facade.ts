import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Career, CareersService } from '@app/shared/common/apis/generated/careers';
import { CareersEditorServiceServiceProxy, Career as fbpCareer } from './service-proxies';

@Injectable({
    providedIn: 'root',
})
export class CareersApiClientFacade {
    constructor(
        private _careersService: CareersService,
        private _careersEditorServiceServiceProxy: CareersEditorServiceServiceProxy
    ) {}

    public getSchoolCareers(crmSchoolId?: string): Observable<Array<Career>> {
        return this._careersService.apiV1CareersSchoolIdSchoolIdGet(crmSchoolId).pipe(catchError(this.handleError));
    }

    public saveCareer(body: fbpCareer): Observable<fbpCareer> {
        return this._careersEditorServiceServiceProxy.saveCareer(body).pipe(catchError(this.handleError));
    }

    public deleteCareer(careerId: number): Observable<fbpCareer> {
        return this._careersEditorServiceServiceProxy.deleteCareer(careerId).pipe(catchError(this.handleError));
    }

    private handleError(err: any) {
        console.error('[ERROR]: ' + JSON.stringify(err));
        return throwError(err);
    }
}

import { Injectable } from '@angular/core';
import { AssetListDto } from '@app/shared/common/apis/generated/content';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ContentApiClientFacade } from './content-api-client-facade';
import { SummerCampEditorServiceServiceProxy, AssetListDto as fbpAssetListDto } from './service-proxies';

@Injectable({
    providedIn: 'root',
})
export class SummerCampClientFacade {
    constructor(
        private _summerCampServiceProxy: SummerCampEditorServiceServiceProxy,
        private _contentAPI: ContentApiClientFacade
    ) {}

    public saveSummerCampCalendar(crmId: string, path: string, body: fbpAssetListDto): Observable<void> {
        return this._summerCampServiceProxy
            .saveSummerCampCalendar(crmId, path, body)
            .pipe(catchError(this.handleError));
    }

    private handleError(err: any) {
        console.error('[ERROR]: ' + JSON.stringify(err));
        return throwError(err);
    }
}

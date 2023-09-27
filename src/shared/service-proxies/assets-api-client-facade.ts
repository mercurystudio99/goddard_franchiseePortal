import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AssetsEditorServiceServiceProxy,
    CompleteUploadDto,
    CompleteUploadResponse,
    InitiateUploadResponse,
    InitiateUploadDto,
} from './service-proxies';

@Injectable({
    providedIn: 'root',
})
export class AssetsApiClientFacade {
    constructor(private _assetsEditorServiceServiceProxy: AssetsEditorServiceServiceProxy) {}

    public initiateUpload(body: InitiateUploadDto): Observable<InitiateUploadResponse> {
        return this._assetsEditorServiceServiceProxy.initiateUpload(body);
    }

    public completeUpload(body: CompleteUploadDto): Observable<CompleteUploadResponse> {
        return this._assetsEditorServiceServiceProxy.completeUpload(body);
    }
}

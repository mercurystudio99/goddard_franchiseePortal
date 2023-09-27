import { Injectable } from '@angular/core';
import { FacultyBios, FacultyBiosPagedResponse, FacultyBiosService } from '@app/shared/common/apis/generated/faculty';
import { Observable } from 'rxjs';
import { FacultyEditorServiceServiceProxy, PostFacultyBiosRequest } from './service-proxies';

@Injectable({ providedIn: 'root' })
export class FacultyApiClientFacade {
    constructor(
        private _facultyEditorService: FacultyBiosService,
        private _facultyServiceProxy: FacultyEditorServiceServiceProxy
    ) {}

    public getFaculty(fmsSchoolId?: string, page?: number, pageSize?: number): Observable<FacultyBiosPagedResponse> {
        return this._facultyEditorService.apiV1FacultyGet(fmsSchoolId, true, true, page, pageSize);
    }

    public getFacultyById(id: number): Observable<FacultyBios> {
        return this._facultyEditorService.apiV1FacultyIdGet(id);
    }

    public saveFaculty(body: PostFacultyBiosRequest[] | undefined): Observable<any> {
        return this._facultyServiceProxy.saveFaculty(body);
    }

    public deleteFacultyImage(body: FacultyBios | undefined): Observable<any> {
        return this._facultyServiceProxy.deleteFacultyImage(body.fmsSchoolId, body.imageFilename);
    }
}

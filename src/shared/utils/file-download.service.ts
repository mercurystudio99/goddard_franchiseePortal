import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { FileDto } from '@shared/service-proxies/service-proxies';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs/operators';

@Injectable()
export class FileDownloadService {
    private spinnerService: NgxSpinnerService;

    constructor(private injector: Injector, private http: HttpClient) {
        this.spinnerService = injector.get(NgxSpinnerService);
    }

    downloadTempFile(file: FileDto) {
        const url =
            AppConsts.remoteServiceBaseUrl +
            '/File/DownloadTempFile?fileType=' +
            file.fileType +
            '&fileToken=' +
            file.fileToken +
            '&fileName=' +
            file.fileName;

        this.spinnerService.show('content');

        //workaround to reuse subscription interceptor for api authorization and avoid going through browser requests
        //  which will require sending the subscription key in some other ways like cookie or query string
        //change browser request to xmlHttpRequest for adding the subscription key through the interceptor
        //TICKET#: https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/14254/
        this.http
            .get(url, {
                responseType: 'blob',
            })
            .pipe(finalize(() => this.spinnerService.hide('content')))
            .subscribe(
                (blob) => {
                    const a = document.createElement('a');
                    const objectUrl = URL.createObjectURL(blob);
                    a.href = objectUrl;
                    a.download = file.fileName;
                    a.click();
                    URL.revokeObjectURL(objectUrl);
                    a.remove();
                },
                (error) => {
                    console.log(error);
                }
            );
    }
}

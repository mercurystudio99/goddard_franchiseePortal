import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { Observable } from 'rxjs/internal/Observable';
import { EMPTY, throwError } from 'rxjs';
import { ApiException } from './service-proxies/service-proxies';
import { AppConsts } from './AppConsts';
import { environment } from '../environments/environment';
/**
 * Handles unauthenticated error response validating status response = 401
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router, private _router: Router, private _sessionService: AppSessionService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((err: any) => {
                console.error('[AuthInterceptor]: ', JSON.stringify(err));
                if (request.url.includes(AppConsts.remoteServiceBaseUrl)) {
                    return this.handleError(err);
                }
                return throwError(err);
            })
        );
    }

    private handleError(err: any): Observable<any> {
        if (err instanceof HttpErrorResponse || err instanceof ApiException) {
            if (err.status === 401) {
                abp.message.warn('Your session has expired, please login again', '').then(() => {
                    if(environment.sso) {
                        location.href = AppConsts.wellKnownAADLoginEndpoint;
                    } else {
                        location.href = AppConsts.appBaseUrl ? AppConsts.appBaseUrl : '/account/login';
                    }
                });
                return EMPTY;
            }
        }

        return throwError(err);
    }
}

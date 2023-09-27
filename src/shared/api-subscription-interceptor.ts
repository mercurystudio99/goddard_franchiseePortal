import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AppConsts } from './AppConsts';

@Injectable()
export class ApiSubscriptionInterceptor implements HttpInterceptor {

    /**
     * URLs that require interception to either add an APIM subscription key
     * and/or remove `Authorization` header
     *
     * 20220105RBP - Changed to a getter because AppConsts changes at runtime
     * in AppPreBootstrap
     */
    private static get urlsToUse(): Array<string> {

        // Add  URLs that require APIM subscription key on each request
        return [
            environment.featuresAPIBasePath,
            environment.contentAPIBasePath,
            environment.facultyAPIBasePath,
            environment.testimonialsAPIBasePath,
            environment.careersAPIBasePath,
            environment.schoolEventsAPIBasePath,
            environment.authorBaseSiteUrl,
            AppConsts.remoteServiceBaseUrl
        ];
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (!ApiSubscriptionInterceptor.urlRequiresInterception(req.url)) {
            // Does not require interception, nothing to do
            return next.handle(req);
        }

        // Add the API subscription key
        let modifiedReq = req.clone({
            headers: req.headers.set('Ocp-Apim-Subscription-Key',
            ApiSubscriptionInterceptor.getApiSubscriptionKey(req.url)),
        });

        // Delete `Authorization` header for AEM calls
        if (req.url.includes(environment.contentAPIBasePath) || req.url.includes(environment.authorBaseSiteUrl)) {
            modifiedReq = modifiedReq.clone({
                headers: modifiedReq.headers.delete('authorization'),
            });
        }

        return next.handle(modifiedReq);

    }

    /**
     * Similar to intercept but for base XMLHttpRequest calls via XmlHttpRequestHelper
     */
    public static interceptXhr(url: string, xhr: XMLHttpRequest): XMLHttpRequest {

        if (!this.urlRequiresInterception(url)) {
            // Does not require interception, nothing to do
            return xhr;
        }

        // Add the API subscription key
        xhr.setRequestHeader('Ocp-Apim-Subscription-Key',
            this.getApiSubscriptionKey(url));

        // 20220105RBP - Do not need logic to delete `Authorization` header
        // here as in `intercept` method because it is not used for AEM calls
        return xhr;
    }

    private static urlRequiresInterception(url: string): boolean {
        const result =  this.urlsToUse.some((x) => url.includes(x));
        return result;
    }

    private static getApiSubscriptionKey(url: string): string {

        var result = `${environment.APIM_KEY}`;

        if(url.includes(AppConsts.remoteServiceBaseUrl) && environment.FBP_APIM_KEY) {
            // Request is for the FBP API and there is an override key specified
            result = environment.FBP_APIM_KEY;
        }

        return result;
    }
}

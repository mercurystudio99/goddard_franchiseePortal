import { Injectable } from '@angular/core';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class AppUrlService {
    static tenancyNamePlaceHolder = '{TENANCY_NAME}';

    constructor(
        private readonly _appSessionService: AppSessionService,
        private _appNavigationService: AppNavigationService
    ) {}

    get appRootUrl(): string {
        if (this._appSessionService.tenant) {
            return this.getAppRootUrlOfTenant(this._appSessionService.tenant.tenancyName);
        } else {
            return this.getAppRootUrlOfTenant(null);
        }
    }

    /**
     * Returning url ends with '/'.
     */
    getAppRootUrlOfTenant(tenancyName?: string): string {
        let baseUrl = this.ensureEndsWith(AppConsts.appBaseUrlFormat, '/');

        //Add base href if it is not configured in appconfig.json
        if (baseUrl.indexOf(AppConsts.appBaseHref) < 0) {
            baseUrl = baseUrl + this.removeFromStart(AppConsts.appBaseHref, '/');
        }

        if (baseUrl.indexOf(AppUrlService.tenancyNamePlaceHolder) < 0) {
            return baseUrl;
        }

        if (baseUrl.indexOf(AppUrlService.tenancyNamePlaceHolder + '.') >= 0) {
            baseUrl = baseUrl.replace(AppUrlService.tenancyNamePlaceHolder + '.', AppUrlService.tenancyNamePlaceHolder);
            if (tenancyName) {
                tenancyName = tenancyName + '.';
            }
        }

        if (!tenancyName) {
            return baseUrl.replace(AppUrlService.tenancyNamePlaceHolder, '');
        }

        return baseUrl.replace(AppUrlService.tenancyNamePlaceHolder, tenancyName);
    }

    private ensureEndsWith(str: string, c: string) {
        if (str.charAt(str.length - 1) !== c) {
            str = str + c;
        }

        return str;
    }

    private removeFromEnd(str: string, c: string) {
        if (str.charAt(str.length - 1) === c) {
            str = str.substr(0, str.length - 1);
        }

        return str;
    }

    private removeFromStart(str: string, c: string) {
        if (str.charAt(0) === c) {
            str = str.substr(1, str.length - 1);
        }

        return str;
    }

    /**
     * determines if url is an internal URL to i.goddard
     * could be an relative of full URL like:
     * /app/site-marketing-tools/marketing-focus
     * OR
     * https://www-stage.i-goddard.com/app/tours-editor/manage-tours
     * @param urlPath
     * @returns
     */
    public isInternalURL(urlPath: string): boolean {
        if (this.validHttpProtocol(urlPath)) {
            urlPath = this.getPathName(urlPath);
        }
        //remove parameters from url
        if (urlPath.includes('?')) {
            urlPath = urlPath.split('?')[0];
        }

        //Relying on registered menu items to find a matching route
        return this._appNavigationService.getAllMenuItems().find((item) => item.route === urlPath) !== undefined;
    }

    public getRelativePathFromURL(urlPath: string): string {
        if (this.validHttpProtocol(urlPath)) {
            return this.replaceOrigin(urlPath);
        }
        return urlPath;
    }

    /**
     * validates url starts with the http protocol
     * @param url
     * @returns
     */
    validHttpProtocol(url: string): boolean {
        let valid = /^(http(s)?:\/\/).{1,}/.test(url);

        return valid;
    }

    /**
     * replace origin from a given full URL
     * @param urlPath url path
     * @param replaceWith value to replace the origin with
     * @returns
     */
    replaceOrigin(urlPath: string, replaceWith: string = ''): string {
        var url = new URL(urlPath);
        return urlPath.replace(url.origin, replaceWith);
    }

    /**
     * get only the path portion from a full URL
     * @param urlPath
     * @returns
     */
    getPathName(urlPath: string): string {
        var url = new URL(urlPath);
        return url.pathname;
    }
}

import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { XmlHttpRequestHelper } from '@shared/helpers/XmlHttpRequestHelper';
import { LocalStorageService } from '@shared/utils/local-storage.service';

@Injectable()
export class AppAuthService {
    private wellKnownSsoLogoutEndpoint: string = 'https://login.microsoftonline.com/common/oauth2/v2.0/logout';
    private nativeLoginEndpoint = AppConsts.nativeLoginEndpoint;
    private NATIVE_LOGIN_KEY = "NATIVE_LOGIN";

    private logoutInternal(reload?: boolean, returnUrl?: string, withSso?: boolean) {
        let customHeaders = {
            [abp.multiTenancy.tenantIdCookieName]: abp.multiTenancy.getTenantIdCookie(),
            'Authorization': 'Bearer ' + abp.auth.getToken()
        };

        XmlHttpRequestHelper.ajax(
            'GET',
            AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/LogOut',
            customHeaders,
            null,
            () => {
                abp.auth.clearToken();
                abp.auth.clearRefreshToken();
                new LocalStorageService().removeItem(
                    AppConsts.authorization.encrptedAuthTokenName,
                    () => {
                        if(returnUrl) {
                            location.href = returnUrl;
                            return;
                        }

                        if (withSso !== false) {
                            location.href = this.wellKnownSsoLogoutEndpoint;
                        } else {
                            location.href = this.nativeLoginEndpoint;
                        }
                    }
                );
            }
        );
    }

    logout(reload?: boolean, returnUrl?: string): void {
        this.getNativeLogin((err, isNativeLogin) => {
            if (isNativeLogin)
                this.logoutInternal(reload, returnUrl, false);
            else
                this.logoutInternal(reload, returnUrl, true);
        });
    }

    private getNativeLogin(callback: any) : void {
        return new LocalStorageService().getItem(this.NATIVE_LOGIN_KEY, callback);
    }

    setNativeLogin(value: boolean) : void {
        new LocalStorageService().setItem(this.NATIVE_LOGIN_KEY, value);
    }

    public logoutForSso(reload?: boolean): void {
        this.logoutInternal(reload, null, true);
    }
}

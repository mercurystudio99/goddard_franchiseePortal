import { AbpSessionService } from 'abp-ng2-module';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SchoolInfoDto, SessionServiceProxy, UpdateUserSignInTokenOutput } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from 'shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from './login.service';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { AppConsts } from '@shared/AppConsts';
import { environment } from '../../environments/environment';

@Component({
    templateUrl: './login.component.html',
    animations: [accountModuleAnimation()],
    styleUrls: ['./login.component.less'],
})
export class LoginComponent extends AppComponentBase implements OnInit, OnDestroy {
    submitting = false;
    isNativeLogin = false;
    sessionLoaded = false;
    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    recaptchaSiteKey: string = AppConsts.recaptchaSiteKey;
    schoolSubscription: any;
    _school: SchoolInfoDto;
    nativeLoginEndpoint = AppConsts.nativeLoginEndpoint;

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _sessionService: AbpSessionService,
        private _sessionAppService: SessionServiceProxy,
        private _reCaptchaV3Service: ReCaptchaV3Service
    ) {
        super(injector);
    }

    get multiTenancySideIsTeanant(): boolean {
        return this._sessionService.tenantId > 0;
    }

    get isTenantSelfRegistrationAllowed(): boolean {
        return this.setting.getBoolean('App.TenantManagement.AllowSelfRegistration');
    }

    get isSelfRegistrationAllowed(): boolean {
        if (!this._sessionService.tenantId) {
            return false;
        }

        return this.setting.getBoolean('App.UserManagement.AllowSelfRegistration');
    }

    ngOnInit(): void {
        this.loginService.init();
        this.schoolSubscription = this.loginService.shoolSubject.subscribe((school) => {
            this.sessionLoaded = true;
            this._school = school;
        });

        const loginParam = this._route.snapshot.queryParams.login;
        this.isNativeLogin = loginParam && loginParam === 'native';
        if (this._sessionService.userId > 0 && UrlHelper.getReturnUrl() && UrlHelper.getSingleSignIn()) {
            this._sessionAppService.updateUserSignInToken().subscribe((result: UpdateUserSignInTokenOutput) => {
                const initialReturnUrl = UrlHelper.getReturnUrl();
                const returnUrl =
                    initialReturnUrl +
                    (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                    'accessToken=' +
                    result.signInToken +
                    '&userId=' +
                    result.encodedUserId +
                    '&tenantId=' +
                    result.encodedTenantId;

                location.href = returnUrl;
            });
        }

        if (
            !this.isNativeLogin &&
            // Default to true if environment isn't loaded
            (!environment || environment.sso)
        ) {
            this.loginService.getOpenIDConnectUserInfo().subscribe((authToken) => {

                this.loginService.microsoftLoginCallback(authToken);

                // simple way to hide spinner in case of login error to fallback to admin login
                setTimeout(() => {
                    this.spinnerService.hide();
                }, 2000);
            });
        } else {
            // If we're not on a native login and we're not doing sso, send us to the native login. tja 20220903
            if(!(location.href.indexOf(this.nativeLoginEndpoint) > 0)) {
                location.href = this.nativeLoginEndpoint;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.schoolSubscription) {
            this.schoolSubscription.unsubscribe();
        }
    }

    handleExternalLoginCallbacks(): void {
        let state = UrlHelper.getQueryParametersUsingHash().state;
        let queryParameters = UrlHelper.getQueryParameters();

        if (state && state.indexOf('openIdConnect') >= 0) {
            this.loginService.openIdConnectLoginCallback({});
        }

        if (queryParameters.twitter && queryParameters.twitter === '1') {
            let parameters = UrlHelper.getQueryParameters();
            let token = parameters['oauth_token'];
            let verifier = parameters['oauth_verifier'];
            this.loginService.twitterLoginCallback(token, verifier);
        }
    }

    login(): void {
        let recaptchaCallback = (token: string) => {
            this.showMainSpinner();

            this.submitting = true;
            this.loginService.authenticate(
                () => {
                    this.submitting = false;
                    this.hideMainSpinner();
                },
                null,
                token
            );
        };

        if (this.useCaptcha) {
            this._reCaptchaV3Service.execute(this.recaptchaSiteKey, 'login', (token) => {
                recaptchaCallback(token);
            });
        } else {
            recaptchaCallback(null);
        }
    }

    externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    get useCaptcha(): boolean {
        return this.setting.getBoolean('App.UserManagement.UseCaptchaOnLogin');
    }
}

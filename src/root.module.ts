import { PlatformLocation, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, DEFAULT_CURRENCY_CODE, Injector, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Angulartics2Module } from 'angulartics2';
// import { Angulartics2GoogleTagManager } from 'angulartics2/gtm';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { AppConsts } from '@shared/AppConsts';
import { FranchiseePortalCommonModule } from '@shared/common/common.module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    API_BASE_URL,
    UiCustomizationSettingsDto,
    ThemeSettingsDto,
    ThemeMenuSettingsDto,
    ThemeLayoutSettingsDto,
    ThemeHeaderSettingsDto,
    ThemeSubHeaderSettingsDto,
    ThemeFooterSettingsDto,
    ApplicationInfoDto,
} from '@shared/service-proxies/service-proxies';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import * as localForage from 'localforage';
import { AppPreBootstrap } from './AppPreBootstrap';
import { AppModule } from './app/app.module';
import { RootRoutingModule } from './root-routing.module';
import { RootComponent } from './root.component';
import { DomHelper } from '@shared/helpers/DomHelper';
import { CookieConsentService } from '@shared/common/session/cookie-consent.service';
import { NgxBootstrapDatePickerConfigService } from 'assets/ngx-bootstrap/ngx-bootstrap-datepicker-config.service';
import { LocaleMappingService } from '@shared/locale-mapping.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { environment } from './environments/environment';
import { BASE_PATH as BASE_PATH_CONTENT_API } from '@app/shared/common/apis/generated/content';
import { BASE_PATH as BASE_PATH_FEATURES_API } from '@app/shared/common/apis/generated/features';
import { BASE_PATH as BASE_PATH_FACULTY_API } from '@app/shared/common/apis/generated/faculty';
import { BASE_PATH as BASE_PATH_TESTIMONIALS_API } from '@app/shared/common/apis/generated/testimonials';
import { BASE_PATH as BASE_PATH_CAREERS_API } from '@app/shared/common/apis/generated/careers';
import { BASE_PATH as BASE_PATH_SCHOOL_EVENTS_API } from '@app/shared/common/apis/generated/school-events';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiSubscriptionInterceptor } from '@shared/api-subscription-interceptor';

export function appInitializerFactory(injector: Injector, platformLocation: PlatformLocation) {
    return () => {
        let spinnerService = injector.get(NgxSpinnerService);

        spinnerService.show();

        return new Promise<boolean>((resolve, reject) => {
            AppConsts.appBaseHref = getBaseHref(platformLocation);
            let appBaseUrl = getDocumentOrigin() + AppConsts.appBaseHref;

            initializeLocalForage();

            AppPreBootstrap.run(
                appBaseUrl,
                injector,
                () => {
                    handleLogoutRequest(injector.get(AppAuthService));

                    if (UrlHelper.isInstallUrl(location.href)) {
                        doConfigurationForInstallPage(injector);
                        spinnerService.hide();
                        resolve(true);
                    } else {
                        let appSessionService: AppSessionService = injector.get(AppSessionService);
                        appSessionService.init().then(
                            (result) => {
                                initializeAppCssClasses(injector, result);
                                initializeTenantResources(injector);
                                initializeCookieConsent(injector);
                                registerLocales(resolve, reject, spinnerService);
                            },
                            (err) => {
                                spinnerService.hide();
                                reject(err);
                            }
                        );
                    }
                },
                resolve,
                reject
            );
        });
    };
}

function initializeLocalForage() {
    localForage.config({
        driver: localForage.LOCALSTORAGE,
        name: 'FranchiseePortal',
        version: 1.0,
        storeName: 'abpzerotemplate_local_storage',
        description: 'Cached data for FranchiseePortal',
    });
}

function getDefaultThemeForInstallPage(): UiCustomizationSettingsDto {
    let theme = new UiCustomizationSettingsDto();
    theme.baseSettings = new ThemeSettingsDto();
    theme.baseSettings.theme = 'default';
    theme.baseSettings.menu = new ThemeMenuSettingsDto();
    theme.baseSettings.menu.asideSkin = 'light';

    theme.baseSettings.header = new ThemeHeaderSettingsDto();
    theme.baseSettings.header.headerSkin = 'light';

    theme.baseSettings.subHeader = new ThemeSubHeaderSettingsDto();

    theme.baseSettings.layout = new ThemeLayoutSettingsDto();
    theme.baseSettings.layout.layoutType = 'fluid';
    theme.baseSettings.header = new ThemeHeaderSettingsDto();
    theme.baseSettings.footer = new ThemeFooterSettingsDto();
    return theme;
}

function setApplicationInfoForInstallPage(injector, theme: UiCustomizationSettingsDto) {
    let appSessionService: AppSessionService = injector.get(AppSessionService);
    let dateTimeService: DateTimeService = injector.get(DateTimeService);
    appSessionService.theme = theme;
    appSessionService.application = new ApplicationInfoDto();
    appSessionService.application.releaseDate = dateTimeService.getStartOfDay();
}

function doConfigurationForInstallPage(injector) {
    let theme = getDefaultThemeForInstallPage();
    setApplicationInfoForInstallPage(injector, theme);

    initializeAppCssClasses(injector, theme);
}

function initializeAppCssClasses(injector: Injector, theme: UiCustomizationSettingsDto) {
    let appUiCustomizationService = injector.get(AppUiCustomizationService);
    appUiCustomizationService.init(theme);

    //Css classes based on the layout
    if (abp.session.userId) {
        document.body.className = appUiCustomizationService.getAppModuleBodyClass();
    } else {
        document.body.className = appUiCustomizationService.getAccountModuleBodyClass();
    }
}

function initializeTenantResources(injector: Injector) {
    let appSessionService: AppSessionService = injector.get(AppSessionService);

    if (appSessionService.tenant && appSessionService.tenant.customCssId) {
        document.head.appendChild(
            DomHelper.createElement('link', [
                {
                    key: 'id',
                    value: 'TenantCustomCss',
                },
                {
                    key: 'rel',
                    value: 'stylesheet',
                },
                {
                    key: 'href',
                    value:
                        AppConsts.remoteServiceBaseUrl +
                        '/TenantCustomization/GetCustomCss?tenantId=' +
                        appSessionService.tenant.id,
                },
            ])
        );
    }

    let metaImage = DomHelper.getElementByAttributeValue('meta', 'property', 'og:image');
    if (metaImage) {
        //set og share image meta tag
        if (!appSessionService.tenant || !appSessionService.tenant.logoId) {
            let ui: AppUiCustomizationService = injector.get(AppUiCustomizationService);
            metaImage.setAttribute(
                'content',
                window.location.origin +
                    '/assets/common/images/app-logo-on-' +
                    abp.setting.get(
                        appSessionService.theme.baseSettings.theme + '.' + 'App.UiManagement.Left.AsideSkin'
                    ) +
                    '.svg'
            );
        } else {
            metaImage.setAttribute(
                'content',
                AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetLogo?tenantId=' + appSessionService.tenant.id
            );
        }
    }
}

function initializeCookieConsent(injector: Injector) {
    let cookieConsentService: CookieConsentService = injector.get(CookieConsentService);
    cookieConsentService.init();
}

function getDocumentOrigin() {
    if (!document.location.origin) {
        return (
            document.location.protocol +
            '//' +
            document.location.hostname +
            (document.location.port ? ':' + document.location.port : '')
        );
    }

    return document.location.origin;
}

function registerLocales(
    resolve: (value?: boolean | Promise<boolean>) => void,
    reject: any,
    spinnerService: NgxSpinnerService
) {
    if (shouldLoadLocale()) {
        let angularLocale = convertAbpLocaleToAngularLocale(abp.localization.currentLanguage.name);
        // Fix for ng 13 upgrade.  See https://stackoverflow.com/questions/69970566/module-not-found-error-package-path-locales-is-not-exported-from-package-aft
        // https://stackoverflow.com/questions/69946182/angular-13-cannot-find-module-angular-common-locales-fr-js
        import(`/node_modules/@angular/common/locales/${angularLocale}.mjs`).then((module) => {
            registerLocaleData(module.default);
            NgxBootstrapDatePickerConfigService.registerNgxBootstrapDatePickerLocales().then((_) => {
                resolve(true);
                spinnerService.hide();
            });
        }, reject);
    } else {
        NgxBootstrapDatePickerConfigService.registerNgxBootstrapDatePickerLocales().then((_) => {
            resolve(true);
            spinnerService.hide();
        });
    }
}

export function shouldLoadLocale(): boolean {
    return abp.localization.currentLanguage.name && abp.localization.currentLanguage.name !== 'en-US';
}

export function convertAbpLocaleToAngularLocale(locale: string): string {
    return new LocaleMappingService().map('angular', locale);
}

export function getRemoteServiceBaseUrl(): string {
    return AppConsts.remoteServiceBaseUrl;
}

export function getCurrentLanguage(): string {
    return convertAbpLocaleToAngularLocale(abp.localization.currentLanguage.name);
}

export function getCurrencyCode(injector: Injector): string {
    let appSessionService: AppSessionService = injector.get(AppSessionService);
    return appSessionService.application.currency;
}

export function getBaseHref(platformLocation: PlatformLocation): string {
    let baseUrl = platformLocation.getBaseHrefFromDOM();
    if (baseUrl) {
        return baseUrl;
    }

    return '/';
}

function handleLogoutRequest(authService: AppAuthService) {
    let currentUrl = UrlHelper.initialUrl;
    let returnUrl = UrlHelper.getReturnUrl();
    if (currentUrl.indexOf('account/logout') >= 0 && returnUrl) {
        authService.logoutForSso(true);
    }
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppModule,
        FranchiseePortalCommonModule.forRoot(),
        ServiceProxyModule,
        HttpClientModule,
        RootRoutingModule,
        NgxSpinnerModule,
        Angulartics2Module.forRoot(), //,
        // Angulartics2GoogleTagManager
    ],
    declarations: [RootComponent],
    providers: [
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [Injector, PlatformLocation],
            multi: true,
        },
        {
            provide: LOCALE_ID,
            useFactory: getCurrentLanguage,
        },
        {
            provide: DEFAULT_CURRENCY_CODE,
            useFactory: getCurrencyCode,
            deps: [Injector],
        },
        {
            provide: BASE_PATH_CONTENT_API,
            useFactory: () => {
                return environment.contentAPIBasePath;
            },
        },
        {
            provide: BASE_PATH_FEATURES_API,
            useFactory: () => {
                return environment.featuresAPIBasePath;
            },
        },
        {
            provide: BASE_PATH_FACULTY_API,
            useFactory: () => {
                return environment.facultyAPIBasePath;
            },
        },
        {
            provide: BASE_PATH_TESTIMONIALS_API,
            useFactory: () => {
                return environment.testimonialsAPIBasePath;
            },
        },
        {
            provide: BASE_PATH_CAREERS_API,
            useFactory: () => {
                return environment.careersAPIBasePath;
            },
        },
        {
            provide: BASE_PATH_SCHOOL_EVENTS_API,
            useFactory: () => {
                return environment.schoolEventsAPIBasePath;
            },
        },
        { provide: HTTP_INTERCEPTORS, useClass: ApiSubscriptionInterceptor, multi: true },
    ],
    bootstrap: [RootComponent],
})
export class RootModule {}

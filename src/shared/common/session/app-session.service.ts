import { AbpMultiTenancyService } from 'abp-ng2-module';
import { Injectable } from '@angular/core';
import {
    ApplicationInfoDto,
    GetCurrentLoginInformationsOutput,
    SessionServiceProxy,
    TenantLoginInfoDto,
    UserLoginInfoDto,
    UiCustomizationSettingsDto,
    SchoolInfoDto,
} from '@shared/service-proxies/service-proxies';
import { AppAnalyticsService } from '../analytics/app-analytics.service';

@Injectable()
export class AppSessionService {
    private _user: UserLoginInfoDto;
    private _school: SchoolInfoDto;
    private _impersonatorUser: UserLoginInfoDto;
    private _tenant: TenantLoginInfoDto;
    private _impersonatorTenant: TenantLoginInfoDto;
    private _application: ApplicationInfoDto;
    private _theme: UiCustomizationSettingsDto;
    public defaultSchoolBusinessHours = '8:00 am - 5:00 pm';
    public schoolStartBusinessHour: string;
    public schoolEndBusinessHour: string;

    private _schoolSetEvent?: (info: SchoolInfoDto) => void;

    constructor(
        private _sessionService: SessionServiceProxy,
        private _abpMultiTenancyService: AbpMultiTenancyService
    ) {}

    get schoolSetEvent(): (info: SchoolInfoDto) => void {
        return this._schoolSetEvent;
    }

    set schoolSetEvent(ev: (info: SchoolInfoDto) => void) {
       this._schoolSetEvent = ev;
    }

    get application(): ApplicationInfoDto {
        return this._application;
    }

    set application(val: ApplicationInfoDto) {
        this._application = val;
    }

    get user(): UserLoginInfoDto {
        return this._user;
    }
    get school(): SchoolInfoDto {
        return this._school;
    }
    set school(val: SchoolInfoDto) {
        this._school = val;
    }

    get userId(): number {
        return this.user ? this.user.id : null;
    }

    get tenant(): TenantLoginInfoDto {
        return this._tenant;
    }

    get tenancyName(): string {
        return this._tenant ? this.tenant.tenancyName : '';
    }

    get tenantId(): number {
        return this.tenant ? this.tenant.id : null;
    }

    getShownLoginName(): string {
        const userName = this._user.userName;
        if (!this._abpMultiTenancyService.isEnabled) {
            return userName;
        }

        return (this._tenant ? this._tenant.tenancyName : '.') + '\\' + userName;
    }

    get theme(): UiCustomizationSettingsDto {
        return this._theme;
    }

    set theme(val: UiCustomizationSettingsDto) {
        this._theme = val;
    }

    init(): Promise<UiCustomizationSettingsDto> {
        return new Promise<UiCustomizationSettingsDto>((resolve, reject) => {
            this._sessionService
                .getCurrentLoginInformations()
                .toPromise()
                .then(
                    (result: GetCurrentLoginInformationsOutput) => {
                        this._application = result.application;
                        this._user = result.user;
                        this._school = result.school;
                        this._tenant = result.tenant;
                        this._theme = result.theme;
                        this._impersonatorTenant = result.impersonatorTenant;
                        this._impersonatorUser = result.impersonatorUser;

                        this.setupSchoolBusinessHours();

                        if (this._user && !result.school) {
                            reject(new Error('No associated school'));
                            return;
                        }

                        // analytics
                        if (result.school) {
                          AppAnalyticsService.setSchool(result.school);
                        }

                        resolve(result.theme);
                    },
                    (err) => {
                        reject(err);
                    }
                );
        });
    }

    changeTenantIfNeeded(tenantId?: number): boolean {
        if (this.isCurrentTenant(tenantId)) {
            return false;
        }

        abp.multiTenancy.setTenantIdCookie(tenantId);
        location.reload();
        return true;
    }

    private isCurrentTenant(tenantId?: number) {
        let isTenant = tenantId > 0;

        if (!isTenant && !this.tenant) {
            // this is host
            return true;
        }

        if (!tenantId && this.tenant) {
            return false;
        } else if (tenantId && (!this.tenant || this.tenant.id !== tenantId)) {
            return false;
        }

        return true;
    }

    get impersonatorUser(): UserLoginInfoDto {
        return this._impersonatorUser;
    }

    get impersonatorUserId(): number {
        return this.impersonatorUser ? this.impersonatorUser.id : null;
    }

    get impersonatorTenant(): TenantLoginInfoDto {
        return this._impersonatorTenant;
    }

    get impersonatorTenancyName(): string {
        return this.impersonatorTenant ? this.impersonatorTenant.tenancyName : '';
    }

    get impersonatorTenantId(): number {
        return this.impersonatorTenant ? this.impersonatorTenant.id : null;
    }

    setupSchoolBusinessHours(): void {
        if (!this.school) {
            return;
        }

        // Setup school business hours
        let schoolBusinessHours =
            this.school?.hours && this.school?.hours.includes('-')
                ? this.school.hours
                : this.defaultSchoolBusinessHours;

        this.schoolStartBusinessHour = schoolBusinessHours.split('-')[0].trim();
        this.schoolEndBusinessHour = schoolBusinessHours.split('-')[1].trim();
    }
}

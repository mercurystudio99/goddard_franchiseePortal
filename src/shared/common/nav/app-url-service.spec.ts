import { TestBed } from '@angular/core/testing';
import { SessionServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppUrlService } from './app-url.service';
import { AppSessionService } from '@shared/common/session';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AbpMultiTenancyService } from 'abp-ng2-module';

import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppUrlService', () => {
    let appUrlService: AppUrlService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                SessionServiceProxy,
                AppSessionService,
                AppNavigationService,
                PermissionCheckerService,
                AbpMultiTenancyService,
                AppUrlService,
            ],
        });

        appUrlService = TestBed.inject(AppUrlService);
    });

    it('#validHttpProtocol should return "true" for URL "https://www-dev.i-goddard.com"', () => {
        const isValid = appUrlService.validHttpProtocol('https://www-dev.i-goddard.com');
        expect(isValid).toBeTruthy();
    });

    it('#validHttpProtocol should return "true" for URL "/app/site-editor/edit-home-page"', () => {
        const isValid = appUrlService.validHttpProtocol('/app/site-editor/edit-home-page');
        expect(isValid).toBeFalsy();
    });

    it('#isInternalURL should return "true" for URL "https://www-stage.i-goddard.com/app/site-marketing-tools/marketing-focus"', () => {
        const isInternalURL = appUrlService.isInternalURL(
            'https://www-stage.i-goddard.com/app/site-marketing-tools/marketing-focus'
        );
        expect(isInternalURL).toBeTruthy();
    });

    it('#isInternalURL should return "true" for URL "https://www-qa.i-goddard.com/app/site-marketing-tools/marketing-focus"', () => {
        const isInternalURL = appUrlService.isInternalURL(
            'https://www-qa.i-goddard.com/app/site-marketing-tools/marketing-focus'
        );
        expect(isInternalURL).toBeTruthy();
    });

    it('#isInternalURL should return "false" for URL "https://www-stage.i-goddard.com/admin/site-marketing-tools/marketing-focus"', () => {
        const isInternalURL = appUrlService.isInternalURL(
            'https://www-stage.i-goddard.com/admin/site-marketing-tools/marketing-focus'
        );
        expect(isInternalURL).toBeFalsy();
    });

    it('#getRelativePathFromURL should return "/app/site-marketing-tools/marketing-focus?id=test-id" for URL "https://www-stage.i-goddard.com/app/site-marketing-tools/marketing-focus?id=test-id"', () => {
        const relativePath = appUrlService.getRelativePathFromURL(
            'https://www-stage.i-goddard.com/app/site-marketing-tools/marketing-focus?id=test-id'
        );
        expect(relativePath === '/app/site-marketing-tools/marketing-focus?id=test-id').toBeTruthy();
    });

    it('#getRelativePathFromURL should return "/app/site-marketing-tools/marketing-focus" for URL "/app/site-marketing-tools/marketing-focus"', () => {
        const relativePath = appUrlService.getRelativePathFromURL('/app/site-marketing-tools/marketing-focus');
        expect(relativePath === '/app/site-marketing-tools/marketing-focus').toBeTruthy();
    });

    it('#replaceOrigin should return "/app/site-marketing-tools/marketing-focus?id=test-id" for URL "https://www-stage.i-goddard.com/app/site-marketing-tools/marketing-focus?id=test-id"', () => {
        const relativePath = appUrlService.replaceOrigin(
            'https://www-stage.i-goddard.com/app/site-marketing-tools/marketing-focus?id=test-id'
        );
        expect(relativePath === '/app/site-marketing-tools/marketing-focus?id=test-id').toBeTruthy();
    });
});

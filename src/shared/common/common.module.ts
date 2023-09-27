import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AppAnalyticsService } from './analytics/app-analytics.service';
import { AppUrlService } from './nav/app-url.service';
import { AppUiCustomizationService } from './ui/app-ui-customization.service';
import { AppSessionService } from './session/app-session.service';
import { CookieConsentService } from './session/cookie-consent.service';

@NgModule({
    imports: [CommonModule],
})
export class FranchiseePortalCommonModule {
    static forRoot(): ModuleWithProviders<CommonModule> {
        return {
            ngModule: CommonModule,
            providers: [
                AppAnalyticsService,
                AppUiCustomizationService,
                CookieConsentService,
                AppSessionService,
                AppUrlService
            ]
        };
    }
}

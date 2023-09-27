import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SiteMarketingRoutingModule } from './site-marketing-routing.module';
import { MarketingFocusComponent } from './marketing-focus/marketing-focus.component';
import { MarketingCollateralComponent } from './marketing-collateral/marketing-collateral.component';
import { SocialMediaComponent } from './social-media/social-media.component';
import { LocalMediaComponent } from './local-media/local-media.component';
import { FamilyVoiceComponent } from './family-voice/family-voice.component';
import { EmailMarketingComponent } from './email-marketing/email-marketing.component';

@NgModule({
    declarations: [
        MarketingFocusComponent,
        MarketingCollateralComponent,
        SocialMediaComponent,
        LocalMediaComponent,
        FamilyVoiceComponent,
        EmailMarketingComponent,
    ],
    imports: [AppSharedModule, CommonModule, AppBsModalModule, UtilsModule, SiteMarketingRoutingModule],
    exports: [],
})
export class SiteMarketingToolsModule {}

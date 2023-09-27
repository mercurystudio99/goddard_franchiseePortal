import { EmailMarketingComponent } from './email-marketing/email-marketing.component';
import { FamilyVoiceComponent } from './family-voice/family-voice.component';
import { LocalMediaComponent } from './local-media/local-media.component';
import { SocialMediaComponent } from './social-media/social-media.component';
import { MarketingCollateralComponent } from './marketing-collateral/marketing-collateral.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MarketingFocusComponent } from './marketing-focus/marketing-focus.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'marketing-focus', component: MarketingFocusComponent },
                    { path: 'marketing-collateral', component: MarketingCollateralComponent },
                    { path: 'social-media', component: SocialMediaComponent },
                    { path: 'local-media', component: LocalMediaComponent },
                    { path: 'family-voice', component: FamilyVoiceComponent },
                    { path: 'email-marketing', component: EmailMarketingComponent },
                    { path: '', redirectTo: 'marketing-focus', pathMatch: 'full' },
                    { path: '**', redirectTo: 'marketing-focus' },
                ],
            },
        ]),
    ],
    exports: [RouterModule],
})
export class SiteMarketingRoutingModule {}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { LOCALE_ID } from '@angular/core';

import { EmailMarketingComponent } from './email-marketing.component';

describe('EmailMarketingComponent', () => {
    let component: EmailMarketingComponent;
    let fixture: ComponentFixture<EmailMarketingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppModule, UtilsModule, AppRoutingModule, RootModule, ServiceProxyModule, NoopAnimationsModule],
            declarations: [EmailMarketingComponent],
            providers: [{ provide: LOCALE_ID, useValue: 'en' }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EmailMarketingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

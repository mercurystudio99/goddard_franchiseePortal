import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { LOCALE_ID } from '@angular/core';

import { LocalMediaComponent } from './local-media.component';

describe('LocalMediaComponent', () => {
    let component: LocalMediaComponent;
    let fixture: ComponentFixture<LocalMediaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppModule, UtilsModule, AppRoutingModule, RootModule, ServiceProxyModule, NoopAnimationsModule],
            declarations: [LocalMediaComponent],
            providers: [{ provide: LOCALE_ID, useValue: 'en' }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LocalMediaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

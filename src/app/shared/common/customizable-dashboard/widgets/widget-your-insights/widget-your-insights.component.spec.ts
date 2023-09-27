import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetYourInsightsComponent } from './widget-your-insights.component';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';

import { LOCALE_ID } from '@angular/core';

describe('WidgetYourInsightsComponent', () => {
  let component: WidgetYourInsightsComponent;
  let fixture: ComponentFixture<WidgetYourInsightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppModule,
        UtilsModule,
        RootModule,
        ServiceProxyModule
      ],
      declarations: [ WidgetYourInsightsComponent ],
      providers: [
        { provide: LOCALE_ID, useValue: 'en' },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetYourInsightsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { RootModule } from 'root.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';

import { LOCALE_ID } from '@angular/core';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EditHomePageComponent } from './edit-home-page.component';

describe('EditHomePageComponent', () => {
  let component: EditHomePageComponent;
  let fixture: ComponentFixture<EditHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppModule,
        UtilsModule,
        AppRoutingModule,
        RootModule,
        ServiceProxyModule,
        ModalModule,
        AppBsModalModule,
        HttpClientTestingModule
      ],
      declarations: [ EditHomePageComponent ],
      providers: [
        { provide: LOCALE_ID, useValue: 'en' }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditHomePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

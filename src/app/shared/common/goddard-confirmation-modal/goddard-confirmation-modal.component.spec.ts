import { ComponentFixture, TestBed } from '@angular/core/testing';

/* Module Imports */
import { AppModule } from '@app/app.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { RootModule } from 'root.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { LOCALE_ID } from '@angular/core';

import { GoddardConfirmationModalComponent } from './goddard-confirmation-modal.component';

describe('GoddardConfirmationModalComponent', () => {
    let component: GoddardConfirmationModalComponent;
    let fixture: ComponentFixture<GoddardConfirmationModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GoddardConfirmationModalComponent],
            imports: [AppModule, UtilsModule, RootModule, ModalModule, AppBsModalModule],
            providers: [{ provide: LOCALE_ID, useValue: 'en' }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GoddardConfirmationModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

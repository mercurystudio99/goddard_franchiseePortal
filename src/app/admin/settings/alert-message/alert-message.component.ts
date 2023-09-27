import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '../../../../shared/common/app-component-base';

@Component({
  selector: 'app-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.css']
})
export class AlertMessageComponent extends AppComponentBase implements OnInit  {
    alertMessage: string = this.setting.get('App.UserManagement.SystemAlertMessage');

    public constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {        
    }

    isMessageValid(): boolean {
        return this.alertMessage && this.alertMessage.trim().length > 0;
    }
}

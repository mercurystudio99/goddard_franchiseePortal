import { Injectable } from '@angular/core';
import { SchoolInfoDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class AppAnalyticsService {
    static CONSTANTS = {
        SITE_EDITOR: {
            PUBLISH_CHANGES: 'Site Editor Publish Changes'
        }
    };

    constructor() {
    }

    static login(school: SchoolInfoDto): void {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'login',
            school: school,
        });
    }

    static setSchool(school: SchoolInfoDto): void {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'setSchool',
            school: school
        });
    }



    // pushDataLayerEvent(eventName: string, eventDataPropertyName = 'eventDetail', eventData?: any): void {
    //     window.dataLayer = window.dataLayer || [];

    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     const ev: any = { event: eventName };
    //     if (eventData) {
    //         ev[eventDataPropertyName] = eventData;
    //     }

    //     if (this._appSessionService.school) {
    //         ev['school'] = this._appSessionService.school;
    //     }

    //     window.dataLayer.push(ev);
    // }
}

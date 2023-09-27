import { TestBed } from '@angular/core/testing';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ToursEditorService } from './tours-editor.service';
import { SchoolInfoDto } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { LocalStorageService } from '@shared/utils/local-storage.service';

describe('ToursEditorService', () => {
    let sut : ToursEditorService;

    class AppSessionMock {
        get school(): SchoolInfoDto {
            return {
                crmId: 'abcd',
                fmsId: null,
                advertisingName: null,
                hours: null,
                address: null,
                init: null,
                toJSON: null,
                timeZone: 'Eastern Standard Time',
            };
        }
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DateTimeService,
                AppLocalizationService,
                LocalStorageService,
                { provide: AppSessionService, useClass: AppSessionMock }
            ],
        });

        sut = TestBed.inject(ToursEditorService);
    });
});

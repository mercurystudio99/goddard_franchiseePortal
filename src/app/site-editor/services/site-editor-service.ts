import { Injectable } from '@angular/core';
import { ExtendedSchoolInfoResponse, OriginalAsset } from '@app/shared/common/apis/generated/content';
import { FacultyBios } from '@app/shared/common/apis/generated/faculty';
import { EventTemplate } from '@app/shared/common/apis/generated/school-events';
import { TestimonialDto } from '@shared/service-proxies/service-proxies';
import { BehaviorSubject, Subject } from 'rxjs';
import { Career } from '../../../shared/service-proxies/service-proxies';
import { PostEvents } from '../../../shared/service-proxies/service-proxies';
import { SiteEditorConstants } from '../site-editor.constants';
import { AppServiceBase } from '@app/shared/common/services/app-service-base';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class SiteEditorService extends AppServiceBase {
    public showSpinnerSubject = new Subject<boolean>();
    showSpinnerObservable = this.showSpinnerSubject.asObservable();

    public disableButtonSubject = new Subject<boolean>();
    disableButtonObservable = this.showSpinnerSubject.asObservable();

    public currentFacultySubject = new Subject<FacultyBios>();
    currentFacultyObservable = this.showSpinnerSubject.asObservable();

    public currentTestimonialSubject = new Subject<TestimonialDto>();
    currentTestimonialObservable = this.currentTestimonialSubject.asObservable();

    public currentCareerSubject = new Subject<Career>();
    currentCareerObservable = this.currentTestimonialSubject.asObservable();

    public currentEventCalendarSubject = new Subject<PostEvents>();
    currentEventCalendarObservable = this.currentTestimonialSubject.asObservable();

    public currentAssetsSubject = new BehaviorSubject<OriginalAsset[]>([]);
    currentAssetsObservable = this.currentAssetsSubject.asObservable();

    public currentEventTemplateSubject = new Subject<EventTemplate>();
    currentEventTemplateObservable = this.currentEventTemplateSubject.asObservable();

    public currentSchoolSubject = new Subject<ExtendedSchoolInfoResponse>();
    currentSchoolObservable = this.currentSchoolSubject.asObservable();

    constructor(
        private _appSessionService: AppSessionService,
        private _dateTimeService: DateTimeService
    ) {
        super();
    }

    showSpinner(disable: boolean) {
        this.showSpinnerSubject.next(disable);
    }

    disableButton(disable: boolean) {
        this.disableButtonSubject.next(disable);
    }

    setCurrentFaculty(facultyBios: FacultyBios) {
        this.currentFacultySubject.next(facultyBios);
    }

    setCurrentTestimonial(testimonial: TestimonialDto): void {
        this.currentTestimonialSubject.next(testimonial);
    }

    setCurrentCareer(career: Career): void {
        this.currentCareerSubject.next(career);
    }

    setCurrentEventCalendar(calendarEvent: PostEvents): void {
        this.currentEventCalendarSubject.next(calendarEvent);
    }

    setCurrentAssets(assets: OriginalAsset[]): void {
        this.currentAssetsSubject.next(assets);
    }

    setCurrentEventTemplate(eventTemplate: EventTemplate): void {
        this.currentEventTemplateSubject.next(eventTemplate);
    }

    setCurrentSchool(school: ExtendedSchoolInfoResponse): void {
        this.currentSchoolSubject.next(school);
    }

    refreshPage(execute: boolean) {
        this.$canExecuteSubject.next(execute);
    }

    /**
     * Returns array of renditions to display in the Hero Editor image modal
     * Simplified example from an asset and its renditions:
        {
            "renditions": [
            {
                "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.140.100.png",
                "publishUrl": "https://publish-p24717-e77402.adobeaemcloud.com/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.140.100.png",
            },
            {
                "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.319.319.png",
                "publishUrl": "https://publish-p24717-e77402.adobeaemcloud.com/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.319.319.png",
            },
            {
                "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.1280.1280.png",
                "publishUrl": "https://publish-p24717-e77402.adobeaemcloud.com/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif/_jcr_content/renditions/cq5dam.thumbnail.1280.1280.png",
            }
            ],
            "contentPath": "/content/dam/gsi/default-classroom-images/GS_Classroom_1.tif",
        },
    */
    filterRenditions(
        data: OriginalAsset[],
        renditionSizes: string[] = SiteEditorConstants.heroImageRenditionSizes,
        ext: string = ''
    ): OriginalAsset[] {
        let renditions = new Array<OriginalAsset>();
        let filterByFileExtension = ext ? true : false;
        for (let asset of data) {
            if (asset.renditions) {
                let added = false;

                //loop through image sizes to add the bigest one
                for (let size of renditionSizes) {
                    for (let rendition of asset.renditions) {
                        const extension = ext ? ext : rendition.publishUrl?.split(/[#?]/)[0].split('.').pop().trim();

                        //does not include .tif renditions
                        if (!filterByFileExtension && extension === 'tif') {
                            continue;
                        }

                        if (rendition.publishUrl?.endsWith(size + '.' + extension)) {
                            //20220121: https://dev.azure.com/GoddardSystemsIT/Franchisee%20Business%20Portal/_workitems/edit/13901
                            //Set rendition href same as asset name to filter selected asset by exact name
                            rendition.href = asset.name;

                            /**
                             * storing additional property on rendition since Edit-Hero-Image is using renditions for rendering available images
                                but, the selected carousel uses the asset's path for saving changes.
                             */
                            rendition.properties[SiteEditorConstants.CONTENT_PATH_KEY] = asset.contentPath;
                            renditions.push(rendition);
                            added = true;
                        }
                        //break renditions loop
                        if (added) {
                            break;
                        }
                    }

                    //break image sizes loop
                    if (added) {
                        break;
                    }
                }
            }
        }

        return renditions;
    }

    fillinEnabledDates(maxDates: number): Date[] {
        let dates: Date[] = [];
        let minDate = new Date();
        let maxDate = new Date();
        maxDate.setDate(minDate.getDate() + maxDates);
        while (minDate <= maxDate) {
            dates.push(new Date(minDate));
            minDate.setDate(minDate.getDate() + 1);
        }
        return dates;
    }

    /**
     * replace all characters in the currentValue that exists in the replaceChars with the replaceWith
     * @param currentValue :
     * @param replaceChars
     * @param replaceWith
     * @returns
     */
    replaceAll(currentValue: string, replaceChars: string[], replaceWith: string): string {
        for (let index = 0; index < replaceChars.length; index++) {
            currentValue = currentValue.replace(replaceChars[index], replaceWith);
        }

        return currentValue;
    }

    defaultCalendarEvent(): PostEvents {
        const defaultStartDate = this._dateTimeService.convertLocalDateToUTC(this._dateTimeService.getNextHour());
        // Add an hour for end date
        const defaultEndDate = new Date(defaultStartDate.getTime() + 60 * 60 * 1000);

        const defaults = {
            fmsSchoolId: Number(this._appSessionService.school.fmsId),
            isAllDay: false,
            eventType: 0,
            startDateTime: defaultStartDate,
            endDateTime: defaultEndDate,
            iconFileName: this.currentAssetsSubject.value.find((x) =>
                x.contentPath.includes(SiteEditorConstants.DEFAULT_EVENT_ICON_NAME)
            )?.name,
            recurringParameterPrimary: '',
            publicWebSiteDescription: SiteEditorConstants.PRIMENG_EDITOR_TEXT_WRAPPER,
        };

        return PostEvents.fromJS(defaults);
    }

    defaultEventTemplate(): EventTemplate {
        const defaultStartDate = this._dateTimeService.convertLocalDateToUTC(this._dateTimeService.getNextHour());
        // Add an hour for end date
        const defaultEndDate = new Date(defaultStartDate.getTime() + 60 * 60 * 1000);

        const defaultTemplate: EventTemplate = {
            schoolID: Number(this._appSessionService.school.fmsId),
            iconFileName: this.currentAssetsSubject.value.find((x) =>
                x.contentPath.includes(SiteEditorConstants.DEFAULT_EVENT_ICON_NAME)
            )?.name,
            publicWebsiteDescription: SiteEditorConstants.PRIMENG_EDITOR_TEXT_WRAPPER,
            startTime: null,
            endTime: null,
        };

        return defaultTemplate;
    }
}

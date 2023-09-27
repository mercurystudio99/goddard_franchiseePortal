import { Component, Injector, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PagePreviewComponent } from '../page-preview/page-preview.component';
import { SiteEditorService } from '../services';
import { EditSummerCampInfoComponent } from './edit-summer-camp-info/edit-summer-camp-info.component';
import { EditSummerCampEventsComponent } from './edit-summer-camp-events/edit-summer-camp-events.component';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { catchError, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-edit-summer-camp',
    templateUrl: './edit-summer-camp.component.html',
    styleUrls: ['./edit-summer-camp.component.css'],
    animations: [appModuleAnimation()],
})
export class EditSummerCampComponent extends AppComponentBase implements OnInit, OnDestroy {
    @HostListener('window:resize', ['$event'])
    onResize() {
        this.pagePreview.resizeFrame();
    }
    @ViewChild('pagePreview') pagePreview: PagePreviewComponent;
    @ViewChild('editSummerCampInfoModal') editSummerCampInfoModal: EditSummerCampInfoComponent;
    @ViewChild('editSummerCampEventsModal') editSummerCampEventsModal: EditSummerCampEventsComponent;
    prevEditorPositions = null;
    innerWidth: number = 0;
    constructor(
        injector: Injector,
        private _contentAPI: ContentApiClientFacade,
        private _siteEditorService: SiteEditorService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._contentAPI
            .getSchool(this.appSession.school.crmId)
            .pipe(
                finalize(() => this.spinnerService.hide()),
                catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
            )
            .subscribe((school) => {
                this._siteEditorService.setCurrentSchool(school);
            });

        this.addSubscription(
            this._siteEditorService.$canExecuteObservable.subscribe((refresh: boolean) => {
                if (refresh) {
                    this.pagePreview.loadSchoolSitePage();
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    setEditors(event) {
        if (event) {
            setTimeout(() => {
                // ---- ADDING DUMMY TRIGGER TIDE TO '.cmp-teaser--gsi-header' THIS WILL BW UPDATED LATER
                const editSummerCampInfo = this.pagePreview.getEditingItemInfo('#custom-heading-container')[0];
                this.editSummerCampInfoModal.adjustEditor(editSummerCampInfo);
                // ---- ADDING DUMMY TRIGGER TIDE TO '.cmp-container__background' THIS WILL BW UPDATED LATER
                const editSummerCampEvents = this.pagePreview.getEditingItemInfo('.gsi-asset-list')[0];
                this.editSummerCampEventsModal.adjustEditor(editSummerCampEvents);
            }, 400);
        }
    }

    onSaveSummerCamp(data: any): void {
        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.pagePreview.loadSchoolSitePage();
        });
    }
}

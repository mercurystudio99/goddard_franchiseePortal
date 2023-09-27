import { AppConsts } from '@shared/AppConsts';
import {
    Component,
    Injector,
    ViewChild,
    Output,
    EventEmitter,
    ElementRef,
    OnDestroy,
    OnInit,
    Renderer2,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ExtendedSchoolInfoResponse } from '@app/shared/common/apis/generated/content';
import { SiteEditorService } from '@app/site-editor/services';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import {
    SiteEditorServiceProxy,
    TextComponentUpdateDto,
    TitleComponentUpdateDto,
} from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { combineLatest, ObservableInput } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SummerCampInfo } from './summer-camp-info';
import { Angulartics2 } from 'angulartics2';
import { Editor } from 'primeng/editor';
import { DescriptionLengthValidatorService } from '@shared/utils/description-length-validator.service';
import { GetFromBetweenService } from '@shared/utils/get-from-between.service';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'app-edit-summer-camp-info',
    templateUrl: './edit-summer-camp-info.component.html',
    styleUrls: ['./edit-summer-camp-info.component.css'],
    animations: [appModuleAnimation()],
})
export class EditSummerCampInfoComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('editSummerCampInfoModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('editSummerCampInfoTrigger') editSummerCampInfoTrigger: ElementRef;
    @ViewChild('summerCampInfoForm') summerCampInfoForm: NgForm;
    modalType = ModalType;
    _school: ExtendedSchoolInfoResponse;
    summerCampInfo: SummerCampInfo;
    originalSummerCampInfo: SummerCampInfo;
    maxDescriptionLength = 500;
    @ViewChild('description') editor: Editor;
    descriptionHolder: string;

    constructor(
        injector: Injector,
        private renderer: Renderer2,
        private _siteEditorService: SiteEditorService,
        private _contentAPI: ContentApiClientFacade,
        private _siteEditorServiceProxy: SiteEditorServiceProxy,
        private _angulartics2: Angulartics2,
        private _maxDescriptionValidator: DescriptionLengthValidatorService,
        private _getFromBetween: GetFromBetweenService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.addSubscription(
            this._siteEditorService.currentSchoolObservable.subscribe((school) => {
                this._school = school;
            })
        );
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    openModal() {
        this.spinnerService.show();
        return combineLatest([
            this._contentAPI.getTitleContent(this._school.summerCampPageCustomHeadlineComponentPath),
            this._contentAPI.getTextContent(this._school.summerCampPageCustomDescriptionComponentPath),
        ])
            .pipe(
                finalize(() => this.spinnerService.hide()),
                catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
            )
            .subscribe(([headline, description]) => {
                this.summerCampInfo = { headLine: headline?.title, description: description?.text };

                //Bug #15288: removing wrapping <p> tags that might come from AEM
                // we remove before setting the original summer camp info to not trigger a change warning on save
                this.summerCampInfo.description = description?.text?.trimStart().startsWith(AppConsts.startingPTag)
                    ? this._getFromBetween
                          .getValueFromBetween(description?.text, AppConsts.startingPTag, AppConsts.endingPTag)
                          .join('')
                    : description?.text;

                this.originalSummerCampInfo = { ...this.summerCampInfo };
                this.descriptionHolder = this.summerCampInfo.description;
                this.modal.show();
            });
    }

    close() {
        this.modal.hide();
    }

    closeOrShowDiscardWarning(): void {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.close();
        }
    }

    pendingChanges(): boolean {
        //Compare to validate if changed
        return JSON.stringify(this.summerCampInfo) !== JSON.stringify(this.originalSummerCampInfo);
    }

    public adjustEditor(element): void {
        if (!element) {
            return;
        }
        var elementData = [];
        elementData['height'] = element.offsetHeight + 'px';
        elementData['width'] = element.offsetWidth + 'px';
        elementData['top'] = element.getBoundingClientRect().top + 'px';
        elementData['left'] = element.offsetLeft + 'px';
        this.renderer.setStyle(this.editSummerCampInfoTrigger.nativeElement, 'height', elementData['height']);
        this.renderer.setStyle(this.editSummerCampInfoTrigger.nativeElement, 'width', elementData['width']);
        this.renderer.setStyle(this.editSummerCampInfoTrigger.nativeElement, 'top', elementData['top']);
        this.renderer.setStyle(this.editSummerCampInfoTrigger.nativeElement, 'left', elementData['left']);
        this.renderer.removeClass(this.editSummerCampInfoTrigger.nativeElement, 'd-none');
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        //RESET CHANGES
        this.summerCampInfo = { ...this.originalSummerCampInfo };
        this.closeDiscardChangesModal();
        this.close();
    }

    saveSummerCampInfo() {
        if (!this.pendingChanges()) {
            abp.message.info(this.l('NoPendingChanges'), '');
            return;
        }

        this.summerCampInfoForm.form.markAllAsTouched();
        if (!this.summerCampInfoForm.form.valid) {
            return;
        }

        this._siteEditorService.showSpinner(true);

        combineLatest([
            this._siteEditorServiceProxy.updateSchoolCustomTitle(
                this._school.crmId,
                this._school.summerCampPageCustomHeadlineComponentPath,
                TitleComponentUpdateDto.fromJS({ title: this.summerCampInfo.headLine })
            ),
            this._siteEditorServiceProxy.updateSchoolCustomText(
                this._school.crmId,
                this._school.summerCampPageCustomDescriptionComponentPath,
                TextComponentUpdateDto.fromJS({ text: this.summerCampInfo.description })
            ),
        ])
            .pipe(
                finalize(() => {
                    this._siteEditorService.showSpinner(false);
                })
            )
            .subscribe(
                () => {
                    this.close();
                    this.save.emit(true);
                    // analytics
                    this._angulartics2.eventTrack.next({
                        action: 'Summer Camp Info',
                        properties: {
                            category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                            label: this.appSession.school?.advertisingName,
                        },
                    });
                },
                (error) => {
                    abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                }
            );
    }

    onDescriptionChange(context: any): void {
        if (!context || !context.htmlValue) {
            return;
        }

        let quill = this.editor['valueAccessor']['quill'];

        let description = context.htmlValue;
        if (!this._maxDescriptionValidator.isMaxDescriptionLengthValid(description, this.maxDescriptionLength)) {
            const delta = quill.clipboard.convert(this.descriptionHolder);
            quill.setContents(delta, 'api');

            //this gives some time to allow user to see the message when reached the max characters and then revert it back
            setTimeout(() => {
                this.summerCampInfo.description = this.descriptionHolder;
            }, 2000);
        } else {
            this.descriptionHolder = description;
        }
    }
}

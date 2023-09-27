import { Component, Injector, OnInit, ViewChild, ElementRef, Renderer2, Output, EventEmitter } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { AppComponentBase } from '@shared/common/app-component-base';
import { IframeService } from '@app/shared/common/services/iframe-service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { SiteEditorService } from '@app/site-editor/services';
import { catchError, finalize } from 'rxjs/operators';
import { SiteEditorServiceProxy, TextComponentUpdateDto } from '@shared/service-proxies/service-proxies';
import { ExtendedSchoolInfoResponse, TextComponentDto } from '@app/shared/common/apis/generated/content';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'app-edit-teaser',
    templateUrl: './edit-teaser.component.html',
    styleUrls: ['./edit-teaser.component.css'],
})
export class EditTeaserComponent extends AppComponentBase implements OnInit {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('editHomeTeaserTrigger') editHomeTeaserTrigger: ElementRef;
    @ViewChild('editTeaserModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    modalType = ModalType;
    iframe: ElementRef;
    school: ExtendedSchoolInfoResponse;
    textDto: TextComponentDto;
    originalTextDto: TextComponentDto;
    maxDescriptionLength = 500;

    constructor(
        injector: Injector,
        private iframeService: IframeService,
        private renderer: Renderer2,
        private _contentAPI: ContentApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private _siteEditorServiceProxy: SiteEditorServiceProxy,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        this.iframeService.currentIframe.subscribe((iframe) => {
            this.iframe = iframe;
        });

        this._contentAPI
            .getSchool(this.appSession.school.crmId)
            .pipe(
                catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
            )
            .subscribe((school) => {
                this.school = school;
            });
    }

    openModal(): void {
        this.spinnerService.show();

        this._contentAPI
            .getTextContent(this.school.homePageCustomWelcomeTextComponentPath)
            .pipe(
                finalize(() => this.spinnerService.hide()),
                catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
            )
            .subscribe((response) => {
                this.textDto = response;
                this.originalTextDto = TextComponentUpdateDto.fromJS({ ...this.textDto });
                this.modal.show();
            });
    }

    close(): void {
        this.modal.hide();
    }

    showDiscardChangesModal(): void {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.close();
        }
    }

    pendingChanges(): boolean {
        //Compare to validate if changed
        return this.textDto?.text !== this.originalTextDto?.text;
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        this.textDto = { ...this.originalTextDto };
        this.closeDiscardChangesModal();
        this.close();
    }

    saveTeaser(): void {
        this._siteEditorService.showSpinner(true);

        this._siteEditorServiceProxy
            .updateSchoolCustomText(
                this.school.crmId,
                this.school.homePageCustomWelcomeTextComponentPath,
                TextComponentUpdateDto.fromJS({ ...this.textDto })
            )
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
                        action: 'Home Page Custom Welcome Text',
                        properties: {
                            category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                            label: this._appSessionService.school?.advertisingName,
                        },
                    });
                },
                (error) => {
                    abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                }
            );
    }

    adjustEditor(element) {
        if (!element) {
            return [];
        }
        var elementData = [];
        elementData['height'] = element.offsetHeight + 'px';
        elementData['width'] = element.offsetWidth + 'px';
        elementData['top'] = element.getBoundingClientRect().top + 'px';
        elementData['left'] = element.offsetLeft + 'px';
        this.renderer.setStyle(this.editHomeTeaserTrigger.nativeElement, 'height', elementData['height']);
        this.renderer.setStyle(this.editHomeTeaserTrigger.nativeElement, 'width', elementData['width']);
        this.renderer.setStyle(this.editHomeTeaserTrigger.nativeElement, 'top', elementData['top']);
        this.renderer.setStyle(this.editHomeTeaserTrigger.nativeElement, 'left', elementData['left']);
        this.renderer.removeClass(this.editHomeTeaserTrigger.nativeElement, 'd-none');
    }
}

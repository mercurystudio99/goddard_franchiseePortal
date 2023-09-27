import { EventEmitter, Output, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Component, Injector, OnInit } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { IconCard, ExtendedSchoolInfoResponse } from '@app/shared/common/apis/generated/content';
import { ContentApiClientFacade } from '@shared/service-proxies/content-api-client-facade';
import { IframeService } from '@app/shared/common/services/iframe-service';
import { catchError, finalize } from 'rxjs/operators';
import { SiteEditorService } from '@app/site-editor/services';
import { environment } from '../../../../environments/environment';
import { SaveIconCardsInput, SiteEditorServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { combineLatest, of, Observable } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'app-edit-home-page-cards',
    templateUrl: './edit-home-page-cards.component.html',
    styleUrls: ['./edit-home-page-cards.component.css'],
})
export class EditHomePageCardsComponent extends AppComponentBase implements OnInit {
    @Output() save: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('editCardModal', { static: true }) modal: ModalDirective;
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('editCardsTrigger') editCardsTrigger: ElementRef;
    modalType = ModalType;
    iframe: ElementRef;
    iframeImageContainer: ElementRef;
    originalSelectedSchoolCardsIds: Array<{ alternateName: string }> = Array();
    selectedSchoolCardsIds: Array<{ alternateName: string }> = Array();
    availableIconCards: IconCard[] = null;
    selectedIconCards: IconCard[] = [];
    draggedCardID: string = null;
    maxSelectableCards: number = 4;
    maxCarouselCards: number = 4;
    _school: ExtendedSchoolInfoResponse;
    showVirtualTour = true;
    validatedVirtualTour = false; //to prevent extra ajax calls validating virtual tour page since it is unlikely to change often
    requestSubject: String = this.l('HomePageIconRequestSubject');
    tooltips = AppConsts.TOOLTIPS;

    constructor(
        injector: Injector,
        private renderer: Renderer2,
        private iframeService: IframeService,
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

        //Adjust Subject for Petition Email based on Env
        if (!environment.production) {
            let envPrefix = environment.dev ? '[DEV]' : '[STAGE]';
            this.requestSubject = envPrefix + ' ' + this.requestSubject;
        }
    }

    openEditModal() {
        //Clear up selectedIconCards
        this.selectedIconCards = [];
        this.spinnerService.show('content');

        this.addSubscription(
            combineLatest([
                this._contentAPI.getSchool(this.appSession.school.crmId),
                this._contentAPI.getAvailableIconCards(),
            ])
                .pipe(
                    finalize(() => this.spinnerService.hide('content')),
                    catchError(() => abp.message.error(this.l('AnErrorOccurred'), this.l('Error')))
                )
                .subscribe(([school, cards]) => {
                    this._school = school;
                    if (this.validatedVirtualTour) {
                        return;
                    }

                    this._contentAPI
                        .validatePageExistsObservable(
                            this._contentAPI.getPageLinkFromSchoolScheduleTourUrl(
                                school?.scheduleTourUrl,
                                AppConsts.virtualToursPageAlias
                            )
                        )
                        .pipe(
                            finalize(() => {
                                //on complete, set up icon cards and open modal
                                this.setupIconCards(cards, school);
                                this.open();
                            })
                        )
                        .subscribe(
                            (response: boolean) => {
                                this.showVirtualTour = response;
                                this.validatedVirtualTour = true;
                            },
                            (err): void => {
                                this.showVirtualTour = false;
                                console.error(err);
                            }
                        );
                })
        );
    }

    /**
     * setup cards state variables
     * @param cards global available school cards
     * @param school
     */
    private setupIconCards(cards: IconCard[], school: ExtendedSchoolInfoResponse) {
        if (school.iconCardsJson) {
            this.originalSelectedSchoolCardsIds = JSON.parse(school.iconCardsJson);
            this.selectedSchoolCardsIds = JSON.parse(school.iconCardsJson);
        }
        this.availableIconCards = cards.filter((x) => x.alternateName);
        if (!this.showVirtualTour) {
            this.availableIconCards = this.availableIconCards.filter((x) => x.alternateName !== 'virtual-tours');
        }

        const invalidIconCards = cards.filter((x) => !x.alternateName);
        if (invalidIconCards.length) {
            console.error('**[Icon Cards removed due to invalid alternateName]**: ' + JSON.stringify(invalidIconCards));
        }
        this.availableIconCards.forEach((c) => {
            c.imageReference = environment.schoolBaseSiteUrl + c.imageReference;
        });

        //Using simple for-loop instead of filter function
        //to ensure selectedIconCards are ordered same as the selectedSchoolCardsIds
        for (let alternateName of this.selectedSchoolCardsIds) {
            for (let iconCard of this.availableIconCards) {
                if (alternateName.alternateName === iconCard.alternateName) {
                    this.selectedIconCards.push(iconCard);
                }
            }
        }

        //Remove the cards above the maxSelectableCards
        if (this.selectedIconCards.length > this.maxSelectableCards) {
            this.selectedIconCards = this.selectedIconCards.splice(
                this.maxSelectableCards,
                this.selectedIconCards.length - this.maxSelectableCards
            );
        }

        //Fill the array up to the maxSelectableCards to show as many drop boxes
        if (this.selectedIconCards.length < this.maxSelectableCards) {
            //there could be no cards, so it would just show the first 4 cards in the UI/AEM control
            //if we get less than 4 back, the last 4 - x cards can be picked in order from 1, 2, etc...
            let cardsToComplete = this.maxSelectableCards - this.selectedIconCards.length;

            let cards = this.availableIconCards
                .filter((item) => !this.selectedSchoolCardsIds.some((x) => x.alternateName === item.alternateName))
                .slice(0, cardsToComplete);

            for (let i = 0; i < cards.length; i++) {
                this.selectedIconCards.push(cards[i]);
            }
        }

        //Update the selected Card IDs
        this.selectedSchoolCardsIds = [];
        for (let iconCard of this.selectedIconCards) {
            this.selectedSchoolCardsIds.push({ alternateName: iconCard.alternateName });
        }
    }

    open() {
        this.modal.show();
    }

    close() {
        this.modal.hide();
    }

    closeOrShowDiscardWarning() {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.modal.hide();
        }
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
    }

    discardChanges() {
        this.modal.hide();
        this.discardModal.hide();
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
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'height', elementData['height']);
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'width', elementData['width']);
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'top', elementData['top']);
        this.renderer.setStyle(this.editCardsTrigger.nativeElement, 'left', elementData['left']);
        this.renderer.removeClass(this.editCardsTrigger.nativeElement, 'd-none');
    }

    dropSortCards(cardSpot) {
        let selectedCardID = this.draggedCardID;
        let selectedCardIndex;
        let selectedCard = this.selectedIconCards.find((item, index) => {
            selectedCardIndex = index;
            if (item) {
                return item.alternateName === selectedCardID;
            } else {
                return false;
            }
        });
        let cardOnSpot = this.selectedIconCards[cardSpot];
        this.selectedIconCards[cardSpot] = selectedCard;
        this.selectedSchoolCardsIds[cardSpot] = { alternateName: selectedCard.alternateName };
        this.selectedIconCards[selectedCardIndex] = cardOnSpot;
        this.selectedSchoolCardsIds[selectedCardIndex] = { alternateName: cardOnSpot.alternateName };
        this.animatedDroppedCard(selectedCardID);
    }

    dropNewCard(cardSpot) {
        let newCardID = this.draggedCardID;
        let selectedCard = this.availableIconCards.find((item) => {
            return item.alternateName === newCardID;
        });

        if (!this.selectedIconCards.some((x) => x.alternateName === selectedCard.alternateName)) {
            this.selectedIconCards[cardSpot] = selectedCard;
            this.selectedSchoolCardsIds[cardSpot] = { alternateName: selectedCard.alternateName };
            this.animatedDroppedCard(newCardID);
        } else {
            this.dropSortCards(cardSpot);
        }
    }

    dragStart(e: Event, homePageCard) {
        let target = e.currentTarget as HTMLTextAreaElement;
        let cardID = homePageCard.alternateName;
        this.renderer.addClass(target, 'opacity-0');
        this.draggedCardID = cardID;
    }

    dragEnd(e: Event, homePageCard) {
        this.renderer.removeClass(e.currentTarget, 'opacity-0');
        this.draggedCardID = null;
    }

    animatedDroppedCard(cardId) {
        setTimeout(() => {
            let allCards = document.querySelectorAll('.gsi-home-page-cards [data-card-id]');
            let card = document.querySelectorAll('.gsi-home-page-cards [data-card-id="' + cardId + '"]')[0];
            allCards.forEach((item) => {
                this.renderer.removeClass(item, 'dropped');
            });

            this.renderer.addClass(card, 'dropped');
        }, 50);
    }

    pendingChanges(): boolean {
        return JSON.stringify(this.selectedSchoolCardsIds) !== JSON.stringify(this.originalSelectedSchoolCardsIds);
    }

    saveIconCards(): void {
        this._siteEditorService.showSpinner(true);
        this._siteEditorServiceProxy
            .updateSchoolIconCards(
                this.appSession.school.crmId,
                SaveIconCardsInput.fromJS({ iconCardsJson: JSON.stringify(this.selectedSchoolCardsIds) })
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
                        action: 'Home Page Icon Cards',
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
}

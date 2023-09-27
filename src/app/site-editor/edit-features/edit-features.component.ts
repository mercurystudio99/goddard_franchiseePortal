import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { FeaturesApiClientFacade } from '@shared/service-proxies/features-api-client-facade';
import { Feature } from '@app/shared/common/apis/generated/features';
import { combineLatest, Observable } from 'rxjs';
import { SiteEditorService } from '../services/site-editor-service';
import { finalize, map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AppAnalyticsService } from '@shared/common/analytics/app-analytics.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { IDeactivateComponent } from '@shared/utils/deactivate-guard.service';
import {
    GoddardConfirmationModalComponent,
    ModalType,
} from '@app/shared/common/goddard-confirmation-modal/goddard-confirmation-modal.component';

@Component({
    selector: 'app-edit-features',
    templateUrl: './edit-features.component.html',
    styleUrls: ['./edit-features.component.css'],
})
export class EditFeaturesComponent extends AppComponentBase implements OnInit, OnDestroy, IDeactivateComponent {
    @ViewChild('discardChangesModal', { static: true }) discardModal: GoddardConfirmationModalComponent;
    @ViewChild('noChangesModal', { static: true }) noChangesModal: GoddardConfirmationModalComponent;
    modalType = ModalType;
    //General available features
    allFeatures: Feature[] = [];
    subFeatures: Feature[] = [];
    //shoool features to allow validating if user changed any selected shool feature
    initiallySelectedSchoolFeatures: Feature[] = [];
    //Selected shool features
    selectedSchoolFeatureIDs: string[] = [];
    initiallySelectedSchoolFeatureIDs: string[] = [];
    throwApiError: boolean | undefined = false;

    constructor(
        injector: Injector,
        private _featuresClientFacade: FeaturesApiClientFacade,
        private _siteEditorService: SiteEditorService,
        private activatedRoute: ActivatedRoute,
        private _angulartics2: Angulartics2,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        this.getFeatures();
        if (!environment.production) {
            this.activatedRoute.queryParams.subscribe((params) => {
                this.throwApiError = Boolean(params['throwApiError']);
            });
        }
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSubscriptionsAndHideSpinner();
    }

    getFeatures(): void {
        this.spinnerService.show('content');

        this.addSubscription(
            combineLatest([
                this._featuresClientFacade.getAllFeatures(),
                this._featuresClientFacade.getSchoolFeatures(new Array(this.appSession.school.crmId)),
            ])
                .pipe(finalize(() => this.spinnerService.hide('content')))
                .subscribe(
                    ([allFeatures, schoolFeatures]) => {
                        this.allFeatures = allFeatures?.filter((x) => !x.parentProgramId);
                        this.allFeatures = this.allFeatures?.sort(function (a, b) {
                            return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
                        });

                        this.subFeatures = allFeatures?.filter((x) => x.parentProgramId);

                        this.initiallySelectedSchoolFeatures = this.allFeatures?.slice();
                        this.selectedSchoolFeatureIDs = [
                            ...new Set(
                                schoolFeatures?.map(function (a) {
                                    return a.alternateId;
                                })
                            ),
                        ];
                        this.initiallySelectedSchoolFeatureIDs = this.selectedSchoolFeatureIDs?.slice();
                    },
                    (error) => {
                        console.log(error);
                        abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                    }
                )
        );
    }

    selectFeature(feature: Feature): void {
        const alternateId = feature.alternateId;
        let index = this.selectedSchoolFeatureIDs.indexOf(alternateId);
        if (index !== -1) {
            this.selectedSchoolFeatureIDs.splice(index, 1);

            let subfeatures = this.getSubfeatures(feature);
            // If we remove a parent feature we also need to remove its subfeatures
            for (let i = 0; i < subfeatures.length; i++) {
                let subFeature = subfeatures[i];
                let index = this.selectedSchoolFeatureIDs.indexOf(subFeature.alternateId);
                if (index !== -1) {
                    this.selectedSchoolFeatureIDs.splice(index, 1);
                }
            }
        } else {
            this.selectedSchoolFeatureIDs.push(alternateId);
        }
    }

    saveFeatures(): void {
        if (this.pendingChanges()) {
            this._siteEditorService.showSpinner(true);

            this._featuresClientFacade
                .saveSchoolFeatures(this.appSession.school.crmId, this.selectedSchoolFeatureIDs, this.throwApiError)
                .pipe(
                    finalize(() => {
                        this._siteEditorService.showSpinner(false);
                    })
                )
                .subscribe(
                    (response) => {
                        this.initiallySelectedSchoolFeatureIDs = this.selectedSchoolFeatureIDs?.slice();

                        // analytics
                        this._angulartics2.eventTrack.next({
                            action: 'Features',
                            properties: {
                                category: AppAnalyticsService.CONSTANTS.SITE_EDITOR.PUBLISH_CHANGES,
                                label: this._appSessionService.school?.advertisingName,
                            },
                        });

                        //Show success message
                        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
                            // Do nothing
                        });
                    },
                    (error) => {
                        console.log(error);
                        abp.message.error(this.l('Error_Update_Msg'), this.l('Error_Update_Title'));
                    }
                );
        } else {
            abp.message.info('', this.l('NoChangesMade'));
        }
    }

    isFeatureSelected(alternateId: string): boolean {
        return this.selectedSchoolFeatureIDs?.some((x) => x === alternateId);
    }

    showDiscardChangesModal(): void {
        if (this.pendingChanges()) {
            this.discardModal.show();
        } else {
            this.noChangesModal.show();
        }
    }

    pendingChanges(): boolean {
        //Order the initial and selected list of features
        this.selectedSchoolFeatureIDs = this.selectedSchoolFeatureIDs.sort(function (a, b) {
            return a.localeCompare(b);
        });
        this.initiallySelectedSchoolFeatureIDs = this.initiallySelectedSchoolFeatureIDs.sort(function (a, b) {
            return a.localeCompare(b);
        });

        //Compare to validate if changed
        return JSON.stringify(this.selectedSchoolFeatureIDs) !== JSON.stringify(this.initiallySelectedSchoolFeatureIDs);
    }

    noChanges() {
        this.noChangesModal.hide();
    }

    closeDiscardChangesModal() {
        this.discardModal.hide();
        this._siteEditorService.execute(false);
    }

    discardChanges() {
        this.resetFeatures();
        this.discardModal.hide();
        this._siteEditorService.execute(true);
    }

    resetFeatures(): void {
        this.allFeatures = this.initiallySelectedSchoolFeatures.slice();
        this.selectedSchoolFeatureIDs = this.initiallySelectedSchoolFeatureIDs.slice();
    }

    getSubfeatures(feature: Feature): Feature[] {
        return this.subFeatures.filter((x) => x.parentProgramId === feature.id && x.type === feature.type);
    }

    /**
     * implements IDeactivateComponent to handle user's confirmation for discarding user's changes and navigate from component
     * @returns true if there no unsaved changes or user's selection on wheter to discard changes or not
     */
    public canExit(): Observable<boolean> | Promise<boolean> | boolean {
        var pendingChanges = this.pendingChanges();
        if (pendingChanges) {
            this.discardModal.show();
        }
        return pendingChanges
            ? this._siteEditorService.$canExecuteSubject.pipe(
                  map((result) => {
                      return result;
                  }),
                  finalize(() => {})
              )
            : true;
    }

    featureToolTip(categoryOrFeatureName: string): string {
        return AppConsts.FEATURE_CATEGORY_TOOLTIP[categoryOrFeatureName];
    }
}

import { AppConsts } from '@shared/AppConsts';
import { Component, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    InsightsServiceProxy,
    InsightDto,
    GetInsightForViewDto,
    CreateOrEditInsightDto,
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditInsightModalComponent } from './create-or-edit-insight-modal.component';

import { ViewInsightModalComponent } from './view-insight-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { LazyLoadEvent } from 'primeng/api';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { filter as _filter } from 'lodash-es';
import { DateTime } from 'luxon';

import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './insights.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
})
export class InsightsComponent extends AppComponentBase {
    @ViewChild('createOrEditInsightModal', { static: true })
    createOrEditInsightModal: CreateOrEditInsightModalComponent;
    @ViewChild('viewInsightModalComponent', { static: true }) viewInsightModal: ViewInsightModalComponent;

    @ViewChild('dataTable', { static: true }) dataTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    advancedFiltersAreShown = false;
    filterText = '';
    dateFormat = 'MM/dd/yyyy hh:mm';
    defaultSorting = 'SortOrder ASC';

    constructor(
        injector: Injector,
        private _insightsServiceProxy: InsightsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    getInsights(event?: LazyLoadEvent) {
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.primengTableHelper.showLoadingIndicator();
        let sorting = this.primengTableHelper.getSorting(this.dataTable);
        if (!sorting) {
            sorting = this.defaultSorting;
        }

        this._insightsServiceProxy
            .getAll(
                this.filterText,
                sorting,
                this.primengTableHelper.getSkipCount(this.paginator, event),
                this.primengTableHelper.getMaxResultCount(this.paginator, event)
            )
            .subscribe((result) => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items;
                this.primengTableHelper.hideLoadingIndicator();
            });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    createInsight(): void {
        this.createOrEditInsightModal.show();
    }

    deleteInsight(insight: InsightDto): void {
        this.message.confirm('', this.l('AreYouSure'), (isConfirmed) => {
            if (isConfirmed) {
                this._insightsServiceProxy.delete(insight.id).subscribe(() => {
                    this.reloadPage();
                    this.notify.success(this.l('SuccessfullyDeleted'));
                });
            }
        });
    }

    onReorderInsight(reorderEvent: { dragIndex: number; dropIndex: number }): void {
        if (reorderEvent.dropIndex !== reorderEvent.dragIndex) {
            let insightViewDto = this.primengTableHelper.records[reorderEvent.dropIndex] as GetInsightForViewDto;
            let body = CreateOrEditInsightDto.fromJS({
                ...insightViewDto.insight,
                sortOrder: reorderEvent.dropIndex + 1,
            });
            console.log(body);

            this.primengTableHelper.showLoadingIndicator();
            this._insightsServiceProxy
                .createOrEdit(CreateOrEditInsightDto.fromJS(body))
                .pipe(
                    finalize(() => {
                        this.primengTableHelper.hideLoadingIndicator();
                    })
                )
                .subscribe(() => {
                    abp.message.success(this.l('SavedSuccessfully'), this.l('Success_Update_Title')).then(() => {
                        this.reloadPage();
                    });
                });
        }
    }
}

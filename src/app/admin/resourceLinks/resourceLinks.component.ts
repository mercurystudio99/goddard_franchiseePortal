import { AppConsts } from '@shared/AppConsts';
import { Component, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceLinksServiceProxy, ResourceLinkDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditResourceLinkModalComponent } from './create-or-edit-resourceLink-modal.component';

import { ViewResourceLinkModalComponent } from './view-resourceLink-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { LazyLoadEvent } from 'primeng/api';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { filter as _filter } from 'lodash-es';
import { DateTime } from 'luxon';

import { DateTimeService } from '@app/shared/common/timing/date-time.service';

@Component({
    selector: 'app-resource-links',
    templateUrl: './resourceLinks.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
})
export class ResourceLinksComponent extends AppComponentBase {
    @ViewChild('createOrEditResourceLinkModal', { static: true })
    createOrEditResourceLinkModal: CreateOrEditResourceLinkModalComponent;
    @ViewChild('viewResourceLinkModalComponent', { static: true })
    viewResourceLinkModal: ViewResourceLinkModalComponent;

    @ViewChild('dataTable', { static: true }) dataTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    advancedFiltersAreShown = false;
    filterText = '';
    textFilter = '';
    urlFilter = '';
    iconFilter = '';

    constructor(
        injector: Injector,
        private _resourceLinksServiceProxy: ResourceLinksServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService,
        private _dateTimeService: DateTimeService
    ) {
        super(injector);
    }

    getResourceLinks() {
        this.primengTableHelper.showLoadingIndicator();

        this._resourceLinksServiceProxy
            .getAll(undefined, undefined, undefined, undefined, undefined, 0, 100)
            .subscribe((result) => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items;
                this.primengTableHelper.hideLoadingIndicator();
            });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    createResourceLink(): void {
        this.createOrEditResourceLinkModal.show();
    }

    deleteResourceLink(resourceLink: ResourceLinkDto): void {
        this.message.confirm('', this.l('AreYouSure'), (isConfirmed) => {
            if (isConfirmed) {
                this._resourceLinksServiceProxy.delete(resourceLink.id).subscribe(() => {
                    this.reloadPage();
                    this.notify.success(this.l('SuccessfullyDeleted'));
                });
            }
        });
    }
}

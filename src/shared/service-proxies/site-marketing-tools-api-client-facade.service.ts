import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetSitePageOutput, SiteMarketingToolEditorServiceServiceProxy } from './service-proxies';

@Injectable({ providedIn: 'root' })
export class SiteMarketingToolsApiClientFacade {
    constructor(private _siteMarketingToolProxy: SiteMarketingToolEditorServiceServiceProxy) {}

    public getMarketingTool(pageName: string | undefined): Observable<GetSitePageOutput> {
        return this._siteMarketingToolProxy.getMarketingTool(pageName);
    }
}

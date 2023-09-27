import { environment } from 'environments/environment';
import { Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ExtendedSchoolInfoResponse } from '../apis/generated/content';
import { TooltipServiceProxy, TooltipDto } from '@shared/service-proxies/service-proxies';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'goddard-tooltip',
    templateUrl: './goddard-tooltip.component.html',
    styleUrls: ['./goddard-tooltip.component.css'],
})
export class GoddardTooltipComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Input() toolTipPath: string;
    school: ExtendedSchoolInfoResponse;
    tooltipDto: TooltipDto;

    constructor(injector: Injector, private _tooltipAppService: TooltipServiceProxy) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.appSession?.school) {
            return;
        }

        this.getToolTip();
    }

    getToolTip(): void {
        if (!this.toolTipPath) {
            return;
        }

        this._tooltipAppService.getTooltip(this.toolTipPath).subscribe(
            (response) => {
                this.tooltipDto = response;
                //prepend the school base url to the images and videos relative paths
                for (let index = 0; index < this.tooltipDto.images?.length; index++) {
                    this.tooltipDto.images[index] = `${environment.schoolBaseSiteUrl}${this.tooltipDto.images[index]}`;
                }
                for (let index = 0; index < this.tooltipDto.videos?.length; index++) {
                    this.tooltipDto.videos[index] = `${environment.schoolBaseSiteUrl}${this.tooltipDto.videos[index]}`;
                }
            },
            (err): void => {
                console.error(err);
            }
        );
    }

    /**
     * check to see if there tooltip have content
     * @returns true if there is something to show, false if not
     */
    isAvailableContent(): boolean {
        if (!this.tooltipDto) {
            return false;
        }

        return (
            this.tooltipDto.title?.length > 0 ||
            this.tooltipDto.subtitle?.length > 0 ||
            this.tooltipDto.description?.length > 0 ||
            this.tooltipDto.images?.length > 0 ||
            this.tooltipDto.videos?.length > 0
        );
    }
}

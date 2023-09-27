import { CreateTourInput, TourStatus, UpdateTourInput } from '@shared/service-proxies/service-proxies';
import { DateTime } from 'luxon';
import { TourItemDto, ITourItemDto } from '../../../shared/service-proxies/service-proxies';

export class TourItemDtoExt extends TourItemDto {

    guideId: string;

    constructor(data: Partial<ITour>) {
        super();
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
            }
        }
        // Copy directly from dto, otherwise get it from the guide object
        this.guideId = data.guideId ? data.guideId : (<any>data)?.guide?.id;
    }

    public equalsStringify(tour: TourItemDtoExt | UpdateTourInput | CreateTourInput): boolean {
        return JSON.stringify(tour) === JSON.stringify(this);
    }

    // public equalsStringify(tour: UpdateTourInput): boolean {
    //     return JSON.stringify(tour) === JSON.stringify(this);
    // }

    public equals(tour: TourItemDtoExt | UpdateTourInput | CreateTourInput): boolean {
        return (
            this.guideId === tour.guideId &&
            this.classRoom === tour.classRoom &&
            this.notes === tour.notes &&
            this.isSameTime(tour)
        );
    }

    public isSameTime(tour: TourItemDtoExt | UpdateTourInput | CreateTourInput): boolean {
        return (
            tour.startDateTime.toMillis() === this.startDateTime.toMillis() &&
            tour.endDateTime.toMillis() === this.endDateTime.toMillis()
        );
    }

    public isScheduled(): boolean {
        return this.status === TourStatus.Scheduled;
    }

    public isNew(): boolean {
        return this.id === undefined;
    }

    public markViewed() : void {
        this.viewed = DateTime.now();
    }
}

export interface ITour extends ITourItemDto {
    guideId: string;
}

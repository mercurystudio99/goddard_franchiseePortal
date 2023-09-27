import { DateTime } from 'luxon';
import { TourStatus, TourType } from '@shared/service-proxies/service-proxies';
import { startCase } from 'lodash-es';
import { ToursEditorConstants } from '../tours-editor-constants';

export interface IFindToursInput {
    schoolId: string;
    //status?: TourStatus | undefined;

    /**
     * Date and time in UTC
     */
    startDate?: DateTime | undefined;
    /**
     * Date and time in UTC
     */
    endDate?: DateTime | undefined;
    // type?: TourType | undefined;
    // guideName?: string | undefined;
    leadName?: string | undefined;
    childAge?: number | undefined;
    leadStartDate?: DateTime | undefined;
    leadEndDate?: DateTime | undefined;
    programsOfInterest?: string[] | undefined;
    statuses?: TourStatus[] | undefined;
    types?: TourType[] | undefined;
    guideIds?: string[] | undefined;
    sortField?: string | undefined;
    sortOrder?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    tourRangeDatesSelected?: boolean;
    filterByTourStartDateOption?: string;

    preferredRangeDatesSelected?: boolean;
    filterByPreferredStartDateOption?: string;

    tourRangeDatesDuration?: number;
    leadPreferredRangeDuration?: number;

    isStatusSelected(value: TourStatus): boolean;
    isGuideSelected(value: string): boolean;
    isTypeSelected(value: TourType): boolean;

    addOrRemoveGuide(add: boolean, value: string): void;
    getTransformedSortingField(
        status: TourStatus
    ): string;
}

export class FindToursInput implements IFindToursInput {
    schoolId: string;
    startDate?: DateTime | undefined;
    endDate?: DateTime | undefined;
    leadName?: string | undefined;
    childAge?: number | undefined;
    leadStartDate?: DateTime | undefined;
    leadEndDate?: DateTime | undefined;
    programsOfInterest?: string[] | undefined;
    statuses?: TourStatus[] | undefined;
    types?: TourType[] | undefined;
    guideNames?: string[] | undefined;

    tourRangeDatesSelected?: boolean;
    filterByTourStartDateOption?: string;
    preferredRangeDatesSelected?: boolean;
    filterByPreferredStartDateOption?: string;
    tourRangeDatesDuration?: number;
    leadPreferredRangeDuration?: number;
    sortField?: string | undefined;
    sortOrder?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;

    constructor(data?: IFindToursInput) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property)) (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    static fromJS(data: any): FindToursInput {
        data = typeof data === 'object' ? data : {};
        let result = new FindToursInput(data);
        return result;
    }

    static default(schoolId: string, status?: TourStatus): FindToursInput {
        return this.fromJS(
            { 
                schoolId: schoolId, 
                statuses: [status], 
                sortOrder: 1, 
                sortField: 'Newest ASC', 
                page: 1, 
                pageSize:10,
                first: 1});
    }

    isStatusSelected(value: TourStatus): boolean {
        return this.statuses?.some((x) => x === value);
    }

    isGuideSelected(value: string): boolean {
        return this.guideNames?.some((x) => x === value);
    }

    isTypeSelected(value: TourType): boolean {
        return this.types?.some((x) => x === value);
    }

    addOrRemoveGuide(add: boolean, value: string): void {
        if (add && !this.guideNames.some((x) => x === value)) {
            this.guideNames.push(value);
        } else {
            this.guideNames = this.guideNames.filter((x) => x !== value);
        }
    }

    /**
     * Transform and assign a field name from the tours grid to the correspondent valid value on the model
     * @param sortingField
     * @returns
     */
    getTransformedSortingField (
        status: TourStatus = TourStatus.Scheduled
    ): string {
        let sortingField =
            this.sortField !== undefined
                ? this.sortField
                : status === TourStatus.Scheduled
                ? ToursEditorConstants.DEFAULT_SORTING_SCHEDULED_TOURS.replace('DESC', '').replace('ASC', '')
                : ToursEditorConstants.DEFAULT_SORTING_COMPLETED_TOURS.replace('DESC', '').replace('ASC', '');

        let sortingDirection = this.sortOrder > 0 ? 'ASC' : 'DESC';

        return `${startCase(sortingField).replace(/\s/g, '')} ${sortingDirection}`
            .replace('Guide', 'Guide.')
            .replace('Lead', 'Lead.');
    }
}

import { DateTimeService } from "@app/shared/common/timing/date-time.service";
import { DateAvailabilityBlockDto, IDateAvailabilityBlockDto, TourTypesEnum1 } from "@shared/service-proxies/service-proxies";
import { DateObjectUnits, DateTime } from "luxon";

/**
 * Extends DateAvailabilityBlockDto for UI purposes
 */
export class DateAvailabilityBlockDtoEx extends DateAvailabilityBlockDto {

    selected = true;

    constructor(data?: Partial<DateAvailabilityBlockDtoEx> & IDateAvailabilityBlockDto) {
        super(data);
    }

    get startTimeAsString() {
        const result = this.toTimeString(this.startTime);
        return result;
    }

    set startTimeAsString(value: string) {
        this.startTime = this.startTime.set(this.parseTime(value));
    }

    get endTimeAsString() {
        const result = this.toTimeString(this.endTime);
        return result;
    }

    set endTimeAsString(value: string) {
        this.endTime = this.endTime.set(this.parseTime(value));
    }

    /**
     * Changes startTime to new time and adjusts end time based on validDuration if necessary
     *
     * Returns false if newTime cause an invalid multiple of validDuration
     * @param newTime
     * @param validDuration
     * @returns
     */
    changeStartTime(newTimeAsString: string, validDuration: number): boolean {

        const previous = this.startTime;
        this.startTimeAsString = newTimeAsString;

        if (this.startTime >= this.endTime) {
            // New start time is on or after current end time

            // Move end time to new start time + validDuration
            this.endTime = this.startTime.plus({
                minutes: validDuration
            });

            return true;
        }

        // Check if new start time gives a multiple of validDuration
        const isValid = DateTimeService._isMinuteDifferenceInMultipleOf(
            this.startTimeAsString,
            this.endTimeAsString,
            validDuration
        );

        if (isValid) {
            // New start time is fine
            return true;
        }

        // New time span is not a multiple of validDuration

        // Adjust end time to be valid multiple of validDuration

        if (this.startTime > previous) {
            // New start time is later than previous

            // Move end time by 30 mins later
            this.endTime = this.endTime.plus({
                minutes: 30
            });
        }
        else {
            // New start time is earlier than previous

            // Move end time by 30 mins earlier
            this.endTime = this.endTime.minus({
                minutes: 30
            });
        }

        return false;
    }

    /**
     * Changes endTime to new time and adjusts start time based on validDuration if necessary
     *
     * Returns false if newTime cause an invalid multiple of validDuration
     * @param newTimeAsString
     * @param validDuration
     * @returns
     */
    changeEndTime(newTimeAsString: string, validDuration: number): boolean {

        const previous = this.endTime;
        this.endTimeAsString = newTimeAsString;

        if (this.endTime <= this.startTime) {
            // New end time is on or before current start time

            // Move start time to new end time - validDuration
            this.startTime = this.startTime.minus({
                minutes: validDuration
            });

            return true;
        }

        // Check if new end time gives a multiple of validDuration
        const isValid = DateTimeService._isMinuteDifferenceInMultipleOf(
            this.startTimeAsString,
            this.endTimeAsString,
            validDuration
        );

        if (isValid) {
            // New end time is fine
            return true;
        }

        // New time span is not a multiple of tour duration

        // Adjust start time to be valid multiple of tour duration

        if (this.endTime > previous) {
            // New end time is later than previous

            // Move start time by 30 mins later
            this.startTime = this.startTime.plus({
                minutes: 30
            });
        }
        else {
            // New end time is earlier than previous

            // Move start time by 30 mins earlier
            this.startTime = this.startTime.minus({
                minutes: 30
            });
        }

        return false;
    }

    hasTourType(tourType: TourTypesEnum1): boolean {
        return this.tourTypes?.includes(tourType);
    }

    private parseTime(time: string): DateObjectUnits {
        const result ={
            hour: parseInt(time.split(':')[0], 10),
            minute: parseInt(time.split(':')[1], 10),
        };
        return result;
    }

    private toTimeString(value: DateTime) {
        const result = DateTimeService._getTime(value, false, true)
        return result;
    }
}

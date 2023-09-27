import { DateTime } from 'luxon';

export class ScheduledToursTimeSlot {
    startDateTime!: DateTime;
    endDateTime!: DateTime;
    bookedTours!: number;
}

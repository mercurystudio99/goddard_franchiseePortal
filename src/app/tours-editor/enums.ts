export enum CompleteTourOption {
    ASAP = 'ASAP',
    SixMonths = 'In6Months',
    TwelveMonths = 'In12Months',
    NotInterested = 'NotInterested',
    Register = 'Register',
}

export enum ContactPreference {
    Email = 1,
    Phone = 2,
}

export enum CurrentTourEditAction {
    Edit = 1, //default
    CancelTour = 2,
    NoShow = 3,
    MarkAsCompleted = 4,
}

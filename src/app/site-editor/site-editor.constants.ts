export class SiteEditorConstants {
    public static EDIT_HOME_PAGE_URL = '/app/site-editor/edit-home-page';
    public static EDIT_FEATURES_PAGE_URL = '/app/site-editor/edit-features';
    public static EDIT_FACULTY_PAGE_URL = '/app/site-editor/edit-faculty';
    public static EDIT_TESTIMONIALS_PAGE_URL = '/app/site-editor/edit-testimonials';
    public static EDIT_TESTIMONIALS_PUBLISHED_PAGE_URL = '/app/site-editor/edit-testimonials/published';
    public static EDIT_TESTIMONIALS_UNPUBLISHED_PAGE_URL = '/app/site-editor/edit-testimonials/unpublished';
    public static EDIT_CAREERS_PAGE_URL = '/app/site-editor/edit-careers';
    public static EDIT_EVENTS_PAGE_URL = '/app/site-editor/edit-events';
    public static EDIT_EVENTS_CALENDAR_PAGE_URL = '/app/site-editor/edit-events/calendar';
    public static EDIT_EVENTS_TEMPLATES_PAGE_URL = '/app/site-editor/edit-events/templates';
    public static EDIT_SUMMER_CAMP_PAGE_URL = '/app/site-editor/edit-summer-camp';
    public static DEFAULT_DATE_FORMAT = 'MM/dd/yyyy';
    public static FACULTY_FALLBACK_IMAGE_NAME = 'Faculty-Fallback-Books-Stacked-Apple.png';
    public static FACULTY_FALLBACK_IMAGE = `/assets/common/images/faculty/${SiteEditorConstants.FACULTY_FALLBACK_IMAGE_NAME}`;
    public static PRIMENG_EDITOR_TEXT_WRAPPER = '<p></p>';
    public static CONTENT_PATH_KEY = 'asset-content-path';
    public static DEFAULT_EVENT_ICON_NAME = 'Goddard.png';
    public static DEFAULT_ICON_NAME = 'Goddard.png';
    public static maxTestimonialContent = 50;
    public static calendarEventsIconsPath = '%2Fcontent%2Fdam%2Fgsi%2Ficons%2Fcalendar-events';
    public static heroImageRenditionSizes: string[] = ['1280.1280', '319.319', '140.100'];
    public static eventsCalendarIconsSizes: string[] = ['48.48', '140.100', '319.319'];
    public static imageCardsRenditionSizes: string[] = ['1280.1280', '319.319'];
    public static maxCareersEnabledCalendarDates = 730;
    public static maxEnabledCalendarDates = 730;
    public static DEFAULT_DATEPICKER_CONFIG = {
        isAnimated: true,
        showWeekNumbers: false,
        adaptivePosition: true,
        customTodayClass: 'gsi-today-hightlight',
    };

    static getPrograms() {
        return [
            'Infant Classroom',
            'Toddler Classroom',
            'Preschool Classroom',
            'Pre-K Classroom',
            'Junior-K Classroom',
            'Kindergarten Classroom',
            'Before/After School Program',
            'Summer Program',
            'Goddard Graduate',
        ];
    }
}

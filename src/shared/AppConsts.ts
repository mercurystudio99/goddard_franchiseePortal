export class AppConsts {
    static readonly tenancyNamePlaceHolderInUrl = '{TENANCY_NAME}';

    static remoteServiceBaseUrl: string;
    static remoteServiceBaseUrlFormat: string;
    static appBaseUrl: string;
    static appBaseHref: string; // returns angular's base-href parameter value if used during the publish
    static appBaseUrlFormat: string;
    static recaptchaSiteKey: string;
    static subscriptionExpireNootifyDayCount: number;

    static localeMappings: any = [];

    static readonly userManagement = {
        defaultAdminUserName: 'admin',
    };

    static readonly localization = {
        defaultLocalizationSourceName: 'FranchiseePortal',
    };

    static readonly authorization = {
        encrptedAuthTokenName: 'enc_auth_token',
    };

    static readonly grid = {
        defaultPageSize: 10,
    };

    static readonly MinimumUpgradePaymentAmount = 1;

    /// <summary>
    /// Gets current version of the application.
    /// It's also shown in the web page.
    /// </summary>
    static readonly WebAppGuiVersion = '10.5.0';

    static readonly wellKnownAADLoginEndpoint = '.auth/login/aad';
    static readonly defaultLogo = '/assets/common/images/logos/iGoddard_White.svg';
    static readonly endingAnchor = '</a>';
    static readonly startingAnchor = '<a';
    static readonly closingPrimeNGEditorAnchor = 'target="_blank">';
    static readonly nativeLoginEndpoint = '/account/login?login=native';
    static readonly startingPTag = '<p>';
    static readonly endingPTag = '</p>';
    static readonly virtualToursPageAlias = 'virtual-tour';
    public static defaultSchoolTimeZone = 'Eastern Standard Time';
    public static TOOLTIPS = {
        SAMPLE1: 'sample-1',
        HOMEPAGE_HERO_IMAGE_EDITOR: 'homepage-hero-editor',
        HOMEPAGE_ICON_CARD_EDITOR: 'homepage-icon-card-editor',
        HOMEPAGE_IMAGE_CARD_EDITOR: 'homepage-image-card-editor',
        FACULTY_JOB_TITLE: 'faculty-job-title',
        TESTIMONIALS_PUBLISHED: 'testimonials-published',
        CAREERS_POSITION: 'careers-position-name',
        CAREERS_SYSTEM_GENERATED_GRID_COL: 'careers-system-generated',
        CAREERS_POSTING_DATE: 'careers-posting-date',
        CAREERS_ACTIVE: 'careers-active',
        CAREERS_SYSTEM_GENERATED_EDIT_TITLE: 'careers-system-generated-edit-career',
        SCHOOL_EVENTS_CALENDAR_ADD_HYPERLINK: 'school-events-hyperlink-new',
        SCHOOL_EVENTS_TEMPLATES_ADD_HYPERLINK: 'school-events-hyperlink-template',
    };

    public static FEATURE_CATEGORY_TOOLTIP = {
        'Customized Physical Spaces': 'features-customized-physical-spaces',
        'Enrichment Program': 'features-enrichment-program',
        'Food Service': 'features-food-service',
        'Health & Safety': 'features-health-safety',
        'Physical Spaces': 'features-physical-spaces',
        'Programs Offered': 'features-programs-offered',
        'STEAM Cart/Computer Lab': 'features-steam-cart-computer-lab',
        'Literacy Nook': 'features-literacy-nook',
        'Outdoor Classroom': 'features-outdoor-classroom',
        'Gym/Multipurpose': 'features-gym-multipurpose',
    };
}

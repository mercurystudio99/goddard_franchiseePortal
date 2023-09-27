import { tokenizedOrDefault } from './tokenized-or-default';

// 20220105RBP - This might be a bit confusing.  This file contains the actual "production"
// config that we _want_ in a production environment.  This file is then consumed by "environment.prod.ts"
// which is the default file that is configured in angular fileReplacements for production configuration builds
export const environment = {
    dev: false,
    production: true,
    hmr: false,
    sso: true,
    appConfig: 'appconfig.production.json',
    contentAPIBasePath: tokenizedOrDefault(
        '#{{CONTENT_API_BASE_PATH}}#',
        'https://ipaas-prod-useast-apim.azure-api.net/content'
    ),
    featuresAPIBasePath: tokenizedOrDefault(
        '#{{FEATURES_API_BASE_PATH}}#',
        'https://ipaas-prod-useast-apim.azure-api.net/schoolfeatures'
    ),
    facultyAPIBasePath: tokenizedOrDefault(
        '#{{FACULTY_API_BASE_PATH}}#',
        'https://ipaas-prod-useast-apim.azure-api.net/faculty'
    ),
    testimonialsAPIBasePath: tokenizedOrDefault(
        '#{{TESTIMONIALS_API_BASE_PATH}}#',
        'https://ipaas-prod-useast-apim.azure-api.net/testimonials'
    ),
    careersAPIBasePath: tokenizedOrDefault(
        '#{{CAREERS_API_BASE_PATH}}#',
        'https://ipaas-prod-useast-apim.azure-api.net/careers'
    ),
    schoolEventsAPIBasePath: tokenizedOrDefault(
        '#{{SCHOOL_EVENTS_API_BASE_PATH}}#',
        'https://ipaas-prod-useast-apim.azure-api.net/schoolevents'
    ),
    APIM_KEY: tokenizedOrDefault('#{{APIM_KEY}}#', 'e659aa6fb4ea43d8bab503091b06c5f7'),
    schoolBaseSiteUrl: tokenizedOrDefault('#{{SCHOOL_BASE_SITE_URL}}#', 'https://www.goddardschool.com'),
    authorBaseSiteUrl: tokenizedOrDefault(
        '#{{AEM_AUTHOR_BASE_SITE_URL}}#',
        'https://author-p24717-e85610.adobeaemcloud.com'
    ),
    FBP_APIM_KEY: tokenizedOrDefault('#{{FBP_APIM_KEY}}#', ''),
    registerTourFmsUrl: 'https://fms.goddardschool.com/login.aspx',
    userGuideLink:
        'https://goddardsystems.sharepoint.com/sites/covid19/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2Fcovid19%2FShared%20Documents%2FMarketing%2FiGoddard%5FUserGuide%2Epdf&viewid=4e16c16a%2Dc2be%2D4c5a%2D8c2b%2D65cafe7bc077&parent=%2Fsites%2Fcovid19%2FShared%20Documents%2FMarketing',
};

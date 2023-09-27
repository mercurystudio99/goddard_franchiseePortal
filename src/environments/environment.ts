// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
    dev: true,
    production: false,
    hmr: false,
    sso: false,
    appConfig: 'appconfig.json',
    contentAPIBasePath: 'https://ipaas-qa-useast-apim.azure-api.net/content',
    featuresAPIBasePath: 'https://ipaas-qa-useast-apim.azure-api.net/schoolfeatures',
    facultyAPIBasePath: 'https://ipaas-qa-useast-apim.azure-api.net/faculty',
    testimonialsAPIBasePath: 'https://ipaas-qa-useast-apim.azure-api.net/testimonials',
    careersAPIBasePath: 'https://ipaas-qa-useast-apim.azure-api.net/careers',
    schoolEventsAPIBasePath: 'https://ipaas-qa-useast-apim.azure-api.net/schoolevents',
    APIM_KEY: 'd47006219e88418da84b2d3984054454',
    schoolBaseSiteUrl: 'https://www-stage.goddardschool.com',
    authorBaseSiteUrl: 'https://author-p24717-e85656.adobeaemcloud.com',
    registerTourFmsUrl: 'https://fmsqa.goddardschool.com/login.aspx',
    // Overrides APIM_KEY for calls to the FBP API
    // Only needs to be specified key when accessing FBP API in a different environment from other iPaaS APIs (ex. DEV)
    FBP_APIM_KEY: '',
    userGuideLink:
        'https://goddardsystems.sharepoint.com/sites/covid19/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2Fcovid19%2FShared%20Documents%2FMarketing%2FiGoddard%5FUserGuide%2Epdf&viewid=4e16c16a%2Dc2be%2D4c5a%2D8c2b%2D65cafe7bc077&parent=%2Fsites%2Fcovid19%2FShared%20Documents%2FMarketing',
};

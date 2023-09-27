
/**
 * 20220826RBP - User Story 15993: CWE-614 - Mark/enable the Secure flag on all cookies that contain sensitive user information such as session IDs
 * Replacing abp.js impl with an impl that uses js-cookie lib.  Default all cookies to be marked as Secure
 */
abp.utils.setCookieValue = function (key, value, expireDate, path, domain) {


    const options = { secure: true };

    if (expireDate) {
        options.expires  = expireDate;
    }

    if (path) {
        options.path =  path;
    }

    if (domain) {
        options.domain =  domain;
    }

    Cookies.set(key, value, options)
}

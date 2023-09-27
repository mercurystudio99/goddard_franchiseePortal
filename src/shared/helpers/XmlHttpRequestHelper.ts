import { ApiSubscriptionInterceptor } from '../api-subscription-interceptor';
export class XmlHttpRequestHelper {
    static ajax(type: string, url: string, customHeaders: any, data: any, success: any) {
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    let result = JSON.parse(xhr.responseText);
                    success(result);
                } else if (xhr.status !== 0) {
                    alert(abp.localization.localize('InternalServerError', 'AbpWeb'));
                }
            }
        };

        url += (url.indexOf('?') >= 0 ? '&' : '?') + 'd=' + new Date().getTime();
        xhr.open(type, url, true);

        for (let property in customHeaders) {
            if (customHeaders.hasOwnProperty(property)) {
                xhr.setRequestHeader(property, customHeaders[property]);
            }
        }

        // 20220105RBP - FIX: Add APIM subscription key for API calls that do not go through ng HttpClient
        ApiSubscriptionInterceptor.interceptXhr(url, xhr);

        xhr.setRequestHeader('Content-type', 'application/json');
        if (data) {
            xhr.send(data);
        } else {
            xhr.send();
        }
    }
}

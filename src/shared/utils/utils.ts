export interface SelectListItem {
    value: string;
    text: string;
    imgPath?: string;
}

export interface FilterBreadcrumb {
    key: string;
    value: string;
    displayValue?:string;
}

/**
 * Returns split Camel case word splitted into words
 * i.e.: MyCamelCaseString will return: "My Camel Case String"
 * credits: https://stackoverflow.com/q/18379254
 * @param source
 * @returns
 */
export function camelCaseToDisplayName(source: string) {
    return source.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 *
 * @param source string with some html tag
 * @param tag the tag to be found
 * @param selectAll include all elements in the dom
 * @param selectFn: function of the html elements to return (innerHTML | outerHTML)
 * see: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
 * @returns
 */
export function parseFromHtmlString(
    source: string,
    tag: string,
    selectAll: boolean = false,
    selectFn: (x: HTMLElement) => any = (x) => x.innerText
): string | undefined {
    const defaultReturn = '';

    if (!source) {
        return source;
    }
    var p = new DOMParser();
    let d = p.parseFromString(source, 'text/html');
    const tags = d.querySelectorAll(tag);

    if (!selectAll && tags.length) {
        return selectFn(tags[0] as HTMLElement);
    }

    let result = defaultReturn;
    for (let index = 0; index < tags.length; index++) {
        result += selectFn(tags[index] as HTMLElement);
    }

    return result;
}

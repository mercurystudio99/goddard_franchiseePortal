import { parseFromHtmlString } from '@shared/utils/utils';

describe('parseStringFromTag', () => {
    it('removes <p> tags', () => {
        const result = parseFromHtmlString('<p>test</p>', 'p');
        expect(result).toBe('test');
    });

    it('retrieves innerText from all anchor tags', () => {
        const result = parseFromHtmlString(
            '<p>some text <a>ANCHOR 1</a><a href="https://google.com"> ANCHOR 2</a></p>',
            'a',
            true
        );
        expect(result).toBe('ANCHOR 1 ANCHOR 2');
    });

    it('retrieves inner text from anchor tags with additional attributes', () => {
        const result = parseFromHtmlString(
            '<p>some text <a href="https://google.com" target="_blank" class="some-class">LINK TEXT</a></p>',
            'a'
        );
        expect(result).toBe('LINK TEXT');
    });

    it('retrieves inner text from anchor tag with long href string', () => {
        const result = parseFromHtmlString(
            `<p><a href="https://github.com/Lorem Ipsum ... on the theory of ethics, very popular during the Rree" rel="noopener noreferrer" target="_blank">LINK TEXT</a></p>`,
            'a'
        );
        expect(result).toBe('LINK TEXT');
    });

    it('retrieves outerHTML of all anchor tags', () => {
        const result = parseFromHtmlString(
            '<p>some text <a>ANCHOR 1</a><a> ANCHOR 2</a></p>',
            'a',
            true,
            (e) => e.outerHTML
        );
        expect(result).toBe('<a>ANCHOR 1</a><a> ANCHOR 2</a>');
    });

    it('retrieves innerHtml of all anchor tags', () => {
        const result = parseFromHtmlString(
            '<p>some text <a>ANCHOR 1</a><a> ANCHOR 2</a></p>',
            'a',
            true
        );
        expect(result).toBe('ANCHOR 1 ANCHOR 2');
    });
});

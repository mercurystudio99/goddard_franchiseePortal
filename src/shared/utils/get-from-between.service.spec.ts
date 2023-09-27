import { GetFromBetweenService } from './get-from-between.service';

describe(' GetFromBetweenService', () => {
    let component: GetFromBetweenService;

    beforeEach(() => {
        component = new GetFromBetweenService();
    });

    it('removes <p> tags', () => {
        const result = component.getValueFromBetween('<p>test</p>', '<p>', '</p>').join('');
        expect(result).toBe('test');
    });

    it('does not clear text if only starting tag is present', () => {
        const result = component.getValueFromBetween('<p>test<p>', '<p>', '</p>').join('');
        expect(result).toBe('<p>test<p>');
    });

    it('retrieves inner text from within anchor tags', () => {
        const innerText = 'some test';
        const source = `target="_blank">${innerText}</a>`;
        const result = component.getValueFromBetween(source, 'target="_blank">', '</a>').join('');
        expect(result).toBe(innerText);
    });

    it('does not duplicate text trying to retrieve inner text from anchor tags', () => {
        const result = component.getValueFromBetween('<p>test<p>', 'target="_blank">', '</a>').join('');
        expect(result).toBe('<p>test<p>');
    });

    it('should retrieve all anchors and inner texts from the source string', () => {
        const result = component.getValueFromBetweenConcat(
            'test <a>anchor 1</a> with some other text user may add<a> and anchor 2</a>.',
            '<a>',
            '</a>'
        );
        expect(result).toBe('<a>anchor 1</a><a> and anchor 2</a>');
    });
});

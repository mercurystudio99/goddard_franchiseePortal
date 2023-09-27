import { DescriptionLengthValidatorService } from './description-length-validator.service';

describe(' DescriptionLengthValidatorService', () => {
    let component: DescriptionLengthValidatorService;

    beforeEach(() => {
        component = new DescriptionLengthValidatorService();
    });

    it('calculates max link limit correctly', () => {
        const linkUrlTotalLimit = 52;
        expect(component.isMarkupLengthValid('<p>Text with 53 characters of markup <a href="https://www.goddardschools.com">link</a></p>', linkUrlTotalLimit)).toBe(true);

        expect(component.isMarkupLengthValid('<p>Text with 54 character link <a href="https://www.goddardschools.com1">link</a></p>', linkUrlTotalLimit)).toBe(false);
    });

    it('calculates max link limit correctly with two links', () => {
        const maxMarkupLimit = 67;

        expect(component.isMarkupLengthValid('<p>Text with 53 characters of markup <a href="https://www.test.com">link</a> and <a href="https://xy">another</a></p>', maxMarkupLimit)).toBe(true);

        expect(component.isMarkupLengthValid('<p>Text with 54 characters of markup <a href="https://www.test.com">link</a> and <a href="https://xyz">another</a></p>', maxMarkupLimit)).toBe(false);
    });

    it('is valid with no links', () => {
        expect(component.isMarkupLengthValid('<p>Just text</p>', 30)).toBe(true);
    })
});

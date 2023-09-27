import { RequiredTrimmerValidator } from './required-trimmer-validator.directive';

describe(' RequiredTrimmerValidator', () => {
    let sut: RequiredTrimmerValidator;

    beforeEach(() => {
        sut = new RequiredTrimmerValidator('true', '<p>', '</p>');
    });

    // Returning null is a valid control, true is an invalid control so let's name them appropriately
    // for readability
    const valid = null;
    const invalid = true;
    it('Returns valid for basic p tag', () => {
        expect(sut.innerValidate('<p>Text between tags</p>')).toBe(valid);
    });

    it('Returns invalid if nothing between p tags', () => {
        expect(sut.innerValidate('<p></p>').validateRequired).toBe(invalid);
    });

    it('Returns invalid with multiple empty tags', () => {
        expect(sut.innerValidate('<p></p><p></p>').validateRequired).toBe(invalid);
    });

    it('Returns invalid with weird spacing', () => {
        expect(sut.innerValidate('<p> </p><p> </p>').validateRequired).toBe(invalid);
    });

    it('Edge case: Returns valid with malformed html.  Its now a string', () => {
        expect(sut.innerValidate('<p> </p><p> < /p>')).toBe(valid);
    });

    it('Returns valid if two p tags with text between second tag', () => {
        expect(sut.innerValidate('<p></p><p>Text here</p>')).toBe(valid);
    });
});

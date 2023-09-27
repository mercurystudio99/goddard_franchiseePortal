
const TOKEN_PATTERN_REG_EX = /^#{{\w+}}#$/;

/**
 * Returns tokenized value if it does not match the token pattern
 * otherwise returns default value because tokenization did not take place
 * @param tokenized
 * @param defaultValue
 * @returns
 */
export function tokenizedOrDefault(tokenized: string, defaultValue: string) {

    if(TOKEN_PATTERN_REG_EX.test(tokenized)) {
        // Token was not replaced
        return defaultValue;
    }

    return tokenized;
}

import { AttributeObserver } from "./attribute-observer";
import { Multimap } from "../util/multimap";

export class TokenListObserver
{
    constructor(element, attributeName, delegate) {
        this.delegate = delegate;
        this.attributeObserver = new AttributeObserver(element, attributeName, this);
        this.tokensByElement = new Multimap();
    }

    get started() {
        return this.attributeObserver.started;
    }

    start() {
        this.attributeObserver.start();
    }

    pause(callback) {
        this.attributeObserver.pause(callback);
    }

    stop() {
        this.attributeObserver.stop();
    }

    refresh() {
        this.attributeObserver.refresh();
    }

    get element() {
        return this.attributeObserver.element;
    }

    get attributeName() {
        return this.attributeObserver.attributeName;
    }

    // Attribute observer delegate
    elementMatchedAttribute(element) {
        this.tokensMatched(this.readTokensForElement(element));
    }

    elementAttributeValueChanged(element) {
        const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
        this.tokensUnmatched(unmatchedTokens);
        this.tokensMatched(matchedTokens);
    }

    elementUnmatchedAttribute(element) {
        this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    }

    tokensMatched(tokens) {
        tokens.forEach((token) => this.tokenMatched(token));
    }

    tokensUnmatched(tokens) {
        tokens.forEach((token) => this.tokenUnmatched(token));
    }

    tokenMatched(token) {
        this.delegate.tokenMatched(token);
        this.tokensByElement.add(token.element, token);
    }

    tokenUnmatched(token) {
        this.delegate.tokenUnmatched(token);
        this.tokensByElement.delete(token.element, token);
    }

    refreshTokensForElement(element) {
        const previousTokens = this.tokensByElement.getValuesForKey(element);
        const currentTokens = this.readTokensForElement(element);
        const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
        if (firstDifferingIndex == -1) {
            return [[], []];
        }
        else {
            return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
        }
    }

    readTokensForElement(element) {
        const attributeName = this.attributeName;
        const tokenString = element.getAttribute(attributeName) || "";
        return parseTokenString(tokenString, element, attributeName);
    }
}

function parseTokenString(tokenString, element, attributeName) {
    return tokenString
        .trim()
        .split(/\s+/)
        .filter((content) => content.length)
        .map((content, index) => ({ element, attributeName, content, index }));
}

function zip(left, right) {
    const length = Math.max(left.length, right.length);
    return Array.from({ length }, (_, index) => [left[index], right[index]]);
}

function tokensAreEqual(left, right) {
    return left && right && left.index == right.index && left.content == right.content;
}

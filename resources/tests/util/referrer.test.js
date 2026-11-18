import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getReferrerUrl } from '../../src/util/referrer';
import { registerTurbo } from '../../src/util/turbo';

function setLastVisit(url) {
    registerTurbo({
        isEnabled: () => true,
        controller: { getLastVisitUrl: () => url }
    });
}

function setDocumentReferrer(url) {
    Object.defineProperty(document, 'referrer', { value: url, configurable: true });
}

describe('getReferrerUrl', () => {
    beforeEach(() => {
        window.happyDOM.setURL('http://localhost/posts/update/7');
    });

    afterEach(() => {
        registerTurbo(null);
        window.happyDOM.setURL('about:blank');
    });

    it('returns the last visited URL', () => {
        setLastVisit('http://localhost/dashboard');

        expect(getReferrerUrl()).toBe('http://localhost/dashboard');
    });

    it('returns nothing without a last visit', () => {
        setLastVisit(undefined);

        expect(getReferrerUrl()).toBeNull();
    });

    it('ignores a last visit to the current page', () => {
        setLastVisit('http://localhost/posts/update/7?tab=seo');

        expect(getReferrerUrl()).toBeNull();
    });

    describe('with a fallback URL', () => {
        it('returns the last visit to the fallback page with its query', () => {
            setLastVisit('http://localhost/posts?page=2');

            expect(getReferrerUrl('http://localhost/posts')).toBe('http://localhost/posts?page=2');
        });

        it('accepts a relative fallback URL', () => {
            setLastVisit('http://localhost/posts?page=2');

            expect(getReferrerUrl('/posts')).toBe('http://localhost/posts?page=2');
        });

        it('ignores a last visit to another page', () => {
            setLastVisit('http://localhost/posts/create');

            expect(getReferrerUrl('http://localhost/posts')).toBeNull();
        });

        it('ignores a last visit to a page that only shares a prefix', () => {
            setLastVisit('http://localhost/posts/update/3');

            expect(getReferrerUrl('http://localhost/posts')).toBeNull();
        });

        it('ignores a fallback on another origin', () => {
            setLastVisit('http://localhost/posts?page=2');

            expect(getReferrerUrl('http://example.test/posts')).toBeNull();
        });
    });

    describe('without the turbo router', () => {
        afterEach(() => {
            setDocumentReferrer('');
            localStorage.removeItem('ocPushStateReferrer');
        });

        it('returns the document referrer to the fallback page', () => {
            setDocumentReferrer('http://localhost/posts?page=2');

            expect(getReferrerUrl('http://localhost/posts')).toBe('http://localhost/posts?page=2');
        });

        it('returns the pushed query of the fallback page', () => {
            setDocumentReferrer('http://localhost/posts');
            localStorage.setItem('ocPushStateReferrer', '/posts?page=3');

            expect(getReferrerUrl('http://localhost/posts')).toBe('/posts?page=3');
        });

        it('ignores a document referrer to another page', () => {
            setDocumentReferrer('http://localhost/posts/create');

            expect(getReferrerUrl('http://localhost/posts')).toBeNull();
        });
    });
});

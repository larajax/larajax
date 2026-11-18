import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Actions } from '../../src/request/actions';
import { registerTurbo } from '../../src/util/turbo';

describe('Actions', () => {
    describe('applyQueryToUrl', () => {
        afterEach(() => {
            registerTurbo(null);
        });

        it('adds the query to the page URL from the turbo router', () => {
            const visits = [];
            registerTurbo({
                isEnabled: () => true,
                controller: { getPageUrl: () => 'http://localhost/list?sort=name' },
                visit: (url, options) => visits.push({ url, options })
            });

            const actions = new Actions({ el: null }, {}, {});
            actions.applyQueryToUrl({ page: 2 });

            expect(visits).toEqual([
                { url: '/list?sort=name&page=2', options: { action: 'swap', scroll: false } }
            ]);
        });
    });

    describe('handleRedirectResponse', () => {
        let visits;

        function redirectWithLastVisit(lastVisitUrl, options) {
            registerTurbo({
                isEnabled: () => true,
                controller: { getLastVisitUrl: () => lastVisitUrl },
                visit: (url) => visits.push(url)
            });

            const delegate = {
                el: null,
                notifyApplicationBeforeRedirect: () => ({ defaultPrevented: false })
            };

            new Actions(delegate, {}, options).handleRedirectResponse('http://localhost/posts');
        }

        beforeEach(() => {
            visits = [];
            window.happyDOM.setURL('http://localhost/posts/update/7');
        });

        afterEach(() => {
            registerTurbo(null);
            window.happyDOM.setURL('about:blank');
        });

        it('goes back to the redirect page with its previous query', () => {
            redirectWithLastVisit('http://localhost/posts?page=2', { browserRedirectBack: true });

            expect(visits).toEqual(['http://localhost/posts?page=2']);
        });

        it('follows the redirect when the previous page is a different one', () => {
            redirectWithLastVisit('http://localhost/posts/create', { browserRedirectBack: true });

            expect(visits).toEqual(['http://localhost/posts']);
        });

        it('follows the redirect when going back is not requested', () => {
            redirectWithLastVisit('http://localhost/posts?page=2', {});

            expect(visits).toEqual(['http://localhost/posts']);
        });
    });
});

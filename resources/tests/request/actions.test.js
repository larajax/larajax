import { describe, it, expect, afterEach } from 'bun:test';
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
});

import { describe, it, expect } from 'bun:test';
import { Data } from '../../src/request/data';

describe('Data', () => {
    describe('castJsonToFormData', () => {
        it('converts null to empty string', () => {
            const data = new Data();
            expect(data.castJsonToFormData(null)).toBe('');
        });

        it('converts undefined to empty string', () => {
            const data = new Data();
            expect(data.castJsonToFormData(undefined)).toBe('');
        });

        it('converts true to "1"', () => {
            const data = new Data();
            expect(data.castJsonToFormData(true)).toBe('1');
        });

        it('converts false to "0"', () => {
            const data = new Data();
            expect(data.castJsonToFormData(false)).toBe('0');
        });

        it('passes through strings unchanged', () => {
            const data = new Data();
            expect(data.castJsonToFormData('hello')).toBe('hello');
        });

        it('passes through numbers unchanged', () => {
            const data = new Data();
            expect(data.castJsonToFormData(42)).toBe(42);
        });
    });

    describe('appendJsonToFormData', () => {
        it('appends flat key-value pairs', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { name: 'John', age: '30' });
            expect(fd.get('name')).toBe('John');
            expect(fd.get('age')).toBe('30');
        });

        it('appends nested objects with bracket notation', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { user: { name: 'John', email: 'j@test.com' } });
            expect(fd.get('user[name]')).toBe('John');
            expect(fd.get('user[email]')).toBe('j@test.com');
        });

        it('appends arrays with [] suffix', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { tags: ['a', 'b', 'c'] });
            expect(fd.getAll('tags[]')).toEqual(['a', 'b', 'c']);
        });

        it('appends arrays of objects with indexed keys', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { items: [{ id: '1' }, { id: '2' }] });
            expect(fd.get('items[0][id]')).toBe('1');
            expect(fd.get('items[1][id]')).toBe('2');
        });

        it('casts boolean values in objects', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { active: true, disabled: false });
            expect(fd.get('active')).toBe('1');
            expect(fd.get('disabled')).toBe('0');
        });

        it('casts null values to empty strings', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { field: null });
            expect(fd.get('field')).toBe('');
        });

        it('handles deeply nested objects', () => {
            const data = new Data();
            const fd = new FormData();
            data.appendJsonToFormData(fd, { a: { b: { c: 'deep' } } });
            expect(fd.get('a[b][c]')).toBe('deep');
        });
    });

    describe('convertFormDataToQuery', () => {
        it('converts flat form data to query string', () => {
            const data = new Data();
            const fd = new FormData();
            fd.append('name', 'John');
            fd.append('age', '30');
            const query = data.convertFormDataToQuery(fd);
            expect(query).toContain('name=John');
            expect(query).toContain('age=30');
            expect(query).toContain('&');
        });

        it('handles array fields', () => {
            const data = new Data();
            const fd = new FormData();
            fd.append('tags[]', 'a');
            fd.append('tags[]', 'b');
            const query = data.convertFormDataToQuery(fd);
            expect(query).toContain('tags%5B%5D=a');
            expect(query).toContain('tags%5B%5D=b');
        });

        it('encodes special characters', () => {
            const data = new Data();
            const fd = new FormData();
            fd.append('q', 'hello world&more');
            const query = data.convertFormDataToQuery(fd);
            expect(query).toBe('q=hello%20world%26more');
        });
    });

    describe('formDataToArray', () => {
        it('returns last value for non-array fields', () => {
            const data = new Data();
            const fd = new FormData();
            fd.append('name', 'first');
            fd.append('name', 'last');
            const result = data.formDataToArray(fd);
            expect(result.name).toBe('last');
        });

        it('returns all values for array fields', () => {
            const data = new Data();
            const fd = new FormData();
            fd.append('items[]', 'a');
            fd.append('items[]', 'b');
            const result = data.formDataToArray(fd);
            expect(result['items[]']).toEqual(['a', 'b']);
        });
    });

    describe('getRequestData', () => {
        it('returns FormData from form element', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="username" value="test">';
            document.body.appendChild(form);
            const data = new Data({}, null, form);
            const fd = data.getRequestData();
            expect(fd.get('username')).toBe('test');
            form.remove();
        });

        it('returns empty FormData without form', () => {
            const data = new Data({}, null, null);
            const fd = data.getRequestData();
            expect(fd).toBeInstanceOf(FormData);
        });

        it('appends single input element value when no form', () => {
            const input = document.createElement('input');
            input.name = 'field';
            input.value = 'value';
            document.body.appendChild(input);
            const data = new Data({}, input, null);
            const fd = data.getRequestData();
            expect(fd.get('field')).toBe('value');
            input.remove();
        });

        it('skips single input when user data already has the field', () => {
            const input = document.createElement('input');
            input.name = 'field';
            input.value = 'from-input';
            document.body.appendChild(input);
            const data = new Data({ field: 'from-user' }, input, null);
            const fd = data.getRequestData();
            expect(fd.get('field')).toBeNull();
            input.remove();
        });
    });
});

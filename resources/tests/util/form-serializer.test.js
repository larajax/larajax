import { describe, it, expect } from 'bun:test';
import { FormSerializer } from '../../src/util/form-serializer';

describe('FormSerializer', () => {
    describe('nameToArray', () => {
        it('handles simple field names', () => {
            const serializer = new FormSerializer();
            expect(serializer.nameToArray('name')).toEqual(['name']);
        });

        it('handles bracket notation', () => {
            const serializer = new FormSerializer();
            expect(serializer.nameToArray('user[name]')).toEqual(['user', 'name']);
        });

        it('handles deeply nested brackets', () => {
            const serializer = new FormSerializer();
            expect(serializer.nameToArray('a[b][c][d]')).toEqual(['a', 'b', 'c', 'd']);
        });

        it('handles array notation', () => {
            const serializer = new FormSerializer();
            // items[] should give ["items", ""]? No, the regex only matches non-empty content
            // Actually [] has no content between brackets, so it won't match
            // The name "items[]" should parse as ["items"]
            const result = serializer.nameToArray('items[]');
            expect(result).toEqual(['items']);
        });
    });

    describe('assignObjectNested', () => {
        it('assigns simple value', () => {
            const serializer = new FormSerializer();
            const obj = {};
            serializer.assignObjectNested(obj, ['name'], 'John', false);
            expect(obj.name).toBe('John');
        });

        it('assigns nested value', () => {
            const serializer = new FormSerializer();
            const obj = {};
            serializer.assignObjectNested(obj, ['user', 'name'], 'John', false);
            expect(obj.user.name).toBe('John');
        });

        it('assigns deeply nested value', () => {
            const serializer = new FormSerializer();
            const obj = {};
            serializer.assignObjectNested(obj, ['a', 'b', 'c'], 'deep', false);
            expect(obj.a.b.c).toBe('deep');
        });

        it('handles array assignment', () => {
            const serializer = new FormSerializer();
            const obj = {};
            serializer.assignObjectNested(obj, ['tags'], 'one', true);
            serializer.assignObjectNested(obj, ['tags'], 'two', true);
            expect(obj.tags).toEqual(['one', 'two']);
        });

        it('handles array of arrays assignment', () => {
            const serializer = new FormSerializer();
            const obj = {};
            serializer.assignObjectNested(obj, ['items'], [{ name: 'a' }, { name: 'b' }], true);
            expect(obj.items).toEqual([{ name: 'a' }, { name: 'b' }]);
        });
    });

    describe('assignToObj', () => {
        it('assigns via bracket notation', () => {
            const obj = {};
            FormSerializer.assignToObj(obj, 'user[email]', 'test@test.com');
            expect(obj.user.email).toBe('test@test.com');
        });

        it('assigns multiple fields to same parent', () => {
            const obj = {};
            FormSerializer.assignToObj(obj, 'user[name]', 'John');
            FormSerializer.assignToObj(obj, 'user[age]', '30');
            expect(obj.user.name).toBe('John');
            expect(obj.user.age).toBe('30');
        });

        it('handles array fields with []', () => {
            const obj = {};
            FormSerializer.assignToObj(obj, 'colors[]', 'red');
            FormSerializer.assignToObj(obj, 'colors[]', 'blue');
            // Actually colors[] → nameToArray gives ["colors"]
            // and isArray = true (endsWith []), so it pushes
            expect(obj.colors).toEqual(['red', 'blue']);
        });
    });

    describe('serializeAsJSON', () => {
        it('serializes text inputs', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="username" value="test">';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.username).toBe('test');
            form.remove();
        });

        it('skips disabled inputs', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="field" value="val" disabled>';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.field).toBeUndefined();
            form.remove();
        });

        it('skips submit buttons', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="btn" type="submit" value="Go">';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.btn).toBeUndefined();
            form.remove();
        });

        it('skips unchecked checkboxes', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="agree" type="checkbox" value="yes">';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.agree).toBeUndefined();
            form.remove();
        });

        it('includes checked checkboxes', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="agree" type="checkbox" value="yes" checked>';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.agree).toBe('yes');
            form.remove();
        });

        it('serializes textareas', () => {
            const form = document.createElement('form');
            form.innerHTML = '<textarea name="bio">Hello world</textarea>';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.bio).toBe('Hello world');
            form.remove();
        });

        it('serializes nested field names', () => {
            const form = document.createElement('form');
            form.innerHTML = '<input name="user[name]" value="John"><input name="user[email]" value="j@test.com">';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON(form);
            expect(result.user.name).toBe('John');
            expect(result.user.email).toBe('j@test.com');
            form.remove();
        });

        it('accepts a CSS selector string', () => {
            const form = document.createElement('form');
            form.id = 'test-serialize-form';
            form.innerHTML = '<input name="x" value="1">';
            document.body.appendChild(form);
            const result = FormSerializer.serializeAsJSON('#test-serialize-form');
            expect(result.x).toBe('1');
            form.remove();
        });
    });
});

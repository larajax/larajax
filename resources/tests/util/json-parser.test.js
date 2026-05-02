import { describe, it, expect } from 'bun:test';
import { JsonParser } from '../../src/util/json-parser';

describe('JsonParser', () => {
    describe('parseJSON', () => {
        it('parses standard JSON objects', () => {
            const result = JsonParser.parseJSON('{"name": "test", "value": 123}');
            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('parses unquoted keys', () => {
            const result = JsonParser.parseJSON('{name: "test", value: 123}');
            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('parses single-quoted strings', () => {
            const result = JsonParser.parseJSON("{'name': 'test'}");
            expect(result).toEqual({ name: 'test' });
        });

        it('parses nested objects', () => {
            const result = JsonParser.parseJSON('{outer: {inner: "value"}}');
            expect(result).toEqual({ outer: { inner: 'value' } });
        });

        it('parses arrays', () => {
            const result = JsonParser.parseJSON('[1, 2, 3]');
            expect(result).toEqual([1, 2, 3]);
        });

        it('parses nested arrays in objects', () => {
            const result = JsonParser.parseJSON('{items: [1, "two", true]}');
            expect(result).toEqual({ items: [1, 'two', true] });
        });

        it('parses boolean values', () => {
            const result = JsonParser.parseJSON('{a: true, b: false}');
            expect(result).toEqual({ a: true, b: false });
        });

        it('parses null values', () => {
            const result = JsonParser.parseJSON('{a: null}');
            expect(result).toEqual({ a: null });
        });

        it('parses negative numbers', () => {
            const result = JsonParser.parseJSON('{value: -42}');
            expect(result).toEqual({ value: -42 });
        });

        it('parses float numbers', () => {
            const result = JsonParser.parseJSON('{value: 3.14}');
            expect(result).toEqual({ value: 3.14 });
        });

        it('handles trailing commas in objects', () => {
            const result = JsonParser.parseJSON('{name: "test", value: 1,}');
            expect(result).toEqual({ name: 'test', value: 1 });
        });

        it('handles trailing commas in arrays', () => {
            const result = JsonParser.parseJSON('[1, 2, 3,]');
            expect(result).toEqual([1, 2, 3]);
        });

        it('handles empty commas in arrays as null', () => {
            const result = JsonParser.parseJSON('[1,,3]');
            expect(result).toEqual([1, null, 3]);
        });

        it('handles escaped quotes in strings', () => {
            const result = JsonParser.parseJSON('{"msg": "say \\"hello\\""}');
            expect(result).toEqual({ msg: 'say "hello"' });
        });

        it('handles escaped single quotes', () => {
            const result = JsonParser.parseJSON("{'msg': 'it\\'s fine'}");
            expect(result).toEqual({ msg: "it's fine" });
        });

        it('parses deeply nested structures', () => {
            const result = JsonParser.parseJSON('{a: {b: {c: {d: "deep"}}}}');
            expect(result).toEqual({ a: { b: { c: { d: 'deep' } } } });
        });

        it('parses mixed arrays and objects', () => {
            const result = JsonParser.parseJSON('{items: [{id: 1}, {id: 2}]}');
            expect(result).toEqual({ items: [{ id: 1 }, { id: 2 }] });
        });

        it('handles whitespace variations', () => {
            const result = JsonParser.parseJSON('{ name : "test" , value : 1 }');
            expect(result).toEqual({ name: 'test', value: 1 });
        });

        it('throws on empty string', () => {
            expect(() => JsonParser.parseJSON('')).toThrow();
        });

        it('throws on broken object', () => {
            expect(() => JsonParser.parseJSON('{name: "test"')).toThrow();
        });

        it('throws on broken array', () => {
            expect(() => JsonParser.parseJSON('[1, 2')).toThrow();
        });

        it('handles double quotes inside single-quoted strings', () => {
            const result = JsonParser.parseJSON("{'msg': 'has \"quotes\"'}");
            expect(result).toEqual({ msg: 'has "quotes"' });
        });
    });

    describe('paramToObj', () => {
        it('wraps non-object strings in braces', () => {
            const result = JsonParser.paramToObj('test', 'key: "value"');
            expect(result).toEqual({ key: 'value' });
        });

        it('passes through objects unchanged', () => {
            const input = { key: 'value' };
            const result = JsonParser.paramToObj('test', input);
            expect(result).toBe(input);
        });

        it('handles undefined value as empty', () => {
            const result = JsonParser.paramToObj('test', undefined);
            expect(result).toEqual({});
        });

        it('handles already-braced strings', () => {
            const result = JsonParser.paramToObj('test', '{key: "value"}');
            expect(result).toEqual({ key: 'value' });
        });

        it('throws with descriptive error on parse failure', () => {
            expect(() => JsonParser.paramToObj('myAttr', '{{{invalid')).toThrow(/myAttr/);
        });
    });
});

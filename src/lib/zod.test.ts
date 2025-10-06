import { describe, it, expect } from 'vitest';
import { z, string, boolean, array, object } from './zod';
import type { Schema } from './zod';

describe('zod.ts', () => {
  describe('string()', () => {
    it('should parse valid strings', () => {
      const schema = string();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse('')).toBe('');
      expect(schema.parse('123')).toBe('123');
    });

    it('should throw error for non-strings', () => {
      const schema = string();
      expect(() => schema.parse(123)).toThrow('Expected string');
      expect(() => schema.parse(true)).toThrow('Expected string');
      expect(() => schema.parse(null)).toThrow('Expected string');
      expect(() => schema.parse(undefined)).toThrow('Expected string');
      expect(() => schema.parse({})).toThrow('Expected string');
      expect(() => schema.parse([])).toThrow('Expected string');
    });

    it('should support optional()', () => {
      const schema = string().optional();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it('should throw for non-string when optional', () => {
      const schema = string().optional();
      expect(() => schema.parse(123)).toThrow('Expected string');
    });

    it('should mark optional schema with _optional flag', () => {
      const schema = string().optional();
      expect(schema._optional).toBe(true);
    });

    it('should allow chaining optional multiple times', () => {
      const schema = string().optional().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse('test')).toBe('test');
    });
  });

  describe('boolean()', () => {
    it('should parse valid booleans', () => {
      const schema = boolean();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });

    it('should throw error for non-booleans', () => {
      const schema = boolean();
      expect(() => schema.parse('true')).toThrow('Expected boolean');
      expect(() => schema.parse(1)).toThrow('Expected boolean');
      expect(() => schema.parse(0)).toThrow('Expected boolean');
      expect(() => schema.parse(null)).toThrow('Expected boolean');
      expect(() => schema.parse(undefined)).toThrow('Expected boolean');
      expect(() => schema.parse({})).toThrow('Expected boolean');
      expect(() => schema.parse([])).toThrow('Expected boolean');
    });

    it('should support optional()', () => {
      const schema = boolean().optional();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it('should throw for non-boolean when optional', () => {
      const schema = boolean().optional();
      expect(() => schema.parse('true')).toThrow('Expected boolean');
    });

    it('should mark optional schema with _optional flag', () => {
      const schema = boolean().optional();
      expect(schema._optional).toBe(true);
    });
  });

  describe('array()', () => {
    it('should parse valid arrays with string schema', () => {
      const schema = array(string());
      expect(schema.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(schema.parse([])).toEqual([]);
    });

    it('should parse valid arrays with boolean schema', () => {
      const schema = array(boolean());
      expect(schema.parse([true, false, true])).toEqual([true, false, true]);
    });

    it('should throw error for non-arrays', () => {
      const schema = array(string());
      expect(() => schema.parse('not an array')).toThrow('Expected array');
      expect(() => schema.parse(123)).toThrow('Expected array');
      expect(() => schema.parse({})).toThrow('Expected array');
      expect(() => schema.parse(null)).toThrow('Expected array');
      expect(() => schema.parse(undefined)).toThrow('Expected array');
    });

    it('should validate each array item against schema', () => {
      const schema = array(string());
      expect(() => schema.parse(['a', 123, 'c'])).toThrow('Expected string');
      expect(() => schema.parse([true, false])).toThrow('Expected string');
    });

    it('should support optional()', () => {
      const schema = array(string()).optional();
      expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it('should support nested arrays', () => {
      const schema = array(array(string()));
      expect(schema.parse([['a', 'b'], ['c', 'd']])).toEqual([['a', 'b'], ['c', 'd']]);
    });

    it('should mark optional schema with _optional flag', () => {
      const schema = array(string()).optional();
      expect(schema._optional).toBe(true);
    });
  });

  describe('object()', () => {
    it('should parse valid objects', () => {
      const schema = object({
        name: string(),
        age: string(),
      });

      const result = schema.parse({ name: 'John', age: '30' });
      expect(result).toEqual({ name: 'John', age: '30' });
    });

    it('should throw error for non-objects', () => {
      const schema = object({ name: string() });
      expect(() => schema.parse('not an object')).toThrow('Expected object');
      expect(() => schema.parse(123)).toThrow('Expected object');
      expect(() => schema.parse(true)).toThrow('Expected object');
      expect(() => schema.parse(null)).toThrow('Expected object');
      expect(() => schema.parse([])).toThrow('Expected object');
    });

    it('should throw error for arrays', () => {
      const schema = object({ name: string() });
      expect(() => schema.parse([])).toThrow('Expected object');
      expect(() => schema.parse([1, 2, 3])).toThrow('Expected object');
    });

    it('should validate required fields', () => {
      const schema = object({
        name: string(),
        active: boolean(),
      });

      expect(() => schema.parse({ name: 'John' })).toThrow('Missing required key: active');
      expect(() => schema.parse({ active: true })).toThrow('Missing required key: name');
      expect(() => schema.parse({})).toThrow('Missing required key');
    });

    it('should support optional fields', () => {
      const schema = object({
        name: string(),
        nickname: string().optional(),
      });

      const result1 = schema.parse({ name: 'John', nickname: 'Johnny' });
      expect(result1).toEqual({ name: 'John', nickname: 'Johnny' });

      const result2 = schema.parse({ name: 'John' });
      expect(result2).toEqual({ name: 'John', nickname: undefined });
    });

    it('should handle all optional fields', () => {
      const schema = object({
        name: string().optional(),
        age: string().optional(),
      });

      const result = schema.parse({});
      expect(result).toEqual({ name: undefined, age: undefined });
    });

    it('should validate field types', () => {
      const schema = object({
        name: string(),
        active: boolean(),
      });

      expect(() => schema.parse({ name: 123, active: true })).toThrow('Expected string');
      expect(() => schema.parse({ name: 'John', active: 'yes' })).toThrow('Expected boolean');
    });

    it('should support nested objects', () => {
      const schema = object({
        user: object({
          name: string(),
          email: string(),
        }),
      });

      const result = schema.parse({
        user: { name: 'John', email: 'john@example.com' },
      });

      expect(result).toEqual({
        user: { name: 'John', email: 'john@example.com' },
      });
    });

    it('should support arrays in objects', () => {
      const schema = object({
        name: string(),
        tags: array(string()),
      });

      const result = schema.parse({ name: 'Post', tags: ['tech', 'blog'] });
      expect(result).toEqual({ name: 'Post', tags: ['tech', 'blog'] });
    });

    it('should support optional() on object', () => {
      const schema = object({
        name: string(),
      }).optional();

      expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it('should support complex nested structures', () => {
      const schema = object({
        title: string(),
        author: object({
          name: string(),
          email: string().optional(),
        }),
        tags: array(string()),
        published: boolean(),
      });

      const result = schema.parse({
        title: 'Blog Post',
        author: { name: 'John' },
        tags: ['tech', 'coding'],
        published: true,
      });

      expect(result).toEqual({
        title: 'Blog Post',
        author: { name: 'John', email: undefined },
        tags: ['tech', 'coding'],
        published: true,
      });
    });

    it('should mark optional schema with _optional flag', () => {
      const schema = object({ name: string() }).optional();
      expect(schema._optional).toBe(true);
    });

    it('should handle undefined values for optional fields correctly', () => {
      const schema = object({
        required: string(),
        optional: string().optional(),
      });

      const result = schema.parse({ required: 'test', optional: undefined });
      expect(result.optional).toBeUndefined();
    });
  });

  describe('z namespace', () => {
    it('should export string via z namespace', () => {
      expect(z.string).toBe(string);
    });

    it('should export boolean via z namespace', () => {
      expect(z.boolean).toBe(boolean);
    });

    it('should export array via z namespace', () => {
      expect(z.array).toBe(array);
    });

    it('should export object via z namespace', () => {
      expect(z.object).toBe(object);
    });

    it('should work with z.string()', () => {
      const schema = z.string();
      expect(schema.parse('hello')).toBe('hello');
    });

    it('should work with z.object()', () => {
      const schema = z.object({
        name: z.string(),
        active: z.boolean(),
      });

      expect(schema.parse({ name: 'test', active: true })).toEqual({
        name: 'test',
        active: true,
      });
    });
  });

  describe('Schema type', () => {
    it('should conform to Schema interface', () => {
      const schema: Schema<string> = string();
      expect(schema.parse).toBeDefined();
      expect(schema.optional).toBeDefined();
    });

    it('should support optional Schema type', () => {
      const schema: Schema<string | undefined> = string().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse('test')).toBe('test');
    });
  });
});

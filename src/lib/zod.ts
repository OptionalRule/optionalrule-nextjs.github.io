export type Schema<T> = {
  parse: (input: unknown) => T;
  optional: () => Schema<T | undefined>;
  _optional?: true;
};

function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  const opt: Schema<T | undefined> = {
    parse(input: unknown): T | undefined {
      if (input === undefined) return undefined;
      return schema.parse(input);
    },
    optional: () => optional(opt),
    _optional: true,
  };
  return opt;
}

export function string(): Schema<string> {
  const base: Schema<string> = {
    parse(input: unknown): string {
      if (typeof input !== 'string') {
        throw new Error('Expected string');
      }
      return input;
    },
    optional: () => optional(base),
  };
  return base;
}

export function boolean(): Schema<boolean> {
  const base: Schema<boolean> = {
    parse(input: unknown): boolean {
      if (typeof input !== 'boolean') {
        throw new Error('Expected boolean');
      }
      return input;
    },
    optional: () => optional(base),
  };
  return base;
}

export function array<T>(schema: Schema<T>): Schema<T[]> {
  const base: Schema<T[]> = {
    parse(input: unknown): T[] {
      if (!Array.isArray(input)) {
        throw new Error('Expected array');
      }
      return input.map(item => schema.parse(item));
    },
    optional: () => optional(base),
  };
  return base;
}

export function object<T extends Record<string, Schema<unknown>>>(
  shape: T,
): Schema<{ [K in keyof T]: ReturnType<T[K]['parse']> }> {
  const base: Schema<{ [K in keyof T]: ReturnType<T[K]['parse']> }> = {
    parse(input: unknown) {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new Error('Expected object');
      }

      const obj = input as Record<string, unknown>;
      const result: Partial<{
        [K in keyof T]: ReturnType<T[K]['parse']>;
      }> = {};

      for (const key of Object.keys(shape) as Array<keyof T>) {
        const schema = shape[key];
        const value = obj[key as string];

        if (value === undefined) {
          if (schema._optional) {
            result[key] = undefined as ReturnType<T[typeof key]['parse']>;
          } else {
            throw new Error(`Missing required key: ${String(key)}`);
          }
        } else {
          result[key] = schema.parse(value) as ReturnType<
            T[typeof key]['parse']
          >;
        }
      }

      return result as { [K in keyof T]: ReturnType<T[K]['parse']> };
    },
    optional: () => optional(base),
  };
  return base;
}

export const z = {
  string,
  boolean,
  array,
  object,
};

export default z;

import { vi } from 'vitest';

type UseRouter = typeof import('next/navigation').useRouter;
type UseSearchParams = typeof import('next/navigation').useSearchParams;
type UsePathname = typeof import('next/navigation').usePathname;
type Router = ReturnType<UseRouter>;
type SearchParams = ReturnType<UseSearchParams>;
type Pathname = ReturnType<UsePathname>;
type NextNavigationExports = {
  useRouter: UseRouter;
  useSearchParams: UseSearchParams;
  usePathname: UsePathname;
  notFound: typeof import('next/navigation').notFound;
  redirect: typeof import('next/navigation').redirect;
};

type SearchParamsInit =
  | string
  | URLSearchParams
  | Record<string, string | string[]>;

const toURLSearchParams = (init: SearchParamsInit = ''): URLSearchParams => {
  if (typeof init === 'string') {
    return new URLSearchParams(init);
  }

  if (init instanceof URLSearchParams) {
    return new URLSearchParams(init);
  }

  const params = new URLSearchParams();
  Object.entries(init).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((entry) => params.append(key, entry));
  });
  return params;
};

export function createMockSearchParams(init?: SearchParamsInit) {
  const params = toURLSearchParams(init);
  const searchParams = {
    get: params.get.bind(params),
    getAll: params.getAll.bind(params),
    has: params.has.bind(params),
    keys: params.keys.bind(params),
    values: params.values.bind(params),
    entries: params.entries.bind(params),
    forEach: params.forEach.bind(params),
    append: params.append.bind(params),
    delete: params.delete.bind(params),
    set: params.set.bind(params),
    sort: params.sort.bind(params),
    toString: params.toString.bind(params),
  } as unknown as SearchParams;

  return { params, searchParams };
}

export const setMockSearchParams = (init?: SearchParamsInit) => {
  const { searchParams, params } = createMockSearchParams(init);
  searchParamsMock.mockImplementation(() => searchParams);
  return { params, searchParams };
};

export const resetMockSearchParams = () => setMockSearchParams();

export function createMockRouter(overrides: Partial<Router> = {}) {
  return ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  }) as Router;
}

const routerMock = vi.fn<UseRouter>(() => createMockRouter());
const searchParamsMock = vi.fn<UseSearchParams>(() => createMockSearchParams().searchParams);
const pathnameMock = vi.fn<UsePathname>(() => '/' as Pathname);

export const setMockRouter = (overrides: Partial<Router> = {}) => {
  const router = createMockRouter(overrides);
  routerMock.mockImplementation(() => router);
  return router;
};

export const resetMockRouter = () => setMockRouter();

export const setMockPathname = (pathname: string) => {
  pathnameMock.mockReturnValue(pathname as Pathname);
  return pathname;
};

export const resetMockPathname = () => setMockPathname('/');

export const createNextNavigationModuleMock = () => {
  return {
    useRouter: routerMock as unknown as UseRouter,
    useSearchParams: searchParamsMock as unknown as UseSearchParams,
    usePathname: pathnameMock as unknown as UsePathname,
    notFound: vi.fn() as unknown as typeof import('next/navigation').notFound,
    redirect: vi.fn() as unknown as typeof import('next/navigation').redirect,
  } satisfies NextNavigationExports;
};

export const resetNextNavigationMocks = () => {
  resetMockRouter();
  resetMockSearchParams();
  resetMockPathname();
};

type FetchArgs = Parameters<typeof fetch>;
type FetchReturn = ReturnType<typeof fetch>;

export const mockGlobalFetch = (
  implementation?: (...args: FetchArgs) => FetchReturn,
) => {
  const originalFetch = global.fetch;
  const fetchMock = vi.fn<(...args: FetchArgs) => FetchReturn>(implementation);
  global.fetch = fetchMock as unknown as typeof fetch;

  return {
    fetchMock,
    restore: () => {
      global.fetch = originalFetch;
    },
    reset: () => {
      fetchMock.mockReset();
      if (implementation) {
        fetchMock.mockImplementation(implementation);
      }
    },
  };
};

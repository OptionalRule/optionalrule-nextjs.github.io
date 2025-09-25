import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const createDefaultAlchemyState = () => ({
  loading: false,
  error: null,
  potions: [],
  ingredients: [],
  ingredientOptions: [],
});

const createDefaultQueryState = () => ({
  q: '',
  ingredients: [] as string[],
  ingMode: 'any' as const,
  alchLvl: 0,
});

vi.mock('../hooks/useAlchemyData', () => ({
  useAlchemyData: vi.fn(() => createDefaultAlchemyState()),
}));

vi.mock('../hooks/useQueryState', () => ({
  useQueryState: vi.fn(() => [createDefaultQueryState(), vi.fn()]),
}));

vi.mock('../hooks/usePotionFilters', () => ({
  usePotionFilters: vi.fn(() => ({ results: [], count: 0 })),
}));

vi.mock('../lib/persist', () => ({
  getSaveEnabled: vi.fn(() => false),
  setSaveEnabled: vi.fn(),
  readPersistedFilters: vi.fn(() => null),
  writePersistedFilters: vi.fn(),
  clearPersistedFilters: vi.fn(),
}));

const searchBarSpy = vi.fn((props: { value: string; onChange: (value: string) => void }) => (
  <div>
    <span data-testid="search-value">{props.value}</span>
    <button data-testid="search-change" onClick={() => props.onChange('new search')}>
      change search
    </button>
  </div>
));

const filtersPanelSpy = vi.fn(
  (props: {
    ingredientOptions: Array<{ value: string; label: string }>;
    selectedIngredientIds: string[];
    ingredientMode: string;
    onChangeIngredients: (ids: string[]) => void;
    onChangeIngredientMode: (mode: string) => void;
    onClearAll: () => void;
    alchemyLevel: number;
    onChangeAlchemyLevel: (level: number) => void;
  }) => (
    <div data-testid="filters">
      {props.ingredientMode}
      <button data-testid="clear-filters" onClick={() => props.onClearAll()}>
        clear
      </button>
    </div>
  )
);

const potionListSpy = vi.fn((props: { potions: Array<{ id: string; name: string }>; selectedIngredientIds: string[]; playerAlchemyLevel: number }) => (
  <div data-testid="potion-list">{props.potions.map((p) => p.name).join(',')}</div>
));

vi.mock('../components/SearchBar', () => ({
  SearchBar: (props: { value: string; onChange: (value: string) => void }) => searchBarSpy(props),
}));

vi.mock('../components/FiltersPanel', () => ({
  FiltersPanel: (props: {
    ingredientOptions: Array<{ value: string; label: string }>;
    selectedIngredientIds: string[];
    ingredientMode: string;
    onChangeIngredients: (ids: string[]) => void;
    onChangeIngredientMode: (mode: string) => void;
    onClearAll: () => void;
    alchemyLevel: number;
    onChangeAlchemyLevel: (level: number) => void;
  }) => filtersPanelSpy(props),
}));

vi.mock('../components/PotionList', () => ({
  PotionList: (props: { potions: Array<{ id: string; name: string }>; selectedIngredientIds: string[]; playerAlchemyLevel: number }) => potionListSpy(props),
}));

import { useAlchemyData } from '../hooks/useAlchemyData';
import { useQueryState } from '../hooks/useQueryState';
import { usePotionFilters } from '../hooks/usePotionFilters';
import { getSaveEnabled, setSaveEnabled, readPersistedFilters, writePersistedFilters, clearPersistedFilters } from '../lib/persist';

const mockUseAlchemyData = vi.mocked(useAlchemyData);
const mockUseQueryState = vi.mocked(useQueryState);
const mockUsePotionFilters = vi.mocked(usePotionFilters);
const mockGetSaveEnabled = vi.mocked(getSaveEnabled);
const mockSetSaveEnabled = vi.mocked(setSaveEnabled);
const mockReadPersistedFilters = vi.mocked(readPersistedFilters);
const mockWritePersistedFilters = vi.mocked(writePersistedFilters);
const mockClearPersistedFilters = vi.mocked(clearPersistedFilters);

mockUseAlchemyData.mockReturnValue({
  loading: false,
  error: null,
  potions: [],
  ingredients: [],
  ingredientOptions: [],
});

async function loadComponent() {
  const mod = await import('..');
  return mod.default;
}

const baseQueryState = createDefaultQueryState();

describe('Kcd2Alchemy component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAlchemyData.mockReturnValue({
      loading: false,
      error: null,
      potions: [],
      ingredients: [],
      ingredientOptions: [],
    });
    mockUsePotionFilters.mockReturnValue({ results: [], count: 0 });
    mockUseQueryState.mockReturnValue([baseQueryState, vi.fn()]);
    mockGetSaveEnabled.mockReturnValue(false);
    mockReadPersistedFilters.mockReturnValue(null);
  });

  it('wires hooks into child components and renders potion results', async () => {
    const setQueryState = vi.fn();
    mockUseQueryState.mockReturnValue([
      { ...baseQueryState, q: 'elixir', ingredients: ['wormwood'] },
      setQueryState,
    ]);

    mockUseAlchemyData.mockReturnValue({
      loading: false,
      error: null,
      potions: [{ id: 'p1', name: 'Elixir' }],
      ingredientOptions: [{ value: 'wormwood', label: 'Wormwood' }],
    });

    mockUsePotionFilters.mockReturnValue({
      results: [{ id: 'p1', name: 'Elixir' }],
      count: 1,
    });

    const Component = await loadComponent();

    render(<Component />);

    expect(searchBarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'elixir' })
    );
    expect(filtersPanelSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredientOptions: [{ value: 'wormwood', label: 'Wormwood' }],
        selectedIngredientIds: ['wormwood'],
      })
    );
    expect(potionListSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        potions: [{ id: 'p1', name: 'Elixir' }],
        selectedIngredientIds: ['wormwood'],
      })
    );

    // Trigger search change from child
    const user = userEvent.setup();

    await user.click(screen.getByTestId('search-change'));
    expect(setQueryState).toHaveBeenCalledWith({ q: 'new search' });
  });

  it('hydrates saved filters from persistence on mount', async () => {
    const setQueryState = vi.fn();
    mockUseQueryState.mockReturnValue([
      baseQueryState,
      setQueryState,
    ]);
    mockGetSaveEnabled.mockReturnValue(false);
    mockReadPersistedFilters.mockReturnValue({
      q: 'restored',
      ingredients: ['sage'],
      ingMode: 'only',
      alchemyLevel: 12,
    });

    const Component = await loadComponent();

    render(<Component />);

    await waitFor(() => {
      expect(setQueryState).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'restored',
          ingredients: ['sage'],
          ingMode: 'only',
          alchLvl: 12,
        })
      );
    });

    expect(mockSetSaveEnabled).toHaveBeenCalledWith(true);
    expect(mockWritePersistedFilters).toHaveBeenCalled();
  });

  it('reflects loading and error states from alchemy data hook', async () => {
    mockUseAlchemyData.mockReturnValue({
      loading: true,
      error: null,
      potions: [],
      ingredients: [],
      ingredientOptions: [],
    });

    const Component = await loadComponent();
    const { rerender } = render(<Component />);
    expect(screen.getByText('Loading data.')).toBeInTheDocument();

    mockUseAlchemyData.mockReturnValue({
      loading: false,
      error: 'Something broke',
      potions: [],
      ingredients: [],
      ingredientOptions: [],
    });

    rerender(<Component />);
    expect(screen.getByText('Something broke')).toBeInTheDocument();
    expect(mockClearPersistedFilters).toHaveBeenCalled();
  });
});






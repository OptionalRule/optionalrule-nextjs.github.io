import Fuse from 'fuse.js';
import { SearchIndexItem } from './build-search-index';

export interface SearchResult {
  item: SearchIndexItem;
  score?: number;
  matches?: Fuse.FuseResultMatch[];
}

export interface SearchOptions {
  query: string;
  tags?: string[];
  limit?: number;
}

// Fuse.js configuration
const fuseOptions: Fuse.IFuseOptions<SearchIndexItem> = {
  // Fields to search
  keys: [
    {
      name: 'title',
      weight: 0.7, // Highest weight for title matches
    },
    {
      name: 'excerpt',
      weight: 0.2,
    },
    {
      name: 'tags',
      weight: 0.1,
    },
  ],
  // Search configuration
  threshold: 0.4, // Lower = more strict, higher = more fuzzy
  distance: 100, // Maximum distance for a match
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  // Search in the middle of words too
  ignoreLocation: true,
  // Find matches even if they're not at the beginning
  findAllMatches: true,
};

let fuseInstance: Fuse<SearchIndexItem> | null = null;
let searchIndex: SearchIndexItem[] | null = null;

// Load search index from JSON file
export async function loadSearchIndex(): Promise<SearchIndexItem[]> {
  if (searchIndex) {
    return searchIndex;
  }

  try {
    const response = await fetch('/search-index.json');
    if (!response.ok) {
      throw new Error(`Failed to load search index: ${response.status}`);
    }
    searchIndex = await response.json();
    return searchIndex;
  } catch (error) {
    console.error('Error loading search index:', error);
    return [];
  }
}

// Initialize Fuse instance
async function getFuseInstance(): Promise<Fuse<SearchIndexItem>> {
  if (fuseInstance) {
    return fuseInstance;
  }

  const index = await loadSearchIndex();
  fuseInstance = new Fuse(index, fuseOptions);
  return fuseInstance;
}

// Perform search
export async function performSearch(options: SearchOptions): Promise<SearchResult[]> {
  const { query, tags, limit = 20 } = options;

  if (!query.trim()) {
    return [];
  }

  const fuse = await getFuseInstance();
  const results = fuse.search(query);

  // Filter by tags if specified
  let filteredResults = results;
  if (tags && tags.length > 0) {
    filteredResults = results.filter(result => 
      tags.some(tag => 
        result.item.tags.some(itemTag => 
          itemTag.toLowerCase() === tag.toLowerCase()
        )
      )
    );
  }

  // Limit results
  return filteredResults.slice(0, limit).map(result => ({
    item: result.item,
    score: result.score,
    matches: result.matches,
  }));
}

// Get all available tags from the search index
export async function getSearchTags(): Promise<string[]> {
  const index = await loadSearchIndex();
  const tagsSet = new Set<string>();
  
  index.forEach(item => {
    item.tags.forEach(tag => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet).sort();
}


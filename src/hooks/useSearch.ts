import { useState } from 'react';
import { sanitizeSearchQuery } from '../utils/sanitize';
import { searchRateLimiter } from '../utils/rateLimit';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  status?: string;
  in_production?: boolean;
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
  } | null;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const getDetails = async (id: number, mediaType: 'movie' | 'tv') => {
    const response = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
          'accept': 'application/json'
        }
      }
    );
    return response.json();
  };

  const isUpcoming = (item: SearchResult) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (item.media_type === 'movie') {
      // For movies, check if release date is in the future
      return item.release_date && item.release_date > today;
    } else if (item.media_type === 'tv') {
      // For TV shows, check if it's in production or has upcoming episodes
      return item.in_production || (item.next_episode_to_air?.air_date || '') > today;
    }
    return false;
  };

  const searchMedia = async (query: string) => {
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    if (!sanitizedQuery) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (!searchRateLimiter.canMakeRequest()) {
      setError('Too many requests. Please wait a moment.');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(sanitizedQuery)}&include_adult=false`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('TMDB API Error:', errorData);
        throw new Error(errorData.status_message || `Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter for movies and TV shows only
      const initialResults = data.results.filter((item: SearchResult) => 
        item.media_type === 'movie' || item.media_type === 'tv'
      );

      // Get detailed info for each result
      const detailedResults = await Promise.all(
        initialResults.map(async (item: SearchResult) => {
          const details = await getDetails(item.id, item.media_type);
          return {
            ...item,
            status: details.status,
            in_production: details.in_production,
            next_episode_to_air: details.next_episode_to_air,
            title: item.title || item.name,
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null
          };
        })
      );

      // Filter for upcoming/ongoing content only
      const upcomingResults = detailedResults
        .filter(isUpcoming)
        .slice(0, 10);

      setResults(upcomingResults);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please check your API key and try again.');
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    results,
    isSearching,
    error,
    searchMedia,
    hasSearched
  };
} 
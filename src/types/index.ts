export interface NextEpisode {
  air_date: string;
  episode_number: number;
  season_number: number;
}

export interface Subscription {
  id: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  releaseDate?: string;
  posterUrl?: string | null;
  addedAt: number;
  nextEpisode?: NextEpisode | null;
  inProduction?: boolean;
}

export interface UserData {
  email: string;
  subscriptions: Subscription[];
} 
import { UserData } from '../types';

export const securityUtils = {
  async encryptUserData(data: UserData): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  validateSubscriptionData(data: any) {
    if (!data.tmdbId || typeof data.tmdbId !== 'number') {
      throw new Error('Invalid TMDB ID');
    }
    if (!data.type || !['movie', 'tv'].includes(data.type)) {
      throw new Error('Invalid media type');
    }
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Invalid title');
    }
    return true;
  }
}; 
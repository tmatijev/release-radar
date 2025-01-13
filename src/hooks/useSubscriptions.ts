import { useState, useEffect } from 'react';
import type { Subscription, UserData } from '../types';
import { securityUtils } from '../utils/security';

const updateNextEpisodeInfo = async (subscription: Subscription): Promise<Subscription> => {
  if (subscription.type !== 'tv') return subscription;

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${subscription.tmdbId}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to update next episode for ${subscription.title}`);
      return subscription;
    }

    const data = await response.json();
    return {
      ...subscription,
      nextEpisode: data.next_episode_to_air
    };
  } catch (error) {
    console.error(`Error updating next episode for ${subscription.title}:`, error);
    return subscription;
  }
};

export function useSubscriptions(userEmail: string | null) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptions = async () => {
    if (!userEmail) return;

    try {
      setIsLoading(true);
      const result = await chrome.storage.sync.get(userEmail);
      const userData: UserData = result[userEmail] || { email: userEmail, subscriptions: [] };
      
      // Update next episode information for TV series
      const updatedSubscriptions = await Promise.all(
        userData.subscriptions.map(updateNextEpisodeInfo)
      );

      // Save updated subscriptions back to storage
      await chrome.storage.sync.set({
        [userEmail]: {
          ...userData,
          subscriptions: updatedSubscriptions
        }
      });
      
      // Sort subscriptions by release date
      const sortedSubscriptions = updatedSubscriptions.sort((a, b) => {
        const dateA = a.type === 'tv' ? a.nextEpisode?.air_date : a.releaseDate;
        const dateB = b.type === 'tv' ? b.nextEpisode?.air_date : b.releaseDate;
        
        // Handle cases where dates might be undefined
        if (!dateA) return 1;  // Move items without dates to the end
        if (!dateB) return -1;
        
        return dateA.localeCompare(dateB);
      });

      setSubscriptions(sortedSubscriptions);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSubscription = async (subscription: Omit<Subscription, 'id' | 'addedAt'>) => {
    if (!userEmail) return;

    try {
      const newSubscription: Subscription = {
        ...subscription,
        id: crypto.randomUUID(),
        addedAt: Date.now()
      };

      const newSubscriptions = [...subscriptions, newSubscription].sort((a, b) => {
        const dateA = a.type === 'tv' ? a.nextEpisode?.air_date : a.releaseDate;
        const dateB = b.type === 'tv' ? b.nextEpisode?.air_date : b.releaseDate;
        
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return dateA.localeCompare(dateB);
      });

      await chrome.storage.sync.set({
        [userEmail]: {
          email: userEmail,
          subscriptions: newSubscriptions
        }
      });
      setSubscriptions(newSubscriptions);
    } catch (err) {
      console.error('Failed to add subscription:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [userEmail]);

  const removeSubscription = async (id: string) => {
    if (!userEmail) return;

    try {
      const newSubscriptions = subscriptions.filter(sub => sub.id !== id);
      await chrome.storage.sync.set({
        [userEmail]: {
          email: userEmail,
          subscriptions: newSubscriptions
        }
      });
      setSubscriptions(newSubscriptions);
    } catch (err) {
      console.error('Failed to remove subscription:', err);
      throw err;
    }
  };

  return {
    subscriptions,
    isLoading,
    addSubscription,
    removeSubscription,
    refresh: loadSubscriptions
  };
} 
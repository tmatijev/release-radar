import { Subscription, UserData } from './types';

const CHECK_INTERVAL = 1000 * 60; // Check every minute (for testing)

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const shouldNotify = (subscription: Subscription): boolean => {
  const today = formatDate(new Date());
  
  if (subscription.type === 'movie') {
    return subscription.releaseDate === today;
  } else if (subscription.type === 'tv' && subscription.nextEpisode) {
    return subscription.nextEpisode.air_date === today;
  }
  
  return false;
};

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

const updateAllSubscriptions = async () => {
  try {
    const storage = await chrome.storage.sync.get(null);
    
    for (const [email, userData] of Object.entries(storage)) {
      const data = userData as UserData;
      if (!Array.isArray(data.subscriptions)) continue;

      const updatedSubscriptions = await Promise.all(
        data.subscriptions.map(updateNextEpisodeInfo)
      );

      await chrome.storage.sync.set({
        [email]: {
          ...data,
          subscriptions: updatedSubscriptions
        }
      });
    }
  } catch (error) {
    console.error('Error updating subscriptions:', error);
  }
};

const updateBadge = async () => {
  try {
    // First check if user is logged in
    const token = await chrome.identity.getAuthToken({ interactive: false })
      .catch(() => null);

    if (!token) {
      // Clear badge if not logged in
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const storage = await chrome.storage.sync.get(null);
    let todayReleases = 0;

    Object.values(storage).forEach((userData: UserData) => {
      userData.subscriptions.forEach(subscription => {
        if (shouldNotify(subscription)) {
          todayReleases++;
        }
      });
    });

    if (todayReleases > 0) {
      chrome.action.setBadgeText({ text: todayReleases.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
    chrome.action.setBadgeText({ text: '' });
  }
};

const createNotification = (subscription: Subscription) => {
  const notificationId = `release-radar-${subscription.id}`;
  const notificationOptions: chrome.notifications.NotificationOptions = {
    type: 'basic',
    iconUrl: subscription.posterUrl || 'icon-128.png',
    title: 'Release Radar',
    message: subscription.type === 'tv' 
      ? `New episode of ${subscription.title} airs today!`
      : `${subscription.title} releases today!`,
    priority: 2
  };

  // @ts-ignore
  chrome.notifications.create(notificationId, notificationOptions);
};

const checkReleases = async () => {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: false })
      .catch(() => null);

    if (!token) {
      console.log('No token found');
      return;
    }

    // Update next episode information before checking releases
    await updateAllSubscriptions();

    const storage = await chrome.storage.sync.get(null);
    
    if (!storage || typeof storage !== 'object') {
      console.log('Invalid storage data');
      return;
    }

    Object.entries(storage).forEach(([key, data]: [string, any]) => {
      // Only process valid UserData objects
      if (data && typeof data === 'object' && Array.isArray(data.subscriptions)) {
        data.subscriptions.forEach((subscription: Subscription) => {
          if (shouldNotify(subscription)) {
            createNotification(subscription);
          }
        });
      }
    });

    await updateBadge();
  } catch (error) {
    console.error('Error checking releases:', error);
  }
};

// Remove the clearStorage function and modify onInstalled
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  checkReleases(); // Don't clear storage on install/update
});

// Set up periodic checks
setInterval(checkReleases, CHECK_INTERVAL);

// Listen for alarm
chrome.alarms.create('checkReleases', {
  periodInMinutes: 1 // Check every minute (for testing)
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkReleases') {
    checkReleases();
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

// Listen for auth state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    if (!message.isAuthenticated) {
      // Clear badge and stop notifications when user logs out
      chrome.action.setBadgeText({ text: '' });
    } else {
      // Check releases when user logs in
      checkReleases();
    }
  }
}); 
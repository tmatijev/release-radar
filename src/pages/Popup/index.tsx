import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useSearch } from '../../hooks/useSearch';
import { Subscription } from '../../types';
import '../../styles/popup.css';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

const formatDate = (dateString: string) => {
  if (!dateString) return 'Release date TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getNextReleaseInfo = (item: any) => {
  console.log('Item details:', item); // Debug log
  
  if (item.media_type === 'movie') {
    return item.release_date ? `Releases on ${formatDate(item.release_date)}` : 'Release date TBA';
  } else if (item.media_type === 'tv') {
    if (item.next_episode_to_air) {
      const { season_number, episode_number, air_date } = item.next_episode_to_air;
      return `Next: S${season_number}E${episode_number} on ${formatDate(air_date)}`;
    } else if (item.in_production) {
      return 'New season in production';
    }
  }
  return 'Release date TBA';
};

const isAiringToday = (subscription: Subscription): boolean => {
  const today = new Date().toISOString().split('T')[0];
  
  if (subscription.type === 'movie') {
    return subscription.releaseDate === today;
  } else if (subscription.type === 'tv' && subscription.nextEpisode) {
    return subscription.nextEpisode.air_date === today;
  }
  return false;
};

const Popup: React.FC = () => {
  const { isLoading: authLoading, error: authError, isAuthenticated, userEmail, signIn, signOut } = useAuth();
  const { 
    subscriptions, 
    isLoading: subsLoading,
    addSubscription, 
    removeSubscription 
  } = useSubscriptions(userEmail);
  const { results, isSearching, error: searchError, searchMedia, hasSearched } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Notify background script that popup is opened
    chrome.runtime.sendMessage({ type: 'POPUP_OPENED' });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMedia(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchMedia('');
  };

  const handleSubscribe = async (result: any) => {
    await addSubscription({
      tmdbId: result.id,
      type: result.media_type,
      title: result.title,
      releaseDate: result.release_date,
      posterUrl: result.poster_path,
      nextEpisode: result.next_episode_to_air,
      inProduction: result.in_production
    });
  };

  // Get today's releases
  const todayReleases = subscriptions.filter(isAiringToday);

  return (
    <div className="popup">
      <h1>Release Radar</h1>
      {authError && <div className="error">{authError}</div>}
      {searchError && <div className="error">{searchError}</div>}
      
      {isAuthenticated ? (
        <div className="user-section">
          <p>Signed in as: {userEmail}</p>
          <button 
            onClick={signOut}
            disabled={authLoading}
            className="sign-out-btn"
          >
            {authLoading ? 'Signing out...' : 'Sign out'}
          </button>

          {todayReleases.length > 0 && (
            <div className="airing-today">
              <div className="section-header">
                <h2>🎬 Airing Today</h2>
                <span className="badge">{todayReleases.length}</span>
              </div>
              <ul className="today-list">
                {todayReleases.map(item => (
                  <li key={item.id} className="today-item">
                    {item.posterUrl ? (
                      <img 
                        src={item.posterUrl} 
                        alt={item.title}
                        className="poster-thumb"
                      />
                    ) : (
                      <div className="poster-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                    <div className="today-info">
                      <h3>{item.title}</h3>
                      <p>{item.type === 'tv' && item.nextEpisode ? 
                        `S${item.nextEpisode.season_number}E${item.nextEpisode.episode_number}` :
                        'Movie Release'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies & TV shows..."
                disabled={isSearching}
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={handleClearSearch}
                  className="clear-search-btn"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="search-results">
              <div className="results-header">
                <h2>Search Results</h2>
                <button 
                  onClick={handleClearSearch}
                  className="clear-results-btn"
                >
                  Clear Results
                </button>
              </div>
              <ul className="results-list">
                {results.map(result => (
                  <li key={result.id} className="result-item">
                    {result.poster_path ? (
                      <img 
                        src={result.poster_path} 
                        alt={result.title}
                        className="poster-thumb"
                      />
                    ) : (
                      <div className="poster-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                    <div className="result-info">
                      <h3>{result.title}</h3>
                      <p>{result.media_type.toUpperCase()}</p>
                      <p className="release-info">{getNextReleaseInfo(result)}</p>
                    </div>
                    <button 
                      onClick={() => handleSubscribe(result)}
                      disabled={subscriptions.some(s => 
                        s.tmdbId === result.id && s.type === result.media_type
                      )}
                      className="subscribe-btn"
                    >
                      {subscriptions.some(s => 
                        s.tmdbId === result.id && s.type === result.media_type
                      ) ? 'Subscribed' : 'Subscribe'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.length === 0 && searchQuery && !isSearching && hasSearched && (
            <div className="no-results">
              <p>No upcoming releases found. Try searching for something else!</p>
            </div>
          )}

          <div className="subscriptions">
            <h2>Your Subscriptions</h2>
            {subsLoading ? (
              <p>Loading subscriptions...</p>
            ) : subscriptions.length > 0 ? (
              <ul>
                {subscriptions.map(sub => (
                  <li key={sub.id}>
                    {sub.posterUrl ? (
                      <img 
                        src={sub.posterUrl} 
                        alt={sub.title}
                        className="poster-thumb"
                      />
                    ) : (
                      <div className="poster-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                    <div className="subscription-info">
                      <h3>{sub.title}</h3>
                      <p>{sub.type.toUpperCase()}</p>
                      <p className="release-info">
                        {sub.type === 'tv' ? (
                          sub.nextEpisode ? (
                            `Next: S${sub.nextEpisode.season_number}E${sub.nextEpisode.episode_number} on ${formatDate(sub.nextEpisode.air_date)}`
                          ) : sub.inProduction ? (
                            'New season in production'
                          ) : (
                            'Release date TBA'
                          )
                        ) : sub.releaseDate ? (
                          `Releases on ${formatDate(sub.releaseDate)}`
                        ) : (
                          'Release date TBA'
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeSubscription(sub.id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No subscriptions yet. Search and subscribe to movies or TV shows!</p>
            )}
          </div>
        </div>
      ) : (
        <button 
          onClick={signIn}
          disabled={authLoading}
        >
          {authLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      )}
      {!isOnline && (
        <div className="offline-warning">
          You're offline. Some features may be unavailable.
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
); 
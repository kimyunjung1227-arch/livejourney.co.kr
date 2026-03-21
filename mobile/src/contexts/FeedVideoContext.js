import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FeedVideoContext = createContext(null);

export function FeedVideoProvider({ children }) {
  const [activePlayerId, setActivePlayerId] = useState(null);

  const requestPlay = useCallback((id) => {
    setActivePlayerId(id);
  }, []);

  const release = useCallback((id) => {
    setActivePlayerId((cur) => (cur === id ? null : cur));
  }, []);

  const clearAll = useCallback(() => setActivePlayerId(null), []);

  const value = useMemo(
    () => ({ activePlayerId, requestPlay, release, clearAll }),
    [activePlayerId, requestPlay, release, clearAll]
  );

  return <FeedVideoContext.Provider value={value}>{children}</FeedVideoContext.Provider>;
}

export function useFeedVideo() {
  const ctx = useContext(FeedVideoContext);
  if (!ctx) {
    return {
      activePlayerId: null,
      requestPlay: () => {},
      release: () => {},
      clearAll: () => {},
    };
  }
  return ctx;
}

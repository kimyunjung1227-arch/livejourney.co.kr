import React, { createContext, useState, useContext } from 'react';

const TabBarContext = createContext();

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within TabBarProvider');
  }
  return context;
};

export const TabBarProvider = ({ children }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const showTabBar = () => setIsTabBarVisible(true);
  const hideTabBar = () => setIsTabBarVisible(false);

  return (
    <TabBarContext.Provider
      value={{
        isTabBarVisible,
        showTabBar,
        hideTabBar,
      }}
    >
      {children}
    </TabBarContext.Provider>
  );
};

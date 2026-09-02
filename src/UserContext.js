import React, { createContext } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ value, children }) => {
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
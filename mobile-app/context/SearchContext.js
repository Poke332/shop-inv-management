import React, { createContext, useContext, useRef, useState } from "react";

// Shared state for the top bar's search input. The query drives the
// home screen's product filter; `homeScrollRef` is set by the home
// screen so the top bar can scroll the results into view after a
// search submit.
const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const homeScrollRef = useRef(null);

  return (
    <SearchContext.Provider value={{ query, setQuery, homeScrollRef }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * For pages that keep their filters in the URL with `history.replaceState`.
 * Returns a key that changes only when the query string changes for some
 * other reason (a sidebar link, Back/Forward), so keying the view on it makes
 * the view re-read the URL instead of keeping stale filters. Call `writeQuery`
 * instead of touching `history` directly.
 */
export function useExternalNavigationKey(): [number, (pathname: string, query: string) => void] {
  const query = useSearchParams().toString();
  // The page's own last write is recorded before the router reports the new
  // URL (that report arrives in a transition), so it is known when compared
  const [written, setWritten] = useState(query);
  const [state, setState] = useState({ query, key: 0 });

  if (query !== state.query) {
    setState({ query, key: query === written ? state.key : state.key + 1 });
  }

  const writeQuery = useCallback((pathname: string, next: string) => {
    setWritten(next);
    window.history.replaceState(null, "", next ? `${pathname}?${next}` : pathname);
  }, []);

  return [state.key, writeQuery];
}

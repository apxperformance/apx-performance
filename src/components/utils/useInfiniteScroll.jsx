import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Custom hook for infinite scrolling with react-query
 * @param {Function} fetchFn - Function to fetch data, receives (cursor, pageSize) and returns array of items
 * @param {Array} queryKey - React Query key
 * @param {number} pageSize - Number of items per page
 * @param {Object} options - Additional react-query options
 */
export function useInfiniteScroll(fetchFn, queryKey, pageSize = 20, options = {}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const items = await fetchFn(pageParam, pageSize);
      return {
        items,
        nextCursor: items.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...options,
  });

  // Flatten all pages into single array
  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const totalLoaded = items.length;

  return {
    items,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    totalLoaded,
  };
}
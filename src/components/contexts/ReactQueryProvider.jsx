import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { handleQueryError, handleMutationError, logError } from '@/components/utils/errorHandler';

// Create a QueryClient instance with global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        const status = error?.response?.status || error?.status;
        if (status >= 400 && status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute default
      onError: (error) => {
        logError(error, { type: 'query' });
        handleQueryError(error);
      },
    },
    mutations: {
      // Global mutation configuration
      retry: false, // Don't retry mutations by default
      onError: (error, variables, context) => {
        logError(error, { type: 'mutation', variables });
        handleMutationError(error);
      },
    },
  },
});

export function ReactQueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
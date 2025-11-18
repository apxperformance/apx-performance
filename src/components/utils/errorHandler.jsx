import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

/**
 * Centralized error handling utility
 * Provides consistent error messages and handling across the application
 */

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  TIMEOUT: "Request timed out. Please try again.",
  
  // Authentication errors
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  
  // Server errors
  SERVER_ERROR: "A server error occurred. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  
  // Client errors
  BAD_REQUEST: "Invalid request. Please check your input and try again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  
  // Generic fallback
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
};

/**
 * Handle API errors consistently
 */
export function handleApiError(error, customMessage = null) {
  console.error('API Error:', error);

  // Extract error details
  const status = error?.response?.status || error?.status;
  const errorMessage = error?.response?.data?.message || error?.message;

  let userMessage = customMessage || ERROR_MESSAGES.GENERIC_ERROR;

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      userMessage = ERROR_MESSAGES.BAD_REQUEST;
      break;
    case 401:
      userMessage = ERROR_MESSAGES.UNAUTHORIZED;
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = createPageUrl("Welcome");
      }, 2000);
      break;
    case 403:
      userMessage = ERROR_MESSAGES.FORBIDDEN;
      break;
    case 404:
      userMessage = ERROR_MESSAGES.NOT_FOUND;
      break;
    case 408:
      userMessage = ERROR_MESSAGES.TIMEOUT;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      userMessage = ERROR_MESSAGES.SERVER_ERROR;
      break;
    default:
      // Check for network errors
      if (!status && (error?.message?.includes('Network') || error?.message?.includes('fetch'))) {
        userMessage = ERROR_MESSAGES.NETWORK_ERROR;
      }
  }

  // Show toast notification
  toast.error(userMessage);

  return {
    status,
    message: userMessage,
    originalError: error,
    details: errorMessage
  };
}

/**
 * Handle mutation errors with react-query
 */
export function handleMutationError(error, customMessage = null) {
  return handleApiError(error, customMessage);
}

/**
 * Handle query errors with react-query
 */
export function handleQueryError(error, customMessage = null) {
  // For queries, we might want to be less intrusive
  // Only show toast for critical errors, not 404s for empty data
  const status = error?.response?.status || error?.status;
  
  if (status === 404) {
    // Don't show toast for 404 on queries - let the UI handle empty states
    console.warn('Query returned 404:', error);
    return;
  }

  return handleApiError(error, customMessage);
}

/**
 * Log errors (can be extended to send to external service)
 */
export function logError(error, context = {}) {
  console.error('Error logged:', {
    error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });

  // In production, you could send this to an error tracking service:
  // if (import.meta.env.MODE === 'production') {
  //   // Send to Sentry, LogRocket, etc.
  // }
}
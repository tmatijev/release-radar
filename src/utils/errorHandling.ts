export function handleApiError(error: unknown): string {
  // Don't expose internal error details to users
  console.error('API Error:', error); // Log for debugging
  
  if (error instanceof Error) {
    if (error.message.includes('429')) {
      return 'Too many requests. Please try again later.';
    }
    if (error.message.includes('401')) {
      return 'Authentication failed. Please sign in again.';
    }
    if (error.message.includes('404')) {
      return 'Content not found.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
} 
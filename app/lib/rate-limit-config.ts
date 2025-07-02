// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Space creation rate limiting
  spaceCreation: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 spaces per 15 minutes per IP
    message: "You can create up to {maxRequests} spaces per {windowMinutes} minutes. Please try again later."
  },
  
  // Future rate limiting rules can be added here
  // For example:
  // pageCreation: {
  //   windowMs: 5 * 60 * 1000, // 5 minutes
  //   maxRequests: 20, // 20 pages per 5 minutes per IP
  // },
  
  // General settings
  cleanupIntervalMs: 60 * 60 * 1000, // Clean up expired entries every hour
} as const;

export function formatRateLimitMessage(
  config: { maxRequests: number; windowMs: number; message: string },
  timeRemaining?: number
): string {
  const windowMinutes = Math.ceil(config.windowMs / (1000 * 60));
  let message = config.message
    .replace('{maxRequests}', config.maxRequests.toString())
    .replace('{windowMinutes}', windowMinutes.toString());
  
  if (timeRemaining) {
    const waitMinutes = Math.ceil(timeRemaining / (1000 * 60));
    message += ` Try again in ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''}.`;
  }
  
  return message;
} 
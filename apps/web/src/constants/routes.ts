/**
 * Centralized application route constants.
 * Adheres to Clean Code C04: Avoid magic strings across components.
 */
export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  HISTORY: '/history',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];


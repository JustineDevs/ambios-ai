/**
 * MSW (Mock Service Worker) request handlers
 *
 * Define your mock API handlers here. These handlers intercept network requests
 * and return mocked responses, useful for testing and development.
 *
 * @see https://mswjs.io/docs/basics/mocking-responses
 */
// No product endpoints are mocked. Contract tests use explicit fixtures and
// the canonical operation registry rather than inventing a fake route.
export const handlers: never[] = [];

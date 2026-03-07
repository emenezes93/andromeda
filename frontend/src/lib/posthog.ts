import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

if (key) {
  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
  });
}

export const posthogClient = key ? posthog : null;

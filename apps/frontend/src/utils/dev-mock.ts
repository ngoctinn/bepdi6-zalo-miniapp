/**
 * Development & Browser testing mock tokens.
 * Guarded to ensure mock tokens are only provided in development environments.
 */

export const DEV_MOCK_ZALO_TOKEN = import.meta.env.DEV
  ? "test_5746042945227030407"
  : "";

export const DEV_MOCK_LOCATION_CREDENTIALS = {
  token: import.meta.env.DEV ? "dev_browser_mock_location_token" : "",
  accessToken: import.meta.env.DEV ? "dev_browser_mock_access_token" : "",
  latitude: null,
  longitude: null,
} as const;

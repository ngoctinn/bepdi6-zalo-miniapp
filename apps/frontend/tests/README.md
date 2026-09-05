# Header navigation regression

Run Vite from `apps/frontend` with `npm run dev`, then run from the same directory:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/existing/playwright \
TEST_BROWSER_EXECUTABLE=/absolute/path/to/chromium-or-edge \
node --test tests/header-navigation.test.cjs
```

This uses Node's built-in test runner and an existing Playwright/Chromium installation. It does not add project dependencies. If Playwright is already resolvable, omit `PLAYWRIGHT_MODULE`; if its Chromium is already installed, omit `TEST_BROWSER_EXECUTABLE`. `TEST_BASE_URL` defaults to `http://127.0.0.1:5173`.

All API calls are intercepted with test data. Other external requests are blocked. Each test uses a fresh browser context and touch input. The single-entry cases use Chromium CDP to model a checkout/address page opened as the first entry in an embedded webview; this is a controlled reproduction, not evidence of a particular user's native navigation history.

The suite verifies fallback navigation, replacement without creating a Back loop, normal navigation to the actual previous route, and valid history after reload.

export function isDevelopmentRuntime(): boolean {
  return Boolean(import.meta.env.DEV);
}

export function getBasePath() {
  const urlParams = new URLSearchParams(window.location.search);
  const appEnv = urlParams.get("env");

  if (
    import.meta.env.PROD ||
    appEnv === "TESTING_LOCAL" ||
    appEnv === "TESTING" ||
    appEnv === "DEVELOPMENT"
  ) {
    const appId = window.APP_ID;
    if (!appId) {
      console.warn("window.APP_ID is not defined!");
      return window.BASE_PATH || "";
    }
    return `/zapps/${appId}`;
  }

  return window.BASE_PATH || "";
}

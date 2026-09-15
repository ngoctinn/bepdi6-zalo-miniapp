export function isDevelopmentRuntime(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  const appEnv = urlParams.get("env");
  return (
    appEnv === "DEVELOPMENT" ||
    appEnv === "TESTING" ||
    appEnv === "TESTING_LOCAL"
  );
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
    return `/zapps/${window.APP_ID}`;
  }

  return window.BASE_PATH || "";
}

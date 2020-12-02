export const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;
export const API_KEY = process.env.REACT_APP_API_KEY;
export const APP_ID = process.env.REACT_APP_APP_ID;
export const MEASUREMENT_ID = process.env.REACT_APP_MEASUREMENT_ID;
export const BUCKET_URL = process.env.REACT_APP_BUCKET_URL;
export const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
export const BUGSNAG_API_KEY = process.env.REACT_APP_BUGSNAG_API_KEY;
export const WS_RELAY_URL = process.env.REACT_APP_WS_RELAY_URL;
export const CODE_CHECK_URL = process.env.REACT_APP_CODE_CHECK_URL;
export const IS_BURN = process.env.REACT_APP_IS_BURN;

// Build environment data from CI
export const BUILD_SHA1 = process.env.REACT_APP_BUILD_SHA1 || undefined;
export const BUILD_TAG = process.env.REACT_APP_BUILD_TAG || undefined;
export const BUILD_BRANCH = process.env.REACT_APP_BUILD_BRANCH || undefined;

export const BUILD_REPOSITORY_URL =
  process.env.REACT_APP_BUILD_REPOSITORY_URL || undefined;

export const BUILD_PULL_REQUESTS = (
  process.env.REACT_APP_BUILD_PULL_REQUESTS || ""
)
  .split(",")
  .filter((s) => !!s);

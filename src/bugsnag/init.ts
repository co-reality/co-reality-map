import firebase from "firebase/app";

import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";

import {
  BUGSNAG_API_KEY,
  BUILD_BRANCH,
  BUILD_SHA1,
  BUILD_TAG,
  BUILD_PULL_REQUESTS,
} from "secrets";

if (BUGSNAG_API_KEY) {
  const DEVELOPMENT = "development";
  const TEST = "test";
  const STAGING = "staging";
  const PRODUCTION = "production";
  const SPARKLE_ENVS = [
    "sparkleverse",
    "sparkle1",
    "sparkle2",
    "sparkle3",
    "sparkle4",
    "sparkle5",
    "sparkle6",
    "sparkle7",
    "sparkle8",
    "sparkle9",
    "sparkle10",
    "bigtop",
    "deloitte",
    "env/kotr",
    "env/memrise",
    "env/unesco",
    "env/ohbm",
    "env/pa",
    "env/demo",
    "env/unity",
    "env/clever",
    "env/burn",
    "env/burn-staging",
    "env/github",
    "env/summit-hack",
  ];

  const releaseStage = () => {
    if (
      window.location.host.includes("localhost") ||
      process.env.NODE_ENV === DEVELOPMENT
    ) {
      return DEVELOPMENT;
    }

    if (process.env.NODE_ENV === TEST) {
      return TEST;
    }

    if (
      window.location.host.includes(STAGING) ||
      BUILD_BRANCH?.includes(STAGING)
    ) {
      return STAGING;
    }

    if (BUILD_BRANCH?.includes("master")) {
      return PRODUCTION;
    }

    if (BUILD_BRANCH !== undefined && SPARKLE_ENVS.includes(BUILD_BRANCH)) {
      return BUILD_BRANCH;
    }

    return process.env.NODE_ENV;
  };

  Bugsnag.start({
    apiKey: BUGSNAG_API_KEY,
    plugins: [new BugsnagPluginReact()],
    appType: "client",
    appVersion: BUILD_SHA1,
    enabledReleaseStages: [STAGING, PRODUCTION, ...SPARKLE_ENVS], // don't track errors in development/test
    releaseStage: releaseStage(),
    maxEvents: 25,
    metadata: {
      BUILD_SHA1,
      BUILD_TAG,
      BUILD_BRANCH,
      BUILD_PULL_REQUESTS,
    },
    onError: (event) => {
      const { currentUser } = firebase.auth();

      if (!currentUser) return;

      // Add user context to help locate related errors for support
      event.setUser(
        currentUser.uid,
        currentUser.email || undefined,
        currentUser.displayName || undefined
      );
    },
  });
}

// NOTE: the assumption is that BugSnag is started for any non-falsy API key, see previous if block
export const isBugsnagStarted = !!BUGSNAG_API_KEY;

export const addToBugsnagEventOnError: typeof Bugsnag.addOnError = BUGSNAG_API_KEY
  ? (fn) => Bugsnag.addOnError(fn)
  : () => {
      // Bugsnag isn't started, this stub will prevent console warnings saying .addOnError() has been called before .start()
    };

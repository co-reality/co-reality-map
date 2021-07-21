// NOTE: do not include any other files here, try to keep this component separate from the rest

import React from "react";
import { OnErrorCallback } from "@bugsnag/core";
import Bugsnag from "@bugsnag/js";

import { isBugsnagStarted } from "./init";
import { ErrorPrompt } from "./ErrorPrompt";

interface BugsnagErrorBoundaryProps {
  onError?: OnErrorCallback;
  FallbackComponent?: React.ComponentType<{
    error: Error;
    info: React.ErrorInfo;
    clearError: () => void;
  }>;
}

const ErrorBoundaryStub: React.FC<BugsnagErrorBoundaryProps> = ({
  children,
}) => {
  // NOTE: has same interface as Bugsnag's error boundary component to prevent React complaining props are being set to a React.Fragment
  return <>{children}</>;
};

const MaybeErrorBoundary = isBugsnagStarted
  ? Bugsnag.getPlugin("react")?.createErrorBoundary(React) ?? ErrorBoundaryStub
  : ErrorBoundaryStub;

export const BugsnagErrorBoundary: React.FC<BugsnagErrorBoundaryProps> = ({
  children,
}) => {
  return (
    <MaybeErrorBoundary FallbackComponent={ErrorPrompt}>
      {children}
    </MaybeErrorBoundary>
  );
};

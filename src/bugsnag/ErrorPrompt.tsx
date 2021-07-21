// NOTE: do not include any other files here, try to keep this component separate from the rest

import React from "react";

import "./ErrorPrompt.scss";

const CHUNK_NOT_IN_CACHE = /Loading chunk [\d]+ failed/;

const LOAD_ERROR_TITLE = `Refresh that page! \u{02728}\u{1F942}\u{1F4A5}\u{1F37E}\u{1F389} (Loading Error)`;
const LOAD_ERROR_MESSAGE = `
Seems we are out of sync.
Pop open that cork, please refresh your page to get the latest, most Sparkly version of this space.
If the problem persists after refresh, take a screenshot and get in touch
`;

const UNEXPECTED_ERROR_TITLE = `We got bugs! \u{1F997}\u{1F41B}\u{1F577}\u{0FE0F}\u{1F41E}\u{1F351} (Unexpected Error)`;
const UNEXPECTED_ERROR_MESSAGE = `
Try clearing the error and if that fails, reload the page.
If that fails, get a glass and a sheet of paper, catch the bug, and take it outside.
If the problem persists after refresh, take a screenshot and get in touch
`;

const MAILTO_LINK = `support@sparkle.space`;

export interface ChunkLoadError extends Error {
  type?: string;
  request?: string;
}

export interface FallbackComponentProps {
  error: Error | ChunkLoadError;
  info: React.ErrorInfo;
  clearError: () => void;
}

export const isChunkLoadError = (error?: unknown): error is ChunkLoadError =>
  error instanceof Error && error.name === "ChunkLoadError";

export const ErrorPrompt: React.FC<FallbackComponentProps> = ({
  error,
  info,
  clearError,
}) => {
  const chunkLoadError = isChunkLoadError(error) ? error : undefined;

  // To avoid reload on syntax error, check the file is not in browser cache as well
  // @see https://github.com/webpack/webpack.js.org/issues/4479#issuecomment-649416798
  const isMissingInCache = CHUNK_NOT_IN_CACHE.test(error.message);

  const title =
    chunkLoadError && isMissingInCache
      ? LOAD_ERROR_TITLE
      : UNEXPECTED_ERROR_TITLE;

  const message = isMissingInCache
    ? LOAD_ERROR_MESSAGE
    : UNEXPECTED_ERROR_MESSAGE;

  return (
    <div className="ErrorPrompt">
      <div className="ErrorPrompt__modal">
        <h4 className="ErrorPrompt__title">{title}</h4>
        <div className="ErrorPrompt__row--vertical ErrorPrompt__message">
          {message} [
          <a className="ErrorPrompt__mailto" href={"mailto:" + MAILTO_LINK}>
            {MAILTO_LINK}
          </a>
          ]
        </div>
        <div className="ErrorPrompt__row ErrorPrompt__buttons">
          {!isMissingInCache && (
            <button
              className="ErrorPrompt__button ErrorPrompt__button--normal"
              type="button"
              onClick={clearError}
            >
              Clear Error
            </button>
          )}

          <button
            className="ErrorPrompt__button ErrorPrompt__button--primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>

        {!isMissingInCache && (
          <div className="ErrorPrompt__row">
            <span className="ErrorPrompt__name">Error Description:</span>
            <span className="ErrorPrompt__value--inline">{error.message}</span>
          </div>
        )}
        {isMissingInCache && chunkLoadError && (
          <div className="ErrorPrompt__row">
            <span className="ErrorPrompt__name">Missing File:</span>
            <span className="ErrorPrompt__value--inline">
              {chunkLoadError.request}
            </span>
          </div>
        )}
        {isMissingInCache && chunkLoadError && (
          <div className="ErrorPrompt__row">
            <span className="ErrorPrompt__name">Type of Error:</span>
            <span className="ErrorPrompt__value--inline">
              {chunkLoadError.type}
            </span>
          </div>
        )}
        <div className="ErrorPrompt__row ErrorPrompt__row--vertical">
          <div className="ErrorPrompt__name">Component Stack:</div>
          <textarea
            className="ErrorPrompt__value--preformatted"
            readOnly
            value={info.componentStack}
          />
        </div>
      </div>
    </div>
  );
};

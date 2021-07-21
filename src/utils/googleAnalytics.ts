import { event, initialize, pageview } from "react-ga";
import { REACT_APP_GA_MEASUREMENT_ID } from "secrets";

export const initGoogleAnalytics = () => {
  if (REACT_APP_GA_MEASUREMENT_ID) {
    initialize(REACT_APP_GA_MEASUREMENT_ID, {
      debug: true,
    });
    pageview(window.location.pathname + window.location.search);
  }
};

export const logEventGoogleAnalytics = ({
  eventCategory,
  eventAction,
  eventLabel,
}: Record<string, string>) => {
  if (REACT_APP_GA_MEASUREMENT_ID) {
    event({
      category: eventCategory,
      action: eventAction,
      label: eventLabel,
    });
  }
};

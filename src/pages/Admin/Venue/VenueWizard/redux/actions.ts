import * as ActionTypes from "./actionTypes";

import { WizardAction } from "./types";

export const setBannerURL = (
  dispatch: React.Dispatch<WizardAction>,
  url?: string
) => dispatch({ type: ActionTypes.SET_BANNER_URL, payload: url });

export const setSquareLogoUrl = (
  dispatch: React.Dispatch<WizardAction>,
  url?: string
) => dispatch({ type: ActionTypes.SET_SQUARE_LOGO_URL, payload: url });

// Action Types
import * as ActionTypes from "./actionTypes";

export interface WizardState {
  bannerImageUrl?: string;
  logoImageUrl?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  showGrid?: boolean;
  columns?: number;
}

export interface SetBannerUrl {
  type: typeof ActionTypes.SET_BANNER_URL;
  payload?: string;
}

export interface SetSquareLogoUrl {
  type: typeof ActionTypes.SET_SQUARE_LOGO_URL;
  payload?: string;
}

export interface SetFormValues {
  type: typeof ActionTypes.SET_FORM_VALUES;
  payload: {
    name?: string;
    subtitle?: string;
    description?: string;
    showGrid?: boolean;
    columns?: number;
  };
}

export type WizardAction = SetBannerUrl | SetSquareLogoUrl | SetFormValues;

export interface WizardReducer {
  state: WizardState;
  action: WizardAction;
}

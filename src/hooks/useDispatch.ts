// eslint-disable-next-line no-restricted-imports
import { useDispatch as _useDispatch } from "react-redux";

import { AppDispatch } from "store";

export const useDispatch = () => _useDispatch<AppDispatch>();

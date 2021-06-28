import React, { useCallback, useEffect } from "react";

// Components
import Details from "pages/Admin/Details";
import WithNavigationBar from "components/organisms/WithNavigationBar";

// Hooks
import { useFirestore } from "react-redux-firebase";

// Typings
import { Venue_v2 } from "types/venues";
import { VenueWizardEditProps } from "./VenueWizardEdit.types";

// Reducer
import { setBannerURL, setSquareLogoUrl } from "../redux/actions";
import { SET_FORM_VALUES } from "../redux";

const VenueWizardEdit: React.FC<VenueWizardEditProps> = ({
  venueId,
  state,
  dispatch,
}) => {
  // get the venue
  const firestore = useFirestore();

  const fetchVenueFromAPI = useCallback(async () => {
    const venueSnapshot = await firestore
      .collection("venues")
      .doc(venueId)
      .get();

    if (!venueSnapshot.exists) return;
    const data = venueSnapshot.data() as Venue_v2;
    dispatch({
      type: SET_FORM_VALUES,
      payload: {
        name: data.name,
        subtitle: data.config?.landingPageConfig?.subtitle,
        description: data.config?.landingPageConfig?.description,
        showGrid: data.showGrid,
        columns: data.columns,
      },
    });
    setBannerURL(dispatch, data.config?.landingPageConfig?.coverImageUrl);
    setSquareLogoUrl(dispatch, data.host?.icon);
  }, [dispatch, firestore, venueId]);

  useEffect(() => {
    fetchVenueFromAPI();
  }, [dispatch, fetchVenueFromAPI, firestore, venueId]);

  return (
    <WithNavigationBar>
      <Details data={state} dispatch={dispatch} />
    </WithNavigationBar>
  );
};

export default VenueWizardEdit;

import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import classNames from "classnames";

import { AnyVenue, isPartyMapVenue } from "types/venues";

import { useShowHide } from "hooks/useShowHide";

import { WithId } from "utils/id";

import { AdminVenueCard } from "components/molecules/AdminVenueCard";
import { CreateVenueModal } from "components/molecules/CreateVenueModal";

import "./AdminVenues.scss";

export interface AdminVenuesProps {
  venues: WithId<AnyVenue>[];
}

export const AdminVenues: React.FC<AdminVenuesProps> = ({ venues }) => {
  const {
    isShown: isModalVisible,
    show: showModal,
    hide: hideModal,
  } = useShowHide();

  const renderedPartyVenues = useMemo(
    () =>
      venues
        ?.filter(isPartyMapVenue)
        .map((venue) => <AdminVenueCard key={venue.id} venue={venue} />),
    [venues]
  );

  const hasVenues = renderedPartyVenues.length > 0;

  return (
    <div className="admin-venue">
      <div className="admin-venue__header">
        <div className="admin-venue__title">Admin Dashboard</div>
        <Button onClick={showModal}>Create a new space</Button>
      </div>
      <div
        className={classNames("admin-venue__cards", {
          "admin-venue__cards--empty": !hasVenues,
        })}
      >
        {!hasVenues && (
          <>
            <div className="admin-venue__title">Welcome!</div>
            <div className="admin-venue__title">
              Create your first Sparkle space
            </div>
          </>
        )}
        {hasVenues && renderedPartyVenues}
      </div>
      <CreateVenueModal isVisible={isModalVisible} onHide={hideModal} />
    </div>
  );
};

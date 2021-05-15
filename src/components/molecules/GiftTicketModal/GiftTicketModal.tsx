import React from "react";

import { GIFT_TICKET_URL } from "settings";

import "./GiftTicketModal.scss";

// @debt Burning man component, can we remove this?
export const GiftTicketModal: React.FC = () => {
  return (
    <div className="gift_ticket-modal-container">
      <div className="gift_ticket-title">Gift a ticket</div>
      <div className="gift_ticket-text">
        Invite that awesome friend, make the Burn twice as good!
      </div>
      <a
        href={GIFT_TICKET_URL}
        target={"_blank"}
        rel={"noopener noreferrer"}
        className={"btn button btn-primary"}
      >
        Gift a ticket
      </a>
    </div>
  );
};

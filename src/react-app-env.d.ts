/// <reference types="react-scripts" />

declare module "*.m4a" {
  const src: string;
  export default src;
}

declare module "react-eventbrite-popup-checkout" {
  interface PropType {
    ebEventId: string;
    className: string;
    isModal?: boolean;
    onOrderComplete?: () => void;
  }
  const EventbriteButton: React.FunctionComponent<PropType>;
  export default EventbriteButton;
}

import { PersonalizedVenueEvent } from "types/venues";
import { VenueEvent } from "types/venues";
import { eventEndTime, eventStartTime } from "utils/event";
import { WithVenueId } from "utils/id";
import { getFullVenueInsideUrl } from "utils/url";

import ical from "ical-generator";

export const createCalendar = (
  allEvents: PersonalizedVenueEvent[] | WithVenueId<VenueEvent>[],
  calendarname: string
) => {
  const cal = ical({ name: calendarname });

  if (!cal) return;

  allEvents.map((event: PersonalizedVenueEvent | WithVenueId<VenueEvent>) =>
    cal.createEvent({
      id: event.venueId,
      start: eventStartTime(event),
      end: eventEndTime(event),
      description: event.host,
      summary: event.name ? event.host : "",
      url: getFullVenueInsideUrl(event.venueId),
    })
  );

  const outputCal = cal.toURL();
  const outputFile = `${calendarname}.ics`;
  const link = document.createElement("a");
  link.download = outputFile;
  link.href = outputCal;
  link.click();
};
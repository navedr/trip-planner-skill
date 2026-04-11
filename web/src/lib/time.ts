import moment from "moment";

/** Format a message timestamp using moment.js calendar-relative format. */
export function formatTimestamp(ts: number): string {
  return moment(ts).calendar(null, {
    sameDay: "h:mm A",
    lastDay: "[Yesterday] h:mm A",
    lastWeek: "ddd h:mm A",
    sameElse: "MMM D, h:mm A",
  });
}

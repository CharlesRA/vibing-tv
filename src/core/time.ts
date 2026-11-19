// dayjs with durations, shared by every module that measures time.
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";

dayjs.extend(duration);

export { dayjs };

// How long the server keeps looking in the transcript for an event's explanation and steps.
export const ENRICH_WINDOW = dayjs.duration(2, "minutes");

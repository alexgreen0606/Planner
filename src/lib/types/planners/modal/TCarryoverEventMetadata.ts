export type TCarryoverEventMetadata = {
  id: string;
  index: number | null; // null means the event has moved to a new planner
};

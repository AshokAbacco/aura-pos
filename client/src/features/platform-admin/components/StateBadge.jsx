import { Badge } from "../../../components/ui";
import { STATE_LABEL, STATE_TONE } from "../utils/platform.constants.js";

export const StateBadge = ({ state }) => (
  <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state] ?? state}</Badge>
);

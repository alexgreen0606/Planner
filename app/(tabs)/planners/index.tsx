import { getTodayDatestamp } from "@/utils/dateUtils";
import { Redirect } from "expo-router";

// ✅ 

const RerouteToTodayPlanner = () => (
    <Redirect href={`/planners/${getTodayDatestamp()}`} />
);

export default RerouteToTodayPlanner;

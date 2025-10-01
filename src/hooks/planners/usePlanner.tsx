import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { getDayOfWeekFromDatestamp } from "@/utils/dateUtils";
import { createEmptyPlanner, updatePlannerEventIndexWithChronologicalCheck, upsertRecurringEventsIntoPlanner } from "@/utils/plannerUtils";
import { useEffect } from "react";
import { useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";

// ✅ 

export type TUsePlannerData = {
    planner: TPlanner;
    onUpdatePlannerEventIndexWithChronologicalCheck: (
        index: number,
        event: IPlannerEvent
    ) => void;
};

const usePlanner = (datestamp: string): TUsePlannerData => {
    const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });

    const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

    // Build the initial planner with recurring data.
    useEffect(() => {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertRecurringEventsIntoPlanner(newPlanner);
        });
    }, [datestamp]);

    // Upsert recurring events every time the day of week's recurring planner changes.
    useMMKVListener((key) => {
        if (key === getDayOfWeekFromDatestamp(datestamp)) {
            setPlanner((prev) => {
                let newPlanner = prev ?? createEmptyPlanner(datestamp);
                return upsertRecurringEventsIntoPlanner(newPlanner);
            });
        }
    }, recurringPlannerStorage);

    function handleUpdatePlannerEventIndexWithChronologicalCheck(index: number, event: IPlannerEvent) {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return updatePlannerEventIndexWithChronologicalCheck(newPlanner, index, event);
        });
    }

    return {
        planner: planner ?? createEmptyPlanner(datestamp),
        onUpdatePlannerEventIndexWithChronologicalCheck: handleUpdatePlannerEventIndexWithChronologicalCheck,
    }
};

export default usePlanner;
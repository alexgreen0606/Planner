import { EStorageId } from "@/lib/enums/EStorageId";
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";
import { useMMKV, useMMKVObject } from "react-native-mmkv";

const useRecurringPlanner = (recurringPlannerId: string) => {

    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
    const [recurringPlanner] = useMMKVObject<TRecurringPlanner>(recurringPlannerId, recurringStorage);

    return {
        eventIds: recurringPlanner?.eventIds ?? []
    };
};

export default useRecurringPlanner;
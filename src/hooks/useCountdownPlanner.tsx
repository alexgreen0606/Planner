import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { ICountdownEvent } from "@/lib/types/listItems/ICountdownEvent";
import { getCountdownEventFromStorageById, saveCountdownEventToStorage } from "@/storage/countdownStorage";
import { updateCountdownEventIndexWithChronologicalCheck } from "@/utils/countdownUtils";
import { datestampToMidnightJsDate } from "@/utils/dateUtils";
import { uuid } from "expo-modules-core";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { MMKV, useMMKV, useMMKVObject } from "react-native-mmkv";
import useTextfieldItemAs from "./useTextfieldItemAs";

// ✅ 

const useCountdownPlanner = (countdownEventStorage: MMKV) => {
    const countdownPlannerStorage = useMMKV({ id: EStorageId.COUNTDOWN_PLANNER });

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const [countdownPlanner, setCountdownPlanner] = useMMKVObject<string[]>(EStorageKey.COUNTDOWN_LIST_KEY, countdownPlannerStorage);

    const todayMidnight = useMemo(() => datestampToMidnightJsDate(todayDatestamp), [todayDatestamp]);

    const { onSetTextfieldId: onSetFocusedCountdownId } = useTextfieldItemAs<ICountdownEvent>(countdownEventStorage);

    function handleCreateCountdownEventInStorageAndFocusTextfield(index: number) {
        let startIso = DateTime.fromJSDate(todayMidnight).toISO()!;

        // Set the item to have the same date as the event above it.
        if (index !== 0) {
            const parentEventId = countdownPlanner![index - 1];
            const parentEvent = getCountdownEventFromStorageById(parentEventId);
            startIso = parentEvent.startIso;
        }

        const newCountdownEvent = {
            id: uuid.v4(),
            value: '',
            listId: EStorageKey.COUNTDOWN_LIST_KEY,
            storageId: EStorageId.COUNTDOWN_EVENT,
            startIso,
            isRecurring: false
        };
        saveCountdownEventToStorage(newCountdownEvent);

        // Add the event to its planner.
        setCountdownPlanner((prev) => {
            const newCountdownPlanner = prev ? [...prev] : [];
            newCountdownPlanner.splice(index, 0, newCountdownEvent.id);
            return newCountdownPlanner;
        });

        onSetFocusedCountdownId(newCountdownEvent.id);
    }

    function handleUpdateCountdownEventIndexWithChronologicalCheck(index: number, event: ICountdownEvent) {
        setCountdownPlanner((prev) => {
            const newPlanner = prev ?? [];
            return updateCountdownEventIndexWithChronologicalCheck(newPlanner, index, event);
        });
    }

    return {
        countdownEventIds: countdownPlanner ?? [],
        onCreateCountdownEventInStorageAndFocusTextfield: handleCreateCountdownEventInStorageAndFocusTextfield,
        onUpdateCountdownEventIndexWithChronologicalCheck: handleUpdateCountdownEventIndexWithChronologicalCheck
    }
};

export default useCountdownPlanner;
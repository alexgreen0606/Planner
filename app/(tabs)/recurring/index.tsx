import { currentPlannerDatestamp } from '@/atoms/currentPlannerDatestamp';
import Planner from '@/components/lists/Planner';
import usePlanner from '@/hooks/planners/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { useAtomValue } from 'jotai';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

const PlannerPage = () => {
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const datestamp = useAtomValue(currentPlannerDatestamp);

    const {
        planner,
        onUpdatePlannerEventIndexWithChronologicalCheck,
    } = usePlanner(datestamp, eventStorage);

    return null;
};

export default PlannerPage;
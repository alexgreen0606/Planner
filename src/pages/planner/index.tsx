import { currentPlannerDatestamp } from '@/atoms/currentPlannerDatestamp';
import PlannerBanner from '@/components/banner/PlannerBanner';
import GlassIconButton from '@/components/icon/GlassButtonIcon';
import Planner from '@/components/lists/Planner';
import usePlanner from '@/hooks/planners/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { PageProvider } from '@/providers/PageProvider';
import { useAtomValue } from 'jotai';
import React from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

const PlannerPage = () => {
    const datestamp = useAtomValue(currentPlannerDatestamp);
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const {
        planner: { eventIds },
        onUpdatePlannerEventIndexWithChronologicalCheck,
        OverflowActionsIcon
    } = usePlanner(datestamp, eventStorage);

    return (
        <PageProvider
            floatingHeader={
                <PlannerBanner datestamp={datestamp} />
            }
        >
            {/* <View className='px-2 justify-between flex-row'>
                <GlassIconButton systemImage='square.stack' />
                <OverflowActionsIcon />
            </View> */}
            <Planner
                eventIds={eventIds}
                datestamp={datestamp}
                eventStorage={eventStorage}
                onUpdatePlannerEventIndexWithChronologicalCheck={onUpdatePlannerEventIndexWithChronologicalCheck}
            />
        </PageProvider>
    )
};

export default PlannerPage;
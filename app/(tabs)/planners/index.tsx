import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import OverflowActions, { EOverflowActionType, TOverflowAction } from '@/components/OverflowActions';
import GenericIcon from '@/components/icon';
import PlannerCard from '@/components/lists/PlannerCard';
import ScrollContainerAnchor from '@/components/ScrollContainerAnchor';
import { NULL } from '@/lib/constants/generic';
import { PLANNER_SET_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { EStorageId } from '@/lib/enums/EStorageId';
import { getAllPlannerSetTitles } from '@/storage/plannerSetsStorage';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';

// ✅ 

const Planners = () => {
    const plannerSetStorage = useMMKV({ id: EStorageId.PLANNER_SETS });
    const router = useRouter();

    const [plannerSetKey, setPlannerSetKey] = useAtom(plannerSetKeyAtom);
    const { planner } = useAtomValue(mountedDatestampsAtom);

    function buildPlannerSetActions(): TOverflowAction[] {
        const allPlannerSetTitles = getAllPlannerSetTitles();
        return ['Next 7 Days', ...allPlannerSetTitles].map((title) => ({
            title,
            type: EOverflowActionType.BUTTON,
            onPress: () => setPlannerSetKey(title),
            value: plannerSetKey === title
        }));
    }

    const [plannerSetActions, setPlannerSetActions] = useState<TOverflowAction[]>(buildPlannerSetActions());

    // Re-build the list of planner set options whenever they change in storage.
    useMMKVListener(() => {
        setPlannerSetActions(buildPlannerSetActions());
    }, plannerSetStorage);

    // Re-build the list of planner set options whenever the selected planner set changes.
    useEffect(() => {
        setPlannerSetActions(buildPlannerSetActions());
    }, [plannerSetKey]);

    return (
        <View className='flex-1'>

            {/* Planner Set Selection */}
            <View className='px-3 pt-3 flex-row justify-between items-center w-full'>
                <OverflowActions label={plannerSetKey} actions={plannerSetActions} />
                <View className='gap-2 flex-row'>
                    {plannerSetKey !== 'Next 7 Days' && (
                        <GenericIcon
                            type='edit'
                            size='l'
                            platformColor='systemBlue'
                            onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}/${plannerSetKey}`)}
                        />
                    )}
                    <GenericIcon
                        type='add'
                        size='l'
                        platformColor='systemBlue'
                        onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}/${NULL}`)}
                    />
                </View>
            </View>

            {/* Planner Set Display */}
            <View className='p-4 gap-4'>
                {planner.map((datestamp) =>
                    <PlannerCard
                        key={`${datestamp}-planner`}
                        datestamp={datestamp}
                    />
                )}
                <ScrollContainerAnchor />
            </View>

        </View>
    )
};

export default Planners;

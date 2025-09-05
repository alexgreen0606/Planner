import { externalPlannerDataAtom } from '@/atoms/externalPlannerData';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import GenericIcon from '@/components/icon';
import PlannerCard from '@/components/lists/PlannerCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ScrollContainerAnchor from '@/components/ScrollContainerAnchor';
import ButtonText from '@/components/text/ButtonText';
import { NULL } from '@/lib/constants/generic';
import { PLANNER_SET_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { getAllPlannerSetTitles } from '@/storage/plannerSetsStorage';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { View } from 'react-native';

// ✅ 

const defaultPlannerSet = 'Next 7 Days';

const Planners = () => {
    const router = useRouter();

    const [plannerSetKey, setPlannerSetKey] = useAtom(plannerSetKeyAtom);
    const calendarEventData = useAtomValue(externalPlannerDataAtom);
    const { planner } = useAtomValue(mountedDatestampsAtom);

    const allPlannerSetTitles = getAllPlannerSetTitles(); // TODO: use MMKV to watch this

    const plannerSetOptions = useMemo(() =>
        [defaultPlannerSet, ...allPlannerSetTitles].map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: plannerSetKey === title ? 'on' : 'off',
        })),
        [allPlannerSetTitles]
    );

    // Only 1 planner will be loading at midnight. In this case, don't show loading overlay on page.
    const isLoadingEntirePlanner = useMemo(() =>
        planner.reduce((acc, datestamp) => {
            if (calendarEventData.plannersMap[datestamp] === undefined) {
                acc++;
                return acc;
            }
            return acc;
        }, 0) > 1,
        [planner, calendarEventData]
    );

    return isLoadingEntirePlanner ? (
        <LoadingSpinner />
    ) : (
        <View className='flex-1'>

            {/* Planner Set Selection */}
            <View className='px-3 pt-3 flex-row justify-between items-center w-full'>
                <MenuView
                    onPressAction={({ nativeEvent }) => {
                        setPlannerSetKey(nativeEvent.event)
                    }}
                    actions={plannerSetOptions as MenuAction[]}
                    shouldOpenOnLongPress={false}
                >
                    <ButtonText>
                        {plannerSetKey}
                    </ButtonText>
                </MenuView>
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
            <MotiView
                className='p-4 gap-4'
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    type: 'timing',
                    duration: 800,
                }}
            >
                {planner.map((datestamp) =>
                    <PlannerCard
                        key={`${datestamp}-planner`}
                        datestamp={datestamp}
                    />
                )}
                <ScrollContainerAnchor />
            </MotiView>

        </View>
    )
};

export default Planners;

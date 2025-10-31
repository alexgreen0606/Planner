import { currentWeatherChipAtom } from '@/atoms/currentWeatherChip';
import { plannerChipsByDatestamp } from '@/atoms/plannerChips';
import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { useAtomValue } from 'jotai';
import React from 'react';
import Animated from 'react-native-reanimated';
import PlannerChip from '.';

// ✅ 

type TPlannerChipSetsProps = {
    datestamp: string;
};

const PlannerChipSets = ({
    datestamp
}: TPlannerChipSetsProps) => {
    const currentWeatherChip = useAtomValue(currentWeatherChipAtom);
    const sets = useAtomValue(plannerChipsByDatestamp(datestamp));
    const todayDatestamp = useAtomValue(todayDatestampAtom);

    // Include the current weather in today's planner's chip set.
    const allSets = datestamp === todayDatestamp && currentWeatherChip ? [[currentWeatherChip], ...sets] : sets;

    return (
        <Animated.View className="flex-row flex-wrap gap-2">
            {allSets.map((set, setIndex) =>
                set.map((chip) => (
                    <PlannerChip
                        {...chip}
                        key={`${datestamp}-${chip.title}-${setIndex}`}
                    />
                )))}
        </Animated.View>
    )
};

export default PlannerChipSets;

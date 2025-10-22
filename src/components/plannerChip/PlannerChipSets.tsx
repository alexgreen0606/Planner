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
    backgroundPlatformColor?: string;
};

const PlannerChipSets = ({
    datestamp,
    ...rest
}: TPlannerChipSetsProps) => {
    const currentWeatherChip = useAtomValue(currentWeatherChipAtom);
    const todayDatestamp = useAtomValue(todayDatestampAtom);

    const sets = useAtomValue(plannerChipsByDatestamp(datestamp));

    // Include the current weather in today's planner's chip set.
    const allSets = datestamp === todayDatestamp && currentWeatherChip ? [[currentWeatherChip], ...sets] : sets;

    return (
        <Animated.View className="flex-row flex-wrap gap-2">
            {allSets.map((set, setIndex) =>
                set.map((chip, chipIndex) => (
                    <PlannerChip
                        index={chipIndex}
                        key={`${datestamp}-${chip.title}-${setIndex}`}
                        chip={chip}
                        {...rest}
                    />
                )))}
        </Animated.View>
    );
};

export default PlannerChipSets;

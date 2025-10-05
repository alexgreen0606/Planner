import { currentWeatherChipAtom } from '@/atoms/currentWeatherChip';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerChipsByDatestamp } from '@/atoms/plannerChips';
import { useAtomValue } from 'jotai';
import React from 'react';
import { View } from 'react-native';
import PlannerChip from '.';
import FadeInView from '../views/FadeInView';
import Animated, { SequencedTransition } from 'react-native-reanimated';

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
    const { today } = useAtomValue(mountedDatestampsAtom);

    const sets = useAtomValue(plannerChipsByDatestamp(datestamp));

    // Include the current weather in today's planner's chip set.
    const allSets = datestamp === today && currentWeatherChip ? [[currentWeatherChip], ...sets] : sets;

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

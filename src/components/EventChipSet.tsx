import React from 'react';
import { View } from 'react-native';
import EventChip from './EventChip';
import { TEventChip } from '@/types/planner/TEventChip';

export interface EventChipSetsProps {
    datestamp: string;
    sets: TEventChip[][];
    collapsed?: boolean;
    toggleCollapsed?: () => void;
    backgroundPlatformColor?: string;
}

const EventChipSets = ({
    datestamp,
    sets,
    collapsed = false,
    toggleCollapsed,
    backgroundPlatformColor
}: EventChipSetsProps) =>
    <View className='flex-row min-h-6 min-w-6 flex-wrap w-full'>
        {sets.map((set, setIndex) => (
            set.map((chip, chipIndex) =>
                <EventChip
                    key={`${datestamp}-chips-set-${setIndex}-chip-${chipIndex}`}
                    {...chip}
                    chipSetIndex={chipIndex}
                    // Ensure the first chip in each set shifts right when collapsed. Exclude the first set.
                    shiftChipRight={chipIndex === 0 && setIndex !== 0 && collapsed}
                    collapsed={collapsed}
                    toggleCollapsed={toggleCollapsed}
                    backgroundPlatformColor={backgroundPlatformColor}
                />
            )
        ))}

    </View>

export default EventChipSets;
import { LINEAR_ANIMATION_CONFIG } from '@/constants/animations';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import EventChip from './EventChip';
import { EventChipSet } from './plannerCard';

const Chip = Animated.createAnimatedComponent(View);

const COLLAPSED_CHIP_RIGHT_MARGIN = -18;
const EXPANDED_CHIP_LEFT_MARGIN = 6;

const CHIP_SET_GAP = 24;

export interface EventChipSetsProps {
    sets: EventChipSet[];
    collapsed: boolean;
    datestamp: string;
}

const EventChipSets = ({
    datestamp,
    sets,
    collapsed
}: EventChipSetsProps) => {
    const chipMarginRight = useSharedValue(COLLAPSED_CHIP_RIGHT_MARGIN);

    useEffect(() => {
        if (collapsed) {
            chipMarginRight.value = withTiming(COLLAPSED_CHIP_RIGHT_MARGIN, LINEAR_ANIMATION_CONFIG);
        } else {
            chipMarginRight.value = withTiming(EXPANDED_CHIP_LEFT_MARGIN, LINEAR_ANIMATION_CONFIG);
        }
    }, [collapsed]);

    const getChipStyle = useCallback((chipIndex: number, shiftRight: boolean) => useAnimatedStyle(() => {
        return {
            // Chips stack with the firstly rendered on top
            zIndex: 9000 + (40 / (chipIndex + 1)),
            marginLeft: shiftRight ? CHIP_SET_GAP : 0,
            marginRight: chipMarginRight.value
        }
    }), []);

    return (
        <View className='flex-row min-h-6 min-w-6 flex-wrap w-full'>
            {sets.map((set, setIndex) => (
                set.map((chip, chipIndex) =>
                    <Chip
                        key={`${datestamp}-chips-set-${setIndex}-chip-${chipIndex}`}
                        style={getChipStyle(
                            chipIndex,
                            // Ensure the first chip in each set shifts right when collapsed. Exclude the first set.
                            chipIndex === 0 && setIndex !== 0 && collapsed
                        )}
                    >
                        <EventChip
                            {...chip}
                            collapsed={collapsed}
                        />
                    </Chip>
                )
            ))}

        </View>
    );
};

export default EventChipSets;
import { MotiView } from 'moti';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import EventChip from '.';
import SlowFadeInView from '../SlowFadeInView';
import { useAtomValue } from 'jotai';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { currentWeatherChipAtom } from '@/atoms/currentWeatherChip';
import { plannerChipsByDatestamp } from '@/atoms/plannerChips';

// ✅ 

type TEventChipSetsProps = {
    datestamp: string;
    collapsed?: boolean;
    backgroundPlatformColor?: string;
    onToggleCollapsed?: () => void;
};

const COLLAPSED_HEIGHT = 24;

const EventChipSets = ({
    datestamp,
    collapsed = false,
    onToggleCollapsed,
    backgroundPlatformColor,
}: TEventChipSetsProps) => {
    const currentWeatherChip = useAtomValue(currentWeatherChipAtom);
    const { today } = useAtomValue(mountedDatestampsAtom);

    const contentRef = useRef(null);

    const [expandedHeight, setExpandedHeight] = useState<number | null>(null);

    const sets = useAtomValue(plannerChipsByDatestamp(datestamp));

    // Include the current weather in today's planner's chip set.
    const allSets = datestamp === today && currentWeatherChip ? [[currentWeatherChip], ...sets] : sets;

    return (
        <SlowFadeInView>
            <MotiView
                animate={{
                    minHeight: collapsed ? COLLAPSED_HEIGHT : expandedHeight,
                }}
                className="w-full overflow-hidden"
                transition={{ type: 'timing', duration: 300 }}
            >
                <View
                    ref={contentRef}
                    onLayout={(event) => {
                        const height = event.nativeEvent.layout.height;
                        setExpandedHeight(height);
                    }}
                    className="flex-row flex-wrap"
                >
                    {allSets.map((set, setIndex) =>
                        set.map((chip, chipIndex) => (
                            <EventChip
                                key={`${datestamp}-chips-set-${setIndex}-chip-${chipIndex}`}
                                chip={chip}
                                parentPlannerDatestamp={datestamp}
                                chipSetIndex={chipIndex}
                                shiftChipRight={
                                    chipIndex === 0 && setIndex !== 0 && collapsed
                                }
                                collapsed={collapsed}
                                onToggleCollapsed={onToggleCollapsed}
                                backgroundPlatformColor={backgroundPlatformColor}
                            />
                        )))}
                </View>
            </MotiView>
        </SlowFadeInView>
    );
};

export default EventChipSets;

import { TCalendarEventChip } from '@/lib/types/calendar/TCalendarEventChip';
import { MotiView } from 'moti';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import EventChip from '.';

// ✅ 

type TEventChipSetsProps = {
    datestamp: string;
    sets: TCalendarEventChip[][];
    collapsed?: boolean;
    backgroundPlatformColor?: string;
    onToggleCollapsed?: () => void;
};

const COLLAPSED_HEIGHT = 24;

const EventChipSets = ({
    datestamp,
    sets,
    collapsed = false,
    onToggleCollapsed,
    backgroundPlatformColor,
}: TEventChipSetsProps) => {
    const contentRef = useRef(null);

    const [expandedHeight, setExpandedHeight] = useState<number | null>(null);

    return (
        <MotiView
            animate={{
                minHeight: collapsed ? COLLAPSED_HEIGHT : expandedHeight,
            }}
            className='w-full overflow-hidden'
            transition={{ type: 'timing', duration: 300 }}
        >
            <View
                ref={contentRef}
                onLayout={(event) => {
                    const height = event.nativeEvent.layout.height;
                    setExpandedHeight(height);
                }}
                className='flex-row flex-wrap'
            >
                {sets.map((set, setIndex) =>
                    set.map((chip, chipIndex) => (
                        <EventChip
                            key={`${datestamp}-chips-set-${setIndex}-chip-${chipIndex}`}
                            chip={chip}
                            parentPlannerDatestamp={datestamp}
                            chipSetIndex={chipIndex}
                            shiftChipRight={chipIndex === 0 && setIndex !== 0 && collapsed}
                            collapsed={collapsed}
                            onToggleCollapsed={onToggleCollapsed}
                            backgroundPlatformColor={backgroundPlatformColor}
                        />
                    ))
                )}
            </View>
        </MotiView>
    )
};

export default EventChipSets;
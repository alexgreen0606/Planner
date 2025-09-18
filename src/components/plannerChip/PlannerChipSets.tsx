import { MotiView } from 'moti';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import PlannerChip from '.';
import SlowFadeInView from '../SlowFadeInView';
import { useAtomValue } from 'jotai';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { currentWeatherChipAtom } from '@/atoms/currentWeatherChip';
import { plannerChipsByDatestamp } from '@/atoms/plannerChips';

// ✅ 

type TPlannerChipSetsProps = {
    datestamp: string;
    collapsed?: boolean;
    backgroundPlatformColor?: string;
    onToggleCollapsed?: () => void;
};

const COLLAPSED_HEIGHT = 24;

const PlannerChipSets = ({
    datestamp,
    collapsed = false,
    ...rest
}: TPlannerChipSetsProps) => {
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
                            <PlannerChip
                                key={`${datestamp}-chips-set-${setIndex}-chip-${chipIndex}`}
                                chipSetIndex={chipIndex}
                                chip={chip}
                                parentPlannerDatestamp={datestamp}
                                shiftChipRight={
                                    chipIndex === 0 && setIndex !== 0 && collapsed
                                }
                                collapsed={collapsed}
                                {...rest}
                            />
                        )))}
                </View>
            </MotiView>
        </SlowFadeInView>
    );
};

export default PlannerChipSets;

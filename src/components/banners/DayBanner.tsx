import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import CustomText, { textStyles } from '@/components/text/CustomText';
import WeatherDisplay from '@/components/weather';
import { TPlannerChip } from '@/lib/types/calendar/TPlannerChip';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React from 'react';
import { PlatformColor, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import EventChipSets from '../eventChip/EventChipSet';

// ✅ 

type TDayBannerProps = {
    planner: TPlanner;
    isEditingTitle: boolean;
    collapsed: boolean;
    eventChipSets: TPlannerChip[][];
    onEditTitle: (title: string) => void;
    onToggleEditTitle: () => void;
    onToggleCollapsed: () => void;
};

const DayBanner = ({
    planner,
    isEditingTitle,
    collapsed,
    eventChipSets,
    onEditTitle,
    onToggleEditTitle,
    onToggleCollapsed
}: TDayBannerProps) => {
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);

    // TODO: memoize
    const dayOfWeek = getDayOfWeekFromDatestamp(planner.datestamp);
    const monthDate = getMonthDateFromDatestamp(planner.datestamp);
    const isTomorrow = planner.datestamp === getTomorrowDatestamp();

    const prioritizeDayOfWeek = plannerSetKey === 'Next 7 Days';

    return (
        <TouchableOpacity onPress={onToggleCollapsed}>
            <View className='flex-row justify-between items-center w-full'>

                {/* Date */}
                <View className='flex-1'>
                    <View className='flex-row flex-1 items-center'>
                        <CustomText variant='plannerCardDetail'>
                            {prioritizeDayOfWeek ? monthDate : dayOfWeek}
                        </CustomText>
                        {(planner.title || isEditingTitle || isTomorrow) && (
                            <View
                                className='h-full mx-2'
                                style={{
                                    width: StyleSheet.hairlineWidth,
                                    backgroundColor: PlatformColor('systemGray')
                                }}
                            />
                        )}
                        {isTomorrow && !isEditingTitle && !planner.title && (
                            <CustomText variant='plannerCardSoftDetail'>
                                Tomorrow
                            </CustomText>
                        )}
                        {isEditingTitle ? (
                            <TextInput
                                autoFocus
                                value={planner.title}
                                autoCapitalize='words'
                                onChangeText={onEditTitle}
                                onBlur={onToggleEditTitle}
                                style={textStyles.plannerCardSoftDetail}
                            />
                        ) : (
                            <CustomText
                                variant='plannerCardSoftDetail'
                                ellipsizeMode='tail'
                                numberOfLines={1}
                            >
                                {planner.title}
                            </CustomText>
                        )}
                    </View>
                    <CustomText className='-mt-0.25' variant='plannerCardHeader'>
                        {prioritizeDayOfWeek ? dayOfWeek : monthDate}
                    </CustomText>
                </View>

                {/* Weather */}
                <WeatherDisplay
                    high={97}
                    low={74}
                />

            </View>

            <EventChipSets
                datestamp={planner.datestamp}
                sets={eventChipSets}
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
            />

        </TouchableOpacity>
    )
};

export default DayBanner;
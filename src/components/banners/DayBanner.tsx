import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import CustomText, { textStyles } from '@/components/text/CustomText';
import WeatherDisplay from '@/components/weather';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { savePlannerToStorage } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import { PlatformColor, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import EventChipSets from '../eventChip/EventChipSet';
import { TCalendarEventChip } from '@/lib/types/calendar/TCalendarEventChip';

// ✅ 

type DayBannerProps = {
    planner: TPlanner;
    forecast?: WeatherForecast;
    isEditingTitle: boolean;
    collapsed: boolean;
    eventChipSets: TCalendarEventChip[][];
    onEndEditTitle: () => void;
    onToggleCollapsed: () => void;
};

const DayBanner = ({
    planner,
    forecast,
    isEditingTitle,
    collapsed,
    eventChipSets,
    onToggleCollapsed,
    onEndEditTitle
}: DayBannerProps) => {
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);

    const [newPlannerTitle, setNewPlannerTitle] = useState(planner.title);

    // TODO: memoize
    const dayOfWeek = getDayOfWeekFromDatestamp(planner.datestamp);
    const monthDate = getMonthDateFromDatestamp(planner.datestamp);
    const isTomorrow = planner.datestamp === getTomorrowDatestamp();

    const prioritizeDayOfWeek = plannerSetKey === 'Next 7 Days';

    useEffect(() => {
        setNewPlannerTitle(planner.title);
    }, [planner.title])

    // =======================
    // 1. Event Handlers
    // =======================

    function handlePlannerTitleSave() {
        savePlannerToStorage(planner.datestamp, {
            ...planner,
            title: newPlannerTitle.trim()
        });
        onEndEditTitle();
    }

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
                                value={newPlannerTitle}
                                editable={isEditingTitle}
                                onChangeText={setNewPlannerTitle}
                                onSubmitEditing={handlePlannerTitleSave}
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
                {forecast && (
                    <WeatherDisplay
                        high={forecast.temperatureMax}
                        low={forecast.temperatureMin}
                        weatherCode={forecast.weatherCode}
                    />
                )}

            </View>

            <EventChipSets
                datestamp={planner.datestamp}
                sets={eventChipSets}
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
            />

        </TouchableOpacity>
    );
}

export default DayBanner;
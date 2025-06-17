import CustomText from '@/components/text/CustomText';
import WeatherDisplay from '@/components/weather';
import { savePlannerToStorage } from '@/storage/plannerStorage';
import { datestampToDayOfWeek, datestampToMonthDate, getNextEightDayDatestamps, getTomorrowDatestamp } from '@/utils/dateUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import React, { useEffect, useState } from 'react';
import { PlatformColor, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import EventChipSets from '../eventChip/EventChipSet';
import { TEventChip } from '@/lib/types/planner/TEventChip';
import { TPlanner } from '@/lib/types/planner/TPlanner';

interface DayBannerProps {
    planner: TPlanner;
    toggleCollapsed: () => void;
    forecast?: WeatherForecast;
    isEditingTitle: boolean;
    collapsed: boolean;
    endEditTitle: () => void;
    eventChipSets: TEventChip[][];
}

const DayBanner = ({
    planner,
    toggleCollapsed,
    forecast,
    isEditingTitle,
    endEditTitle,
    collapsed,
    eventChipSets
}: DayBannerProps) => {
    const [newPlannerTitle, setNewPlannerTitle] = useState(planner.title);

    const nextEightDays = getNextEightDayDatestamps();
    const isWithinEightDays = nextEightDays.includes(planner.datestamp);
    const dayOfWeek = datestampToDayOfWeek(planner.datestamp);
    const monthDate = datestampToMonthDate(planner.datestamp);
    const isTomorrow = planner.datestamp === getTomorrowDatestamp();

    function handlePlannerTitleSave() {
        savePlannerToStorage(planner.datestamp, {
            ...planner,
            title: newPlannerTitle.trim()
        });
        endEditTitle();
    }

    useEffect(() => {
        setNewPlannerTitle(planner.title);
    }, [planner.title])

    return (
        <TouchableOpacity onPress={toggleCollapsed}>
            <View className='flex-row justify-between items-center w-full'>

                {/* Date */}
                <View className='flex-1'>
                    <View className='flex-row flex-1'>
                        <CustomText
                            type='subHeader'
                            style={{ color: PlatformColor('label') }}
                        >
                            {isWithinEightDays ? monthDate : dayOfWeek}
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
                            <CustomText type='subHeader'>
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
                                style={{
                                    color: PlatformColor('secondaryLabel'),
                                    fontSize: 12,
                                    paddingRight: 12,
                                    flex: 1
                                }}
                            />
                        ) : (
                            <CustomText
                                type='subHeader'
                                style={{
                                    color: PlatformColor('secondaryLabel'),
                                    fontSize: 12,
                                    paddingRight: 12,
                                    flex: 1
                                }}
                                ellipsizeMode='tail'
                                numberOfLines={1}
                            >
                                {planner.title}
                            </CustomText>
                        )}
                    </View>
                    <CustomText type='header'>
                        {isWithinEightDays ? dayOfWeek : monthDate}
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
                toggleCollapsed={toggleCollapsed}
            />
            
        </TouchableOpacity>
    );
}

export default DayBanner;
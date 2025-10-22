import { calendarMapAtom } from '@/atoms/calendarAtoms';
import { calendarIconMap } from '@/lib/constants/calendarIcons';
import { getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import * as Calendar from 'expo-calendar';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from './icons/Icon';
import CustomText from './text/CustomText';
import DateValue from './text/DateValue';
import { todayDatestampAtom } from '@/atoms/todayDatestamp';

type TUpcomingDateCardProps = {
    datestamp: string;
    events: Calendar.Event[];
    index: number;
}

const UpcomingDateCard = ({ datestamp, events, index }: TUpcomingDateCardProps) => {
    const router = useRouter();

    const todayDatestamp = useAtomValue(todayDatestampAtom);
    const calendarMap = useAtomValue(calendarMapAtom);

    const countdownLabel = useMemo(() => {
        let countdownLabel = '';

        const daysUntilDate = getDaysUntilIso(datestamp);

        if (datestamp === getTodayDatestamp()) {
            countdownLabel = 'Today';
        } else if (datestamp === getTomorrowDatestamp()) {
            countdownLabel = 'Tomorrow';
        } else if (daysUntilDate > 0) {
            countdownLabel = `${daysUntilDate} days away`;
        }

        return countdownLabel;
    }, [todayDatestamp, datestamp]);

    function handleOpenPlanner() {
        router.push(`/planners/${datestamp}`);
    }

    return (
        <View className="flex-row p-4 gap-2" style={{
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: PlatformColor('systemGray'),
            borderTopWidth: index === 0 ? StyleSheet.hairlineWidth : 0
        }}>
            {/* Date */}
            <TouchableOpacity
                onPress={handleOpenPlanner}
                activeOpacity={0.7}
                style={{ width: 60 }}
            >
                <DateValue isoTimestamp={datestamp} platformColor='secondaryLabel' />
            </TouchableOpacity>

            {/* Events */}
            <View className="flex-1 gap-3">
                {events.map((event) => {
                    const calendar = calendarMap[event.calendarId];
                    const calendarName = calendar?.title || 'Calendar';
                    const iconName = calendarIconMap[calendarName] || calendarIconMap['Calendar'];
                    const color = calendar?.color || '#000000';

                    return (
                        <View key={`${event.id}-upcoming-event`} className="flex-row items-center gap-2">
                            <Icon
                                name={iconName}
                                color={color}
                                size={16}
                            />
                            <CustomText
                                variant='eventChipLabel'
                                customStyle={{
                                    color: PlatformColor('label'),
                                    flexShrink: 1,
                                    flexWrap: 'wrap',
                                    fontSize: 14
                                }}
                            >
                                {event.title}
                            </CustomText>
                        </View>
                    );
                })}
            </View>

            {/* Countdown */}
            <View className="w-20 items-end">
                <CustomText
                    variant='microDetail'
                >
                    {countdownLabel}
                </CustomText>
            </View>
        </View>
    )
};

export default UpcomingDateCard;

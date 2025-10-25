import { calendarMapAtom } from '@/atoms/calendarAtoms';
import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { calendarIconMap } from '@/lib/constants/calendarIcons';
import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { openEditEventModal, openViewEventModal } from '@/utils/plannerUtils';
import * as Calendar from 'expo-calendar';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from './icons/Icon';
import CustomText from './text/CustomText';
import DateValue from './text/DateValue';

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

    function handleOpenEventModal(event: Calendar.Event, calendar: Calendar.Calendar) {
        if (calendar.allowsModifications) {
            openEditEventModal(event.id, datestamp);
        } else {
            openViewEventModal(event.id);
        }
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
                activeOpacity={PRESSABLE_OPACITY}
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
                        <TouchableOpacity
                            onPress={() => handleOpenEventModal(event, calendar)}
                            activeOpacity={PRESSABLE_OPACITY}
                            className="flex-row items-center gap-2"
                            key={`${event.id}-upcoming-event`}
                        >
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
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Countdown */}
            <View className="w-22 items-end">
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

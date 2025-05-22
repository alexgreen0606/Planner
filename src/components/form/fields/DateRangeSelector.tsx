import { getTodayDatestamp } from '@/utils/dateUtils';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

interface DateRangeSelectorProps {
    startDatestamp: string | null;
    endDatestamp: string | null;
    onChange: (start: string | null, end: string | null) => void;
    multiDay?: boolean;
}

const DateRangeSelector = ({
    startDatestamp,
    endDatestamp,
    onChange,
    multiDay
}: DateRangeSelectorProps) => {

    // Range of dates between start and end date
    const markedDates = useMemo(() => {
        if (!startDatestamp || !endDatestamp) {
            return {};
        }

        const marks: any = {};
        const start = DateTime.fromISO(startDatestamp);
        const end = DateTime.fromISO(endDatestamp);

        let current = start;
        while (current <= end) {
            const dateStr = current.toISODate() ?? '';
            marks[dateStr] = {
                selected: true,
                selectedColor: 'transparent',
                customStyles: {
                    container: {
                        borderColor: PlatformColor('systemTeal'),
                        borderWidth: 1
                    }
                }
            };
            current = current.plus({ days: 1 });
        }

        return marks;
    }, [startDatestamp, endDatestamp]);

    function handleDayPress(day: { dateString: string }) {
        const { dateString } = day;

        // Case 1: Single day selection or first selection of multiday
        if (!multiDay || !startDatestamp) {
            onChange(dateString, dateString);
            return;
        }

        // Case 2: If clicked on start or end date, clear selection
        if (dateString === startDatestamp || dateString === endDatestamp) {
            onChange(null, null);
            return;
        }

        // Case 3: If start equals end (single day selected)
        if (startDatestamp === endDatestamp) {
            if (dateString > startDatestamp) {
                // Clicked date is greater - set as end date
                onChange(startDatestamp, dateString);
            } else {
                // Clicked date is less - set as start date
                onChange(dateString, startDatestamp);
            }
            return;
        }

        // Case 4: Determine which boundary to move
        const clicked = DateTime.fromISO(dateString);
        const start = DateTime.fromISO(startDatestamp);
        const end = DateTime.fromISO(endDatestamp!);

        const startDistance = Math.abs(clicked.diff(start).milliseconds);
        const endDistance = Math.abs(clicked.diff(end).milliseconds);
        if (startDistance < endDistance) {
            // Closer to start date, move start date
            onChange(dateString, endDatestamp);
        } else {
            // Closer or equal to end date, move end date
            onChange(startDatestamp, dateString);
        }
    }

    // Single-day mode sets end date equal to start date.
    useEffect(() => {
        if (!multiDay) onChange(startDatestamp, startDatestamp);
    }, [multiDay]);

    return (
        <View className='w-full'>
            <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                minDate={getTodayDatestamp()}
                hideExtraDays
                enableSwipeMonths
                disableAllTouchEventsForDisabledDays
                markingType='custom'
                theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    todayTextColor: PlatformColor('systemTeal'),
                    dayTextColor: PlatformColor('label'),
                    textDisabledColor: PlatformColor('tertiaryLabel'),
                    monthTextColor: PlatformColor('label'),
                    arrowColor: PlatformColor('systemBlue'),
                    disabledArrowColor: PlatformColor('tertiaryLabel')
                }}
            />
        </View>
    );
};

export default DateRangeSelector;
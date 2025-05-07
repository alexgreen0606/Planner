import React, { useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { datestampToMidnightDate, getTodayDatestamp } from '../timestampUtils';
import ModalDisplayValue from '../../components/modal/ModalDisplayValue';
import DateValue from './values/DateValue';
import ThinLine from '../../sortedLists/components/list/ThinLine';

interface CalendarSelectProps {
    dates: string[];
    onChange: (dates: string[]) => void;
}

const CalendarSelect = ({
    dates,
    onChange
}: CalendarSelectProps) => {
    const [monthIndex, setMonthIndex] = useState(0);

    const handleDayPress = (day: { dateString: string }) => {
        const { dateString } = day;
        const [startDate, endDate] = dates.length > 0 ? [dates[0], dates[dates.length - 1]] : [null, null];
        let newRange;

        if (startDate === dateString) {
            newRange = { startDate: null, endDate: null };
        } else if (!startDate) {
            // Start new range
            newRange = { startDate: dateString, endDate: dateString };
        } else if (!endDate) {
            // Set end date
            if (dateString < startDate) {
                newRange = { startDate: dateString, endDate: startDate };
            } else {
                newRange = { startDate, endDate: dateString };
            }
        } else {
            // Adjust the existing range
            if (dateString < startDate) {
                newRange = { startDate: dateString, endDate };
            } else {
                newRange = { startDate, endDate: dateString };
            }
        }

        onChange(newRange.startDate ? getDateRangeArray(newRange.startDate, newRange.endDate) : []);
    };

    const getDateRangeArray = (start: string, end: string): string[] => {
        const dates: string[] = [];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const curr = new Date(startDate);

        while (curr <= endDate) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        return dates;
    };

    const getMarkedDates = () => {
        const marks: any = {};
        const [startDate, endDate] = dates.length > 0 ? [dates[0], dates[dates.length - 1]] : [null, null];

        if (startDate && !endDate) {
            marks[startDate] = { selected: true, startingDay: true, endingDay: true, color: PlatformColor('systemBlue'), textColor: 'white' };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            let current = new Date(start);

            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                marks[dateStr] = {
                    color: PlatformColor('systemBlue'),
                    textColor: 'white',
                    startingDay: dateStr === startDate,
                    endingDay: dateStr === endDate
                };
                current.setDate(current.getDate() + 1);
            }
        }

        return marks;
    };

    // Determine if we have a single date or multiple dates
    const hasSingleDate = dates.length === 1;
    const hasMultipleDates = dates.length > 1;

    return (
        <View style={{ width: '100%' }}>
            <Calendar
                onDayPress={handleDayPress}
                markedDates={getMarkedDates()}
                style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                }}
                markingType='period'
                minDate={getTodayDatestamp()}
                hideExtraDays
                disableLeftArrow={monthIndex <= 0}
                onPressArrowLeft={(subtract: () => void) => {
                    setMonthIndex(curr => curr - 1)
                    subtract();
                }}
                onPressArrowRight={(add: () => void) => {
                    setMonthIndex(curr => curr + 1)
                    add();
                }}
                theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: PlatformColor('secondaryLabel'),
                    selectedDayBackgroundColor: PlatformColor('systemBlue'),
                    selectedDayTextColor: 'white',
                    todayTextColor: PlatformColor('systemBlue'),
                    dayTextColor: PlatformColor('label'),
                    textDisabledColor: PlatformColor('tertiaryLabel'),
                    monthTextColor: 'white',
                    arrowColor: PlatformColor('systemBlue'),
                    disabledArrowColor: PlatformColor('tertiaryLabel')
                }}
            />
            <View style={{ marginTop: 16 }}>
                {hasSingleDate && (
                    <ModalDisplayValue
                        label='Date'
                        value={<DateValue date={datestampToMidnightDate(dates[0])} />}
                        hide={false}
                    />
                )}

                {hasMultipleDates && (
                    <>
                        <ModalDisplayValue
                            label='Start Date'
                            value={<DateValue date={datestampToMidnightDate(dates[0])} />}
                            hide={false}
                        />

                        <ThinLine />

                        <ModalDisplayValue
                            label='End Date'
                            value={<DateValue date={datestampToMidnightDate(dates[dates.length - 1])} />}
                            hide={false}
                        />
                    </>
                )}
            </View>
        </View>
    );
};

export default CalendarSelect;

import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import TimeValue from '@/components/text/TimeValue';
import { datestampToDayOfWeek, isoToDatestamp } from '@/utils/dateUtils';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export interface TimeRangeSelectorProps {
    startIso: string;
    endIso: string;
    onChange: (
        start: string,
        end: string
    ) => void;
    allDay?: boolean;
    multiDay?: boolean;
    triggerOpenField?: SelectorMode;
}

export enum SelectorMode {
    START_TIME = 'START_TIME',
    END_TIME = 'END_TIME',
    START_DATE = 'START_DATE',
    END_DATE = 'END_DATE'
}

type TimeData = {
    date: Date;
    dayOfWeek: string;
    datestamp: string; // YYYY-MM-DD
}

const TimeRangeSelector = ({
    startIso,
    endIso,
    onChange,
    allDay,
    multiDay,
    triggerOpenField
}: TimeRangeSelectorProps) => {
    const [isInputOpen, setIsInputOpen] = useState(Boolean(triggerOpenField));
    const [selectorMode, setSelectorMode] = useState<SelectorMode>(SelectorMode.START_TIME);

    const startData: TimeData = useMemo(() => {
        const date = DateTime.fromISO(startIso).toJSDate();
        const datestamp = isoToDatestamp(startIso);
        const dayOfWeek = datestampToDayOfWeek(datestamp);
        return { date, dayOfWeek, datestamp };
    }, [startIso]);

    const endData: TimeData = useMemo(() => {
        const date = DateTime.fromISO(endIso).toJSDate();
        const datestamp = isoToDatestamp(endIso);
        const dayOfWeek = datestampToDayOfWeek(datestamp);
        return { date, dayOfWeek, datestamp };
    }, [endIso]);

    const dateInEdit = [SelectorMode.START_DATE, SelectorMode.START_TIME].includes(selectorMode) ?
        startData.date : endData.date;

    const showEndTime = endIso && multiDay;
    const showTimes = !allDay;

    // ---------- Utility Functions ----------

    function getValueColor(type: SelectorMode) {
        return isInputOpen && type === selectorMode ? 'systemTeal' : 'label';
    }

    function toggleSelectorMode(newMode: SelectorMode) {
        if (newMode === selectorMode && isInputOpen) {
            setIsInputOpen(false);
        } else {
            setIsInputOpen(true);
            setSelectorMode(newMode);
        }
    }

    function resetTimesToMidnight() {
        const newStartDate = DateTime.fromISO(startIso)
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            });
        const newEndDate = DateTime.fromISO(endIso)
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            });

        const newStartIso = newStartDate.toUTC().toISO()!;
        const newEndIso = newEndDate.toUTC().toISO()!;
        onChange(newStartIso, newEndIso);
    }

    function handleChange(event: DateTimePickerEvent) {
        const { timestamp } = event.nativeEvent;

        const inputDate = DateTime.fromMillis(timestamp);
        const currentStartDate = DateTime.fromISO(startIso);
        const currentEndDate = DateTime.fromISO(endIso);

        let newStartDate = currentStartDate;
        let newEndDate = currentEndDate;

        const enforceEndLaterThanStart = () => {
            // If end date is earlier than start date, shift the end date to be on the same day as the start.
            if (newEndDate.startOf('day') < newStartDate.startOf('day')) {
                newEndDate = newStartDate.set({
                    hour: currentEndDate.hour,
                    minute: currentEndDate.minute,
                    second: 0,
                    millisecond: 0
                });
            }
            // If the end date is still earlier than the start, set the times equal.
            if (newEndDate < newStartDate) {
                newEndDate = newStartDate;
            }
        };

        switch (selectorMode) {
            case SelectorMode.START_DATE:
                newStartDate = inputDate.set({
                    hour: currentStartDate.hour,
                    minute: currentStartDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();
                if (showTimes) {
                    setSelectorMode(SelectorMode.START_TIME);
                } else if (showEndTime) {
                    setSelectorMode(SelectorMode.END_DATE);
                }
                break;

            case SelectorMode.START_TIME:
                newStartDate = currentStartDate.set({
                    hour: inputDate.hour,
                    minute: inputDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();
                if (showEndTime) {
                    setSelectorMode(SelectorMode.END_DATE);
                }
                break;

            case SelectorMode.END_DATE:
                newEndDate = inputDate.set({
                    hour: currentEndDate.hour,
                    minute: currentEndDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();
                if (showTimes) {
                    setSelectorMode(SelectorMode.END_TIME);
                }
                break;

            case SelectorMode.END_TIME:
                newEndDate = currentEndDate.set({
                    hour: inputDate.hour,
                    minute: inputDate.minute,
                    second: 0,
                    millisecond: 0
                });
                break;

            default:
                break;
        }

        const newStartIso = newStartDate.toUTC().toISO()!;
        const newEndIso = newEndDate.toUTC().toISO()!;
        onChange(newStartIso, newEndIso);
    }

    // ---------- Reactions ----------

    useEffect(() => {
        if (allDay) {
            resetTimesToMidnight();
            setIsInputOpen(false);
        }
    }, [allDay]);

    useEffect(() => {
        if (triggerOpenField) {
            setSelectorMode(triggerOpenField);
            setIsInputOpen(true);
        }
    }, [triggerOpenField]);

    return (
        <View>
            <View className='flex-row'>
                {startIso && (
                    <View className='flex-1 items-start'>
                        <CustomText variant='softDetail'>
                            {startData.dayOfWeek}
                        </CustomText>
                        <MotiView animate={{
                            transform: [{ scale: getValueColor(SelectorMode.START_DATE) === 'systemTeal' ? 1.1 : 1 }],
                        }}>
                            <TouchableOpacity
                                onPress={() => toggleSelectorMode(SelectorMode.START_DATE)}
                            >
                                <DateValue
                                    isoTimestamp={startIso}
                                    platformColor={getValueColor(SelectorMode.START_DATE)}
                                />
                            </TouchableOpacity>
                        </MotiView>
                        {showTimes && (
                            <MotiView animate={{
                                transform: [{ scale: getValueColor(SelectorMode.START_TIME) === 'systemTeal' ? 1.1 : 1 }]
                            }}>
                                <TouchableOpacity
                                    onPress={() => toggleSelectorMode(SelectorMode.START_TIME)}
                                >
                                    <TimeValue
                                        isoTimestamp={startIso}
                                        platformColor={getValueColor(SelectorMode.START_TIME)}
                                    />
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </View>
                )}
                {showEndTime && (
                    <CustomText variant='indicator'>
                        TO
                    </CustomText>
                )}
                {showEndTime && (
                    <View className='flex-1 items-end'>
                        <CustomText variant='softDetail'>
                            {endData.dayOfWeek}
                        </CustomText>
                        <MotiView animate={{
                            transform: [{ scale: getValueColor(SelectorMode.END_DATE) === 'systemTeal' ? 1.1 : 1 }]
                        }}>
                            <TouchableOpacity
                                onPress={() => toggleSelectorMode(SelectorMode.END_DATE)}
                            >
                                <DateValue
                                    isoTimestamp={endIso}
                                    platformColor={getValueColor(SelectorMode.END_DATE)}
                                />
                            </TouchableOpacity>
                        </MotiView>
                        {showTimes && (
                            <MotiView animate={{
                                transform:
                                    [{ scale: getValueColor(SelectorMode.END_TIME) === 'systemTeal' ? 1.2 : 1 }]
                            }}>
                                <TouchableOpacity
                                    onPress={() => toggleSelectorMode(SelectorMode.END_TIME)}
                                >
                                    <TimeValue
                                        isoTimestamp={endIso}
                                        platformColor={getValueColor(SelectorMode.END_TIME)}
                                    />
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </View>
                )}
            </View>
            <MotiView
                animate={{ maxHeight: isInputOpen ? 400 : 0 }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                {[SelectorMode.START_DATE, SelectorMode.END_DATE].includes(selectorMode) ? (
                    <DateTimePicker
                        value={dateInEdit}
                        onChange={handleChange}
                        mode='date'
                        display='inline'
                        minimumDate={selectorMode === SelectorMode.END_DATE ? startData.date : DateTime.local().toJSDate()}
                    />
                ) : (
                    <DateTimePicker
                        value={dateInEdit}
                        onChange={handleChange}
                        mode='time'
                        display='spinner'
                        minuteInterval={5}
                        minimumDate={selectorMode === SelectorMode.END_TIME ? startData.date : undefined}
                    />
                )}
            </MotiView>
        </View>
    )
};

export default TimeRangeSelector;
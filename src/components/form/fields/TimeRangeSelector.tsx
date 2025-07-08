import ModalDisplayValue from '@/components/modal/ModalDisplayValue';
import DateValue from '@/components/text/DateValue';
import TimeValue from '@/components/text/TimeValue';
import ThinLine from '@/components/ThinLine';
import { ETimeSelectorMode } from '@/lib/enums/ETimeSelectorMode';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

type TimeRangeSelectorProps = {
    startIso: string;
    endIso: string;
    allDay?: boolean;
    multiDay?: boolean;
    triggerOpenField?: ETimeSelectorMode;
    onChange: (
        start: string,
        end: string
    ) => void;
};

const TimeRangeSelector = ({
    startIso,
    endIso,
    onChange,
    allDay,
    multiDay,
    triggerOpenField
}: TimeRangeSelectorProps) => {
    const [selectorMode, setSelectorMode] = useState<ETimeSelectorMode | null>(null);

    const startDate: Date = useMemo(() => {
        return DateTime.fromISO(startIso).toJSDate();
    }, [startIso]);

    const endDate: Date = useMemo(() => {
        return DateTime.fromISO(endIso).toJSDate();
    }, [endIso]);

    const showEndTime = endIso && multiDay;
    const showTimes = !allDay;

    // ---------- Utility Functions ----------

    function toggleSelectorMode(newMode: ETimeSelectorMode) {
        if (newMode === selectorMode) {
            setSelectorMode(null);
        } else {
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
            case ETimeSelectorMode.START_DATE:
                newStartDate = inputDate.set({
                    hour: currentStartDate.hour,
                    minute: currentStartDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();

                if (showTimes) {
                    setSelectorMode(ETimeSelectorMode.START_TIME);
                } else if (showEndTime) {
                    setSelectorMode(ETimeSelectorMode.END_DATE);
                }

                break;
            case ETimeSelectorMode.START_TIME:
                newStartDate = currentStartDate.set({
                    hour: inputDate.hour,
                    minute: inputDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();

                if (showEndTime) {
                    setSelectorMode(ETimeSelectorMode.END_DATE);
                }

                break;
            case ETimeSelectorMode.END_DATE:
                newEndDate = inputDate.set({
                    hour: currentEndDate.hour,
                    minute: currentEndDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();

                if (showTimes) {
                    setSelectorMode(ETimeSelectorMode.END_TIME);
                }

                break;
            case ETimeSelectorMode.END_TIME:
                newEndDate = currentEndDate.set({
                    hour: inputDate.hour,
                    minute: inputDate.minute,
                    second: 0,
                    millisecond: 0
                });
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
            setSelectorMode(null);
        }
    }, [allDay]);

    useEffect(() => {
        if (triggerOpenField) {
            setSelectorMode(triggerOpenField);
        }
    }, [triggerOpenField]);

    // ------------- Render Helper Functions -------------

    function getValueColor(type: ETimeSelectorMode) {
        return type === selectorMode ? 'systemTeal' : 'label';
    }

    function getValueMargin(type: ETimeSelectorMode) {
        return type === selectorMode ? 12 : 8;
    }

    function getValueScale(type: ETimeSelectorMode) {
        return type === selectorMode ? 1.1 : 1;
    }

    function getSelectorHeight(type: ETimeSelectorMode) {
        return type === selectorMode ? 400 : 0;
    }

    return (
        <View>

            {/* Start Display */}
            <ModalDisplayValue
                label='Start'
                value={
                    <View className='flex-row items-center'>
                        <MotiView
                            animate={{
                                marginRight: getValueMargin(ETimeSelectorMode.START_DATE),
                                transform: [{ scale: getValueScale(ETimeSelectorMode.START_DATE) }],
                            }}>
                            <TouchableOpacity
                                onPress={() => toggleSelectorMode(ETimeSelectorMode.START_DATE)}
                            >
                                <DateValue
                                    isoTimestamp={startIso}
                                    platformColor={getValueColor(ETimeSelectorMode.START_DATE)}
                                />
                            </TouchableOpacity>
                        </MotiView>
                        {showTimes && (
                            <MotiView animate={{
                                marginLeft: getValueMargin(ETimeSelectorMode.START_TIME),
                                transform: [{ scale: getValueScale(ETimeSelectorMode.START_TIME) }]
                            }}>
                                <TouchableOpacity
                                    onPress={() => toggleSelectorMode(ETimeSelectorMode.START_TIME)}
                                >
                                    <TimeValue
                                        isoTimestamp={startIso}
                                        platformColor={getValueColor(ETimeSelectorMode.START_TIME)}
                                    />
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </View>
                }
            />

            {/* Start Date Picker */}
            <MotiView
                animate={{
                    maxHeight: getSelectorHeight(ETimeSelectorMode.START_DATE)
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                <DateTimePicker
                    value={startDate}
                    onChange={handleChange}
                    mode='date'
                    display='inline'
                    minimumDate={DateTime.local().toJSDate()}
                />
            </MotiView>

            {/* Start Time Picker */}
            <MotiView
                animate={{
                    maxHeight: getSelectorHeight(ETimeSelectorMode.START_TIME)
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                <DateTimePicker
                    value={startDate}
                    onChange={handleChange}
                    mode='time'
                    display='spinner'
                    minuteInterval={5}
                />
            </MotiView>

            {/* Separator */}
            {showEndTime && <ThinLine overflow />}

            {/* End Display */}
            {showEndTime && (
                <ModalDisplayValue
                    label='End'
                    value={showEndTime && (
                        <View className='flex-row items-center'>
                            <MotiView animate={{
                                marginRight: getValueMargin(ETimeSelectorMode.END_DATE),
                                transform: [{ scale: getValueScale(ETimeSelectorMode.END_DATE) }]
                            }}>
                                <TouchableOpacity
                                    onPress={() => toggleSelectorMode(ETimeSelectorMode.END_DATE)}
                                >
                                    <DateValue
                                        isoTimestamp={endIso}
                                        platformColor={getValueColor(ETimeSelectorMode.END_DATE)}
                                    />
                                </TouchableOpacity>
                            </MotiView>
                            {showTimes && (
                                <MotiView animate={{
                                    marginLeft: getValueMargin(ETimeSelectorMode.END_TIME),
                                    transform: [{ scale: getValueScale(ETimeSelectorMode.END_TIME) }]
                                }}>
                                    <TouchableOpacity
                                        onPress={() => toggleSelectorMode(ETimeSelectorMode.END_TIME)}
                                    >
                                        <TimeValue
                                            isoTimestamp={endIso}
                                            platformColor={getValueColor(ETimeSelectorMode.END_TIME)}
                                        />
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                        </View>
                    )}
                />
            )}

            {/* End Date Picker */}
            <MotiView
                animate={{
                    maxHeight: getSelectorHeight(ETimeSelectorMode.END_DATE)
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                <DateTimePicker
                    value={endDate}
                    onChange={handleChange}
                    mode='date'
                    display='inline'
                    minimumDate={endDate}
                />
            </MotiView>

            {/* End Time Picker */}
            <MotiView
                animate={{
                    maxHeight: getSelectorHeight(ETimeSelectorMode.END_TIME)
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                <DateTimePicker
                    value={endDate}
                    onChange={handleChange}
                    mode='time'
                    display='spinner'
                    minuteInterval={5}
                    minimumDate={endDate}
                />
            </MotiView>

        </View>
    )
};

export default TimeRangeSelector;
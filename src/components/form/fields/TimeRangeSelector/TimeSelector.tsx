import ModalDisplayValue from '@/components/modal/ModalDisplayValue';
import DateValue from '@/components/text/DateValue';
import TimeValue from '@/components/text/TimeValue';
import { ETimeSelectorMode } from '@/lib/enums/ETimeSelectorMode';
import { getDatestampThreeYearsAgo, getDatestampThreeYearsFromToday } from '@/utils/dateUtils';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MotiView } from 'moti';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

// ✅ 

type TTimeSelectorProps = {
    label: string;
    date: Date;
    isoTimestamp: string;
    showTime: boolean;
    dateMode: ETimeSelectorMode;
    timeMode: ETimeSelectorMode;
    currentSelectorMode: ETimeSelectorMode | null;
    minimumDate?: Date;
    onToggleMode: (mode: ETimeSelectorMode) => void;
    onChange: (event: DateTimePickerEvent) => void;
};

const TimeSelector = ({
    label,
    date,
    isoTimestamp,
    showTime,
    dateMode,
    timeMode,
    currentSelectorMode,
    minimumDate,
    onToggleMode,
    onChange
}: TTimeSelectorProps) => {

    function getValueColor(type: ETimeSelectorMode) {
        return type === currentSelectorMode ? 'systemTeal' : 'label';
    }

    function getValueMargin(type: ETimeSelectorMode) {
        return type === currentSelectorMode ? 12 : 8;
    }

    function getValueScale(type: ETimeSelectorMode) {
        return type === currentSelectorMode ? 1.1 : 1;
    }

    function getSelectorHeight(type: ETimeSelectorMode) {
        return type === currentSelectorMode ? 400 : 0;
    }

    return (
        <View>

            {/* Value Display */}
            <ModalDisplayValue
                label={label}
                value={
                    <View className='flex-row items-center'>
                        <MotiView
                            animate={{
                                marginRight: getValueMargin(dateMode),
                                transform: [{ scale: getValueScale(dateMode) }],
                            }}>
                            <TouchableOpacity
                                onPress={() => onToggleMode(dateMode)}
                            >
                                <DateValue
                                    isoTimestamp={isoTimestamp}
                                    platformColor={getValueColor(dateMode)}
                                />
                            </TouchableOpacity>
                        </MotiView>
                        {showTime && (
                            <MotiView animate={{
                                marginLeft: getValueMargin(timeMode),
                                transform: [{ scale: getValueScale(timeMode) }]
                            }}>
                                <TouchableOpacity
                                    onPress={() => onToggleMode(timeMode)}
                                >
                                    <TimeValue
                                        isoTimestamp={isoTimestamp}
                                        platformColor={getValueColor(timeMode)}
                                    />
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </View>
                }
            />

            {/* Date Picker */}
            <MotiView
                animate={{
                    maxHeight: getSelectorHeight(dateMode)
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                <DateTimePicker
                    value={date}
                    onChange={onChange}
                    mode='date'
                    display='inline'
                    minimumDate={minimumDate ?? new Date(getDatestampThreeYearsAgo())}
                    maximumDate={new Date(getDatestampThreeYearsFromToday())}
                />
            </MotiView>

            {/* Time Picker */}
            <MotiView
                animate={{
                    maxHeight: getSelectorHeight(timeMode)
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                className='overflow-hidden items-center'
            >
                <DateTimePicker
                    value={date}
                    onChange={onChange}
                    mode='time'
                    display='spinner'
                    minuteInterval={5}
                    minimumDate={minimumDate ?? new Date(getDatestampThreeYearsAgo())}
                    maximumDate={new Date(getDatestampThreeYearsFromToday())}
                />
            </MotiView>

        </View>
    )
};

export default TimeSelector;
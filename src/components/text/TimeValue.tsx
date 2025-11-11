import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';

import CustomText from './CustomText';

interface ITimeValueProps {
  timeValue?: string | null;
  isoTimestamp?: string | null;
  isEndEvent?: boolean;
  isStartEvent?: boolean;
  platformColor?: string;
  disabled?: boolean;
};

const TimeValue = ({
  timeValue,
  isoTimestamp,
  isEndEvent: endEvent,
  isStartEvent: startEvent,
  platformColor = 'systemBlue',
  disabled
}: ITimeValueProps) => {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [indicator, setIndicator] = useState('');

  // TODO: memoize and combine

  useEffect(() => {
    let date: DateTime | null = null;

    if (isoTimestamp) {
      date = DateTime.fromISO(isoTimestamp);
    } else if (timeValue) {
      date = DateTime.fromFormat(timeValue, 'HH:mm');
    }

    if (date && date.isValid) {
      const rawHour = date.hour;
      const rawMinute = date.minute;
      const isPM = rawHour >= 12;

      const adjustedHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
      const paddedMinute = rawMinute > 0 ? `:${String(rawMinute).padStart(2, '0')}` : '';

      setHour(String(adjustedHour));
      setMinute(paddedMinute);
      setIndicator(isPM ? 'PM' : 'AM');
    } else {
      setHour('');
      setMinute('');
      setIndicator('');
    }
  }, [timeValue, isoTimestamp]);

  return (
    <View className="flex-row relative">
      <CustomText
        variant="timeValue"
        customStyle={{
          color: PlatformColor(disabled ? 'tertiaryLabel' : platformColor)
        }}
      >
        {hour}
        {minute}
      </CustomText>
      <CustomText
        variant="timePmAmIndicator"
        customStyle={disabled ? { color: PlatformColor('tertiaryLabel') } : undefined}
      >
        {indicator}
      </CustomText>
      {(startEvent || endEvent) && (
        <CustomText variant="timeMultiDayIndicator" className="-translate-x-1/2">
          {startEvent ? 'START' : 'END'}
        </CustomText>
      )}
    </View>
  );
};

export default TimeValue;

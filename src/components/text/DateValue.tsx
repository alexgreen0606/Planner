import { DateTime } from 'luxon';
import React from 'react';
import { PlatformColor, View } from 'react-native';

import CustomText from './CustomText';

interface IDateValueProps {
  isoTimestamp: string;
  platformColor?: string;
  disabled?: boolean;
};

const DateValue = ({ isoTimestamp, disabled, platformColor = 'label' }: IDateValueProps) => {
  const dayFormat = 'MMM d';
  const yearFormat = 'yyyy';

  // TODO: memoize

  const date = DateTime.fromISO(isoTimestamp);
  const monthDay = date.toFormat(dayFormat);
  const year = date.toFormat(yearFormat);

  const showYear = date.year !== DateTime.now().year;

  return (
    <View className="relative flex-row w-fit">
      <CustomText
        variant="dateValue"
        customStyle={{
          color: disabled ? PlatformColor('tertiaryLabel') : PlatformColor(platformColor)
        }}
      >
        {monthDay.toUpperCase()}
      </CustomText>
      {showYear && (
        <View className="absolute top-[80%]">
          <CustomText
            variant="dateYear"
            customStyle={
              disabled
                ? {
                    color: PlatformColor('tertiaryLabel')
                  }
                : undefined
            }
          >
            {year}
          </CustomText>
        </View>
      )}
    </View>
  );
};

export default DateValue;

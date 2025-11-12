import React from 'react';
import {
  PlatformColor,
  StyleSheet,
  Text,
  TextProps as NativeTextProps,
  TextStyle
} from 'react-native';

export const textStyles = {
  // --- Common Variants ---
  pageHeader: {
    fontSize: 28,
    fontFamily: 'RoundHeavy'
  },
  pageSubHeader: {
    color: PlatformColor('secondaryLabel'),
    fontSize: 14,
    fontFamily: 'RoundMedium'
  },
  // --- Empty Page Label ---
  emptyLabel: {
    color: PlatformColor('tertiaryLabel'),
    flexWrap: 'wrap',
    fontSize: 16,
    paddingHorizontal: 64,
    textAlign: 'center',
    fontFamily: 'RoundMedium'
  },
  // --- List Rows ---
  listRow: {
    fontSize: 16,
    fontFamily: 'Text',
    color: PlatformColor('label')
  },
  // --- Planner Chip ---
  plannerChip: {
    fontFamily: 'RoundMedium',
    fontSize: 12
  },
  // --- Weather ---
  weatherCondition: {
    fontSize: 12,
    color: PlatformColor('label'),
    fontFamily: 'RoundMedium'
  },
  weatherTemperature: {
    fontSize: 11,
    color: PlatformColor('secondaryLabel'),
    fontFamily: 'RoundMedium'
  },
  // --- Time Value ---
  timeValue: {
    fontFamily: 'RoundHeavy',
    fontSize: 15,
    color: PlatformColor('systemBlue'),
    marginRight: 1
  },
  timePmAmIndicator: {
    fontFamily: 'Text',
    fontSize: 9,
    color: PlatformColor('secondaryLabel'),
    marginTop: 2
  },
  timeMultiDayIndicator: {
    fontFamily: 'RoundMedium',
    fontSize: 8,
    color: PlatformColor('secondaryLabel'),
    position: 'absolute',
    left: '50%',
    top: '100%',
    marginTop: -2
  },
  // --- Date Value ---
  dateValue: {
    fontFamily: 'RoundHeavy',
    fontSize: 16,
    color: PlatformColor('systemBlue')
  },
  dateYear: {
    fontFamily: 'RoundRegular',
    fontSize: 10,
    color: PlatformColor('secondaryLabel')
  },
  // --- Planner Carousel ---
  plannerCarouselMonth: {
    fontSize: 14,
    fontFamily: 'RoundMedium',
    color: PlatformColor('label')
  },
  plannerCarouselDayOfWeek: {
    fontSize: 8,
    fontFamily: 'RoundHeavy',
    letterSpacing: 1.2,
    paddingLeft: 1,
    color: PlatformColor('systemBackground')
  },
  plannerCarouselDayOfMonth: {
    fontSize: 15,
    fontFamily: 'RoundHeavy',
    color: PlatformColor('label')
  },
  // --- Upcoming Dates ---
  upcomingEvent: {
    color: PlatformColor('label'),
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: 14
  },
} satisfies Record<string, TextStyle>;

export type TTextVariant = keyof typeof textStyles;

interface ITextProps extends NativeTextProps {
  variant: TTextVariant;
  children: React.ReactNode;
  customStyle?: TextStyle;
}

const CustomText = ({ variant, children, customStyle, ...rest }: ITextProps) => (
  <Text
    // @ts-ignore allow custom text styles
    style={[styles[variant], customStyle]}
    {...rest}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create(textStyles);

export default CustomText;

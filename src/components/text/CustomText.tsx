import React from 'react';
import { TextProps as NativeTextProps, PlatformColor, StyleSheet, Text, TextStyle } from 'react-native';

// ✅ 

export const textStyles = {
    // --- Standard Text ---
    pageLabel: {
        fontSize: 24,
        color: PlatformColor('label'),
        fontFamily: 'RoundMedium'
    },
    detail: {
        color: PlatformColor('label'),
        fontSize: 14,
        fontFamily: 'RoundRegular'
    },
    softDetail: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 14,
        fontFamily: 'Text'
    },
    microDetail: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 10,
        fontFamily: 'Text'
    },
    standard: {
        color: PlatformColor('label'),
        fontSize: 16,
        fontFamily: 'Text'
    },
    // --- List Rows ---
    listRow: {
        fontSize: 16,
        fontFamily: 'Text',
        color: PlatformColor('label'),
    },
    // --- Planner Card ---
    plannerCardHeader: {
        color: PlatformColor('label'),
        fontSize: 22,
        fontFamily: 'RoundRegular',
    },
    plannerCardDetail: {
        color: PlatformColor('systemBlue'),
        fontFamily: 'Text',
        fontSize: 12
    },
    plannerCardSoftDetail: {
        color: PlatformColor('secondaryLabel'),
        fontFamily: 'Text',
        fontSize: 12,
        paddingRight: 12,
        flex: 1
    },
    // --- Date Range Selector ---
    timeModalDayOfWeek: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 11,
        fontFamily: 'Text'
    },
    // --- Event Chip ---
    eventChipLabel: {
        fontFamily: 'RoundRegular',
        fontSize: 13
    },
    // --- Weather ---
    currentTemp: {
        fontSize: 18,
        color: PlatformColor('label'),
        fontFamily: 'RoundMedium',
    },
    highTemp: {
        fontSize: 16,
        color: PlatformColor('label'),
        fontFamily: 'RoundMedium'
    },
    lowTemp: {
        fontSize: 14,
        color: PlatformColor('secondaryLabel'),
        fontFamily: 'RoundMedium'
    },
    // --- Concise Time ---
    listTime: {
        fontFamily: 'RoundHeavy',
        fontSize: 15,
        color: PlatformColor('systemBlue'),
        marginRight: 1
    },
    listPmAmIndicator: {
        fontFamily: 'Text',
        fontSize: 9,
        color: PlatformColor('secondaryLabel'),
        marginTop: 2
    },
    listMultiDayIndicator: {
        fontFamily: 'RoundMedium',
        fontSize: 8,
        color: PlatformColor('secondaryLabel'),
        position: 'absolute',
        left: '50%',
        top: '100%',
        marginTop: -2
    },
    // --- Concise Date ---
    conciseDate: {
        fontFamily: 'RoundHeavy',
        fontSize: 16,
        color: PlatformColor('systemBlue')
    },
    conciseDateYear: {
        fontFamily: 'RoundRegular',
        fontSize: 10,
        color: PlatformColor('secondaryLabel')
    },
    // --- Planner Carousel ---
    month: {
        fontSize: 16,
        fontFamily: 'RoundHeavy',
        color: PlatformColor('label')
    },
    dayOfWeek: {
        fontSize: 8,
        fontFamily: 'RoundHeavy',
        letterSpacing: 1.2,
        paddingLeft: 1
    },
    dayOfMonth: {
        fontSize: 15,
        fontFamily: 'RoundHeavy',
        color: PlatformColor('label')
    },
    // --- Calendar Filter ---
    calendarFilter: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'RoundMedium'
    }
} satisfies Record<string, TextStyle>;

export type TTextVariant = keyof typeof textStyles;

interface ITextProps extends NativeTextProps {
    variant: TTextVariant;
    children: React.ReactNode;
    customStyle?: TextStyle;
}

const CustomText = ({ variant, children, customStyle, ...rest }: ITextProps) =>
    <Text
        // @ts-ignore allow custom text styles
        style={[styles[variant], customStyle]}
        {...rest}
    >
        {children}
    </Text>;

const styles = StyleSheet.create(textStyles);

export default CustomText;

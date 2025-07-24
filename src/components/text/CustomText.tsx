import React from 'react';
import { PlatformColor, StyleSheet, TextProps as NativeTextProps, TextStyle, Text } from 'react-native';

// ✅ 

export const textStyles = {
    // --- Standard Text ---
    pageLabel: {
        fontSize: 30,
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
    // --- Button ---
    button: {
        fontSize: 18,
        fontFamily: 'RoundMedium',
    },
    // --- Modal ---
    modalTitle: {
        color: PlatformColor('label'),
        fontSize: 20,
        fontWeight: 400,
        fontFamily: 'RoundRegular',
    },
    inputLabel: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 14,
        fontFamily: 'RoundeMedium'
    },
    // --- Planner Card ---
    plannerCardHeader: {
        color: PlatformColor('label'),
        fontSize: 22,
        fontFamily: 'RoundRegular',
    },
    plannerCardDetail: {
        color: PlatformColor('systemTeal'),
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
        fontSize: 12
    },
    // --- Empty Label ---
    emptyLabel: {
        fontFamily: 'RoundRegular',
        fontSize: 12,
        color: PlatformColor('tertiaryLabel')
    },
    // --- Planners Navbar ---
    plannerTabLabel: {
        fontSize: 14,
        fontFamily: 'RoundMedium'
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
        color: PlatformColor('systemTeal'),
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
    // --- Time ---
    time: {
        fontFamily: 'RoundHeavy',
        fontSize: 16,
        color: PlatformColor('systemTeal'),
        marginRight: 1
    },
    pmAmIndicator: {
        fontFamily: 'Text',
        fontSize: 10,
        color: PlatformColor('secondaryLabel'),
        marginTop: 2,
        marginLeft: 1
    },
    // --- Date ---
    weekday: {
        fontFamily: 'RoundMedium',
        fontSize: 9,
        color: PlatformColor('secondaryLabel'),
        position: 'absolute',
        top: '100%',
        right: 0
    },
    date: {
        fontFamily: 'RoundMedium',
        fontSize: 16,
        color: PlatformColor('systemTeal')
    },
    year: {
        fontFamily: 'RoundHeavy',
        fontSize: 11,
        color: PlatformColor('secondaryLabel'),
        marginRight: 2
    },
    // --- Concise Date ---
    conciseDate: {
        fontFamily: 'RoundMedium',
        fontSize: 16,
        color: PlatformColor('systemTeal')
    },
    conciseDateYear: {
        fontFamily: 'RoundRegular',
        fontSize: 10,
        color: PlatformColor('secondaryLabel')
    },
    // --- Today Icon ---
    todayMonth: {
        fontSize: 8,
        fontFamily: 'RoundHeavy',
        color: PlatformColor('systemBackground'),
        marginRight: 1
    },
    todayDate: {
        fontSize: 16,
        paddingLeft: 1.5,
        marginTop: -1,
        fontFamily: 'RoundHeavy'
    }
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textStyles;

interface TextProps extends NativeTextProps {
    variant: TextVariant;
    children: React.ReactNode;
    customStyle?: TextStyle;
}

const CustomText = ({ variant, children, customStyle, ...rest }: TextProps) =>
    <Text
        // @ts-ignore allow custom text styles
        style={[styles[variant], customStyle]}
        {...rest}
    >
        {children}
    </Text>

const styles = StyleSheet.create(textStyles);

export default CustomText;

import React from 'react';
import { PlatformColor, StyleSheet, TextProps as NativeTextProps, TextStyle, Text } from 'react-native';

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
    // --- Modal ---
    modalTitle: {
        color: PlatformColor('label'),
        fontSize: 20,
        fontWeight: 400,
        fontFamily: 'RoundRegular',
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
    highTemp: {
        fontSize: 16,
        color: PlatformColor('label'),
        fontFamily: 'Text'
    },
    lowTemp: {
        fontSize: 12,
        color: PlatformColor('secondaryLabel'),
        fontFamily: 'Text'
    },
    // --- Button ---
    button: {
        fontSize: 18,
        fontFamily: 'RoundMedium',
    },
    // --- Birthday ---
    age: {
        fontSize: 24,
        fontFamily: 'RoundHeavy',
        color: PlatformColor('systemGreen'),
    },
    year: {
        fontSize: 14,
        fontFamily: 'RoundHeavy',
        color: PlatformColor('systemGreen'),
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
    // --- Date ---
    yearIndicator: {

    },
    monthIndicator: {

    },
    time: {
        fontFamily: 'RoundHeavy',
        fontSize: 16,
        color: PlatformColor('systemTeal')
    },
    date: {
        fontFamily: 'RoundMedium',
        fontSize: 16,
        color: PlatformColor('systemTeal')
    },
    conciseDate: {
        fontFamily: 'RoundMedium',
        fontSize: 16,
        color: PlatformColor('systemTeal')
    },
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

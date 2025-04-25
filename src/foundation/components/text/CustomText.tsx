import React from 'react';
import { PlatformColor, StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';

export type TextType = keyof typeof styles;

interface TextProps extends React.ComponentProps<typeof Text> {
    type: TextType;
    children: React.ReactNode;
    style?: TextStyle;
}

const CustomText = ({ type, children, style, ...rest }: TextProps) =>
    <Text style={[styles[type], style]} {...rest} >
        {children}
    </Text>

const styles = StyleSheet.create({
    pageLabel: {
        fontSize: 25,
        color: PlatformColor('label'),
        fontWeight: 600,
        fontFamily: 'System'
    },
    subPageLabel: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 14,
    },
    header: {
        color: PlatformColor('label'),
        fontSize: 20,
        fontWeight: 400
    },
    subHeader: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 12,
    },
    standard: {
        color: PlatformColor('label'),
        fontSize: 16,
    },
    label: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 14,
        fontWeight: 600
    },
    soft: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 12,
    },
    highTemp: {
        fontSize: 16,
        color: PlatformColor('label'),
    },
    lowTemp: {
        fontSize: 12,
        color: PlatformColor('secondaryLabel'),
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemPurple'),
    },
    minute: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemPurple'),
    },
    day: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemIndigo'),
    },
    month: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemIndigo'),
    },
    age: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemGreen'),
    },
    year: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemGreen'),
    },
    indicator: {
        fontSize: 7.5,
        color: PlatformColor('label'),
        fontWeight: 600
    },
    button: {
        fontSize: 16,
        fontWeight: 500,
    },
    badge: {
        fontSize: 14,
        color: 'white',
        fontWeight: 600
    }
});

export default CustomText;

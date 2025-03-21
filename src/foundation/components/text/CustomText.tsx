import React from 'react';
import { PlatformColor, StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';

interface TextProps extends React.ComponentProps<typeof Text> {
    type: keyof typeof styles;
    children: React.ReactNode;
    style?: TextStyle;
}

const CustomText = ({ type, children, style, ...rest }: TextProps) =>
    <Text style={{ ...styles[type], ...style }} {...rest} >
        {children}
    </Text>

const styles = StyleSheet.create({
    pageLabel: {
        fontSize: 25,
        color: PlatformColor('label'),
        fontWeight: 600
    },
    subPageLabel: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 14,
    },
    header: {
        color: PlatformColor('label'),
        fontSize: 20
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
        color: PlatformColor('secondaryLabel'),
    },
    lowTemp: {
        fontSize: 12,
        color: PlatformColor('tertiaryLabel'),
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemOrange'),
    },
    minute: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: PlatformColor('systemOrange'),
    },
    indicator: {
        fontSize: 7.5,
        color: PlatformColor('secondaryLabel'),
        fontWeight: 600
    },
});

export default CustomText;

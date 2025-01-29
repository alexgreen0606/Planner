import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import colors from '../../theme/colors';

interface TextProps extends React.ComponentProps<typeof Text> {
    type: keyof typeof styles;
    children: React.ReactNode;
    style?: TextStyle;
}

const CustomText = ({ type, children, style: customStyle, ...rest }: TextProps) =>
    <Text style={{ ...styles[type], ...customStyle }} {...rest} >
        {children}
    </Text>

const styles = StyleSheet.create({
    pageLabel: {
        fontSize: 25,
        color: colors.white,
        fontWeight: 600
    },
    header: {
        color: colors.white,
        fontSize: 20
    },
    standard: {
        color: colors.white,
        fontSize: 16,
        lineHeight: 20
    },
    label: {
        color: colors.grey,
        fontSize: 14,
        fontWeight: 800
    },
    soft: {
        color: colors.grey,
        fontSize: 12,
    },
    highTemp: {
        fontSize: 18,
        color: colors.white,
    },
    lowTemp: {
        fontSize: 14,
        color: colors.grey,
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: colors.orange,
    },
    minute: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: colors.orange,
    },
    indicator: {
        fontSize: 7.5,
        color: colors.white,
        fontWeight: 600
    },
});

export default CustomText;

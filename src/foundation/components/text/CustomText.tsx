import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Palette } from '../../theme/colors';

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
        color: Palette.WHITE,
        fontWeight: 600
    },
    subPageLabel: {
        color: Palette.GREY,
        fontSize: 14,
    },
    header: {
        color: Palette.WHITE,
        fontSize: 20
    },
    subHeader: {
        color: Palette.GREY,
        fontSize: 12,
    },
    standard: {
        color: Palette.WHITE,
        fontSize: 16,
    },
    label: {
        color: Palette.GREY,
        fontSize: 14,
        fontWeight: 600
    },
    soft: {
        color: Palette.DIM,
        fontSize: 12,
    },
    highTemp: {
        fontSize: 16,
        color: Palette.WHITE,
    },
    lowTemp: {
        fontSize: 12,
        color: Palette.GREY,
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: Palette.ORANGE,
    },
    minute: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: Palette.ORANGE,
    },
    indicator: {
        fontSize: 7.5,
        color: Palette.GREY,
        fontWeight: 600
    },
});

export default CustomText;

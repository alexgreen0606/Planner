import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Color } from '../../theme/colors';

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
        color: Color.WHITE,
        fontWeight: 600
    },
    subPageLabel: {
        color: Color.GREY,
        fontSize: 14,
    },
    header: {
        color: Color.WHITE,
        fontSize: 20
    },
    subHeader: {
        color: Color.GREY,
        fontSize: 12,
    },
    standard: {
        color: Color.WHITE,
        fontSize: 16,
    },
    label: {
        color: Color.GREY,
        fontSize: 14,
        fontWeight: 800
    },
    soft: {
        color: Color.DIM,
        fontSize: 12,
    },
    highTemp: {
        fontSize: 18,
        color: Color.WHITE,
    },
    lowTemp: {
        fontSize: 14,
        color: Color.GREY,
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: Color.ORANGE,
    },
    minute: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: Color.ORANGE,
    },
    indicator: {
        fontSize: 7.5,
        color: Color.GREY,
        fontWeight: 600
    },
});

export default CustomText;

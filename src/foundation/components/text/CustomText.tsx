import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Colors from '../../theme/colors';

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
        color: Colors.WHITE,
        fontWeight: 600
    },
    header: {
        color: Colors.WHITE,
        fontSize: 20
    },
    standard: {
        color: Colors.WHITE,
        fontSize: 16,
        lineHeight: 20
    },
    label: {
        color: Colors.GREY,
        fontSize: 14,
        fontWeight: 800
    },
    soft: {
        color: Colors.GREY,
        fontSize: 12,
    },
    highTemp: {
        fontSize: 18,
        color: Colors.WHITE,
    },
    lowTemp: {
        fontSize: 14,
        color: Colors.GREY,
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: Colors.ORANGE,
    },
    minute: {
        fontSize: 14,
        fontFamily: 'Jersey15-Regular',
        color: Colors.ORANGE,
    },
    indicator: {
        fontSize: 7.5,
        color: Colors.WHITE,
        fontWeight: 600
    },
});

export default CustomText;

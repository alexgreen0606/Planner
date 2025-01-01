import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import colors from '../../../theme/colors';

const styles = StyleSheet.create({
    label: {
        color: colors.grey,
        fontSize: 14
    },
    standard: {
        color: colors.white,
        fontSize: 16,
    },
    soft: {
        color: colors.grey,
        fontSize: 14,
    },
    header: {
        color: colors.white,
        fontSize: 20
    }
});

interface TextProps extends React.ComponentProps<typeof Text> {
    type: keyof typeof styles;
    children: React.ReactNode;
    style?: TextStyle;
}

const CustomText = ({ type, children, style: customStyle, ...rest }: TextProps) =>
    <Text style={{ ...styles[type], ...customStyle }} {...rest} >
        {children}
    </Text>

export default CustomText;

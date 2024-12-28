import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { theme } from '../../../theme/theme';
import { Text } from 'react-native-paper';

const styles = StyleSheet.create({
    collapseText: {
        color: theme.colors.outline,
        fontSize: 14
    },
    standard: {
        color: theme.colors.secondary,
        fontSize: 16,
    },
    soft: {
        color: theme.colors.outline,
        fontSize: 14,
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

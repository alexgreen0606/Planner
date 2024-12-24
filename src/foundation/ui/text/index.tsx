import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { theme } from '../../../theme/theme';
import { Text } from 'react-native-paper';

const styles = StyleSheet.create({
    collapseText: {
        color: theme.colors.outline,
        fontSize: 14
    },
    list: {
        color: theme.colors.secondary,
        fontSize: 16,
    }
});

interface TextProps {
    type: keyof typeof styles;
    children: React.ReactNode;
    style?: TextStyle;
}

const CustomText = ({ type, children, style: customStyle }: TextProps) =>
    <Text style={{ ...styles[type], ...customStyle }} >
        {children}
    </Text>

export default CustomText;

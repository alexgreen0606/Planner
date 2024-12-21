import React from 'react';
import { StyleSheet } from 'react-native';
import { theme } from '../../../theme/theme';
import { Text } from 'react-native-paper';

const styles = StyleSheet.create({
    collapseText: {
        color: theme.colors.outline,
        fontSize: 14
    },
});

interface TextProps {
    type: keyof typeof styles;
    children: React.ReactNode;
}

const CustomText = ({ type, children }: TextProps) =>
    <Text style={styles[type]} >
        {children}
    </Text>

export default CustomText;

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../../theme/theme';
import { useTheme } from 'react-native-paper';

interface ThinLineProps {
    style?: ViewStyle;
}

const ThinLine = ({ style }: ThinLineProps) => {
    const { colors } = useTheme();
    const styles = StyleSheet.create({
        thinLine: {
            ...style,
            width: '100%',
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.outline,
        }
    });
    return (
        <View style={styles.thinLine} />
    )
}

export default ThinLine;

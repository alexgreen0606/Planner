import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import colors from '../../theme/colors';

interface ThinLineProps {
    style?: ViewStyle;
}

const ThinLine = ({ style }: ThinLineProps) => {
    const styles = StyleSheet.create({
        thinLine: {
            width: '100%',
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.grey,
            ...style,
        }
    });
    return (
        <View style={styles.thinLine} />
    )
}

export default ThinLine;

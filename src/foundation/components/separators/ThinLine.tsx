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
        },
        clickableLine: {
            width: '100%',
            height: 15,
            backgroundColor: 'transparent',
            justifyContent: 'center'
        },
    });
    return (
        <View style={styles.clickableLine}>
            <View style={styles.thinLine} />
        </View>
    )
}

export default ThinLine;

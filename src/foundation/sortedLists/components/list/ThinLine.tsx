import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import { LIST_SEPARATOR_HEIGHT } from '../../constants';

const ThinLine = () =>
    <View style={styles.lineContainer}>
        <View style={styles.thinLine} />
    </View>

const styles = StyleSheet.create({
    lineContainer: {
        width: '100%',
        height: LIST_SEPARATOR_HEIGHT,
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    thinLine: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: PlatformColor('systemGray'),
    },
});

export default ThinLine;

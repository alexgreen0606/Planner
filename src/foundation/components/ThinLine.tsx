import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';

interface ThinLineProps {
    centerLine?: boolean;
    vertical?: boolean;
}

const ThinLine = ({ centerLine = true, vertical = false }: ThinLineProps) => {

    const styles = StyleSheet.create({
        thinLine: {
            width: vertical ? StyleSheet.hairlineWidth : '100%',
            height: vertical ? '100%' : StyleSheet.hairlineWidth,
            backgroundColor: PlatformColor('systemGray'),
        },
        lineContainer: {
            width: vertical ? 8 : '100%',
            height: vertical ? '100%' : centerLine ? 15 : 8,
            backgroundColor: 'transparent',
            justifyContent: centerLine ? 'center' : 'flex-end'
        },
    });

    return (
        <View style={styles.lineContainer}>
            <View style={styles.thinLine} />
        </View>
    )
}

export default ThinLine;

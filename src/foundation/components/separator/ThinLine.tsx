import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Color } from '../../theme/colors';

interface ThinLineProps {
    centerLine?: boolean
}

const ThinLine = ({ centerLine = true }: ThinLineProps) => {

    const styles = StyleSheet.create({
        thinLine: {
            width: '100%',
            height: StyleSheet.hairlineWidth,
            backgroundColor: Color.DIM,
        },
        lineContainer: {
            width: '100%',
            height: centerLine ? 15 : 8,
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

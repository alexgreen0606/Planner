import React from 'react';
import { PlatformColor, View, StyleSheet } from 'react-native';
import CustomText from './text/CustomText';

interface EventCountChipProps {
    count: number,
    color?: string
}

const BadgeNumber = ({
    count,
    color
}: EventCountChipProps) =>
    <View style={[styles.chip, {
        borderColor: color ?? PlatformColor('label'),
    }]}>
        <CustomText
            type='badge'
            style={{ color: color ?? PlatformColor('label') }}
        >
            {count}
        </CustomText>
    </View>

const styles = StyleSheet.create({
    chip: {
        height: 18,
        minWidth: 18,
        borderRadius: 9,
        paddingHorizontal: 5,
        borderWidth: 1,
        backgroundColor: PlatformColor('systemBackground'),
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default BadgeNumber;
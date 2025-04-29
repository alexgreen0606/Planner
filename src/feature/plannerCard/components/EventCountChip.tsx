import React from 'react';
import { PlatformColor, View, StyleSheet } from 'react-native';
import CustomText from '../../../foundation/components/text/CustomText';

interface EventCountChipProps {
    count: number
}

const EventCountChip = ({
    count
}: EventCountChipProps) =>
    <View style={styles.chip}>
        <CustomText type='badge'>
            {count}
        </CustomText>
    </View>

const styles = StyleSheet.create({
    chip: {
        height: 24,
        minWidth: 24,
        borderRadius: 12,
        paddingHorizontal: 5,
        backgroundColor: PlatformColor('systemBlue'),
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default EventCountChip;
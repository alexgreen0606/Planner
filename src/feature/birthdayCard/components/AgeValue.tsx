import React from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from '../../../components/text/CustomText';

interface AgeValueProps {
    age: number;
    contacted: boolean;
}

const AgeValue = ({ age, contacted }: AgeValueProps) => {

    return (
        <View style={styles.container}>
            <CustomText type='age' style={{...styles.hour, color: PlatformColor(contacted ? 'secondaryLabel' : 'systemGreen')}}>{age}</CustomText>
            <View style={styles.details}>
                <CustomText type='year' style={{...styles.minute, color: PlatformColor(contacted ? 'secondaryLabel' : 'systemGreen')}}>YEAR{age > 1 ? 'S' : ''}</CustomText>
                <CustomText type='year' style={{...styles.indicator, color: PlatformColor(contacted ? 'secondaryLabel' : 'systemGreen')}}>OLD</CustomText>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    hour: {
        height: '100%'
    },
    details: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        marginLeft: 2
    },
    minute: {
        flex: 1,
        paddingTop: 2,
        letterSpacing: 1,
        fontSize: 12,
        textAlignVertical: 'bottom'
    },
    indicator: {
        flex: 1,
        textAlignVertical: 'top',
        fontSize: 12,
        letterSpacing: 1,
        paddingBottom: 2
    }
});

export default AgeValue;
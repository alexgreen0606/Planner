import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import CustomText from './CustomText';

interface LabelSublabelProps {
    type: 'large' | 'medium';
    label: string;
    subLabel: string;
    upperSublabel?: string;
    horizontal?: boolean;
}

const LabelSublabel = ({ type, label, subLabel, upperSublabel, horizontal }: LabelSublabelProps) =>
    <View style={styles.container}>
        <CustomText type={type === 'large' ? 'pageLabel' : 'header'}>{label}</CustomText>
        {horizontal ? (
            <View style={styles.subLabelTop}>
                <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={{ color: PlatformColor('label') }}>{upperSublabel}{' '}</CustomText>
                <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={{ color: PlatformColor('secondaryLabel') }}>{subLabel}</CustomText>
            </View>
        ) : (
            <View style={styles.subLabelRight}>
                <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={{ color: PlatformColor('label') }}>{upperSublabel}</CustomText>
                <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={{ color: PlatformColor('secondaryLabel') }}>{subLabel}</CustomText>
            </View>
        )}
    </View>

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        position: 'relative'
    },
    subLabelRight: {
        transform: 'translate(8px, 4px)',
        position: 'absolute',
        left: '100%'
    },
    subLabelTop: {
        display: 'flex',
        flexDirection: 'row',
        position: 'absolute',
        left: 0,
        bottom: '100%',
        transform: 'translateY(16px)'
    },
});

export default LabelSublabel;

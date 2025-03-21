import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import CustomText from './CustomText';

interface LabelSublabelProps {
    type: 'large' | 'medium';
    label: string;
    subLabel: string;
    upperSublabel?: string;
}

const LabelSublabel = ({ type, label, subLabel, upperSublabel }: LabelSublabelProps) =>
    <View style={styles.container}>
        <CustomText type={type === 'large' ? 'pageLabel' : 'header'}>{label}</CustomText>
        <View style={styles.subLabel}>
            <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={{ color: PlatformColor('label') }}>{upperSublabel}</CustomText>
            <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={{ color: PlatformColor('secondaryLabel') }}>{subLabel}</CustomText>
        </View>
    </View>

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        position: 'relative'
    },
    subLabel: {
        transform: 'translate(8px, 4px)',
        position: 'absolute',
        left: '100%'
    },
});

export default LabelSublabel;

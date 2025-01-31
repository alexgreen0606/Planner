import React from 'react';
import { StyleSheet, View } from 'react-native';
import CustomText from './CustomText';

interface LabelSublabelProps {
    type: 'large' | 'medium';
    label: string;
    subLabel: string;
}

const LabelSublabel = ({ type, label, subLabel }: LabelSublabelProps) =>
    <View style={styles.container}>
        <CustomText type={type === 'large' ? 'pageLabel' : 'header'}>{label}</CustomText>
        <CustomText type={type === 'large' ? 'subPageLabel' : 'subHeader'} style={styles.subLabel}>{subLabel}</CustomText>
    </View>

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    subLabel: {
        marginLeft: 5,
        marginBottom: 2,
    },
});

export default LabelSublabel;

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import ThinLine from './ThinLine';

interface ClickableLineProps {
    onPress: () => void;
}

const ClickableLine = ({ onPress }: ClickableLineProps) =>
    <TouchableOpacity style={styles.clickableLine} onPress={onPress}>
        <ThinLine />
    </TouchableOpacity>

const styles = StyleSheet.create({
    clickableLine: {
        width: '100%',
        height: 15,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
});

export default ClickableLine;

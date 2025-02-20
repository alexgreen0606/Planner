import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Palette } from '../theme/colors';

interface CardProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
}

const Card = ({ children, header, footer, style }: CardProps) =>
    <View style={{ ...styles.card, ...style }}>
        {header && (
            <View style={styles.banner}>
                {header}
            </View>
        )}
        {children}
        {footer && (
            <View style={styles.banner}>
                {footer}
            </View>
        )}
    </View>

const styles = StyleSheet.create({
    card: {
        backgroundColor: Palette.BACKGROUND,
        borderRadius: 8,
    },
    banner: {
        paddingVertical: 8,
        paddingHorizontal: 8
    },
});

export default Card;

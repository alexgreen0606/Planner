import React, { ReactNode } from 'react';
import { PlatformColor, StyleSheet, View, ViewStyle } from 'react-native';

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
        backgroundColor: PlatformColor('systemGray6'),
        borderRadius: 8,
    },
    banner: {
        paddingVertical: 8,
        paddingHorizontal: 8
    },
});

export default Card;

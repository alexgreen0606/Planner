import React, { ReactNode } from 'react';
import { PlatformColor, StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
    header?: ReactNode;
    badge?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
    children: ReactNode;
}

const Card = ({
    header,
    badge,
    footer,
    style,
    children,
}: CardProps) =>
    <View style={[styles.card, style]}>
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
        {badge && (
            <View style={styles.badge}>
                {badge}
            </View>
        )}
    </View>

const styles = StyleSheet.create({
    card: {
        position: 'relative',
        borderRadius: 8,
        backgroundColor: PlatformColor('systemGray6'),
    },
    banner: { padding: 8 },
    badge: {
        position: 'absolute',
        bottom: '100%',
        right: 0,
        transform: 'translate(8px,10px)'
    }
});

export default Card;

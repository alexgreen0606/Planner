import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Colors from '../../theme/colors';

interface CardProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
}

const Card = ({ children, header, footer, style }: CardProps) =>
    <View style={{ ...styles.card, ...style }}>
        {header && (
            <View style={styles.header}>
                {header}
            </View>
        )}
        {children}
        {footer && (
            <View style={styles.footer}>
                {footer}
            </View>
        )}
    </View>

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 8,
    },
    header: {
        paddingTop: 4,
        paddingHorizontal: 8
    },
    footer: {
        padding: 8
    }
});

export default Card;

import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import colors from '../../theme/colors';

interface CardProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
}

const Card = ({ children, header, footer, style }: CardProps) => {

    return (
        <View style={{...styles.card, ...style}}>
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
    )
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.background,
        borderRadius: 8,
        width: '100%'
    },
    header: {
        paddingHorizontal: 8,
        paddingTop: 4
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 8
    }
});

export default Card;

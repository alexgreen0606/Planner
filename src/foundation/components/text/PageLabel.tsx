import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import colors from '../../theme/colors';
import GenericIcon, { GenericIconProps } from '../icons/GenericIcon';
import globalStyles from '../../theme/globalStyles';

const styles = StyleSheet.create({
    bannerContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.grey,
    },
    banner: {
        ...globalStyles.spacedApart,
        paddingHorizontal: 8,
    },
    label: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    labelText: {
        fontSize: 25,
        color: colors.white,
    },
});

interface PageLabelProps {
    label: string;
    iconConfig: GenericIconProps;
    controlConfig?: GenericIconProps;
    control?: () => void;
}

const PageLabel = ({ label, iconConfig, controlConfig, control }: PageLabelProps) =>
    <View style={styles.bannerContainer}>
        <View style={styles.banner}>
            <View style={styles.label}>
                <GenericIcon
                    {...iconConfig}
                />
                <Text adjustsFontSizeToFit style={styles.labelText} numberOfLines={2}>
                    {label}
                </Text>
            </View>
            {controlConfig && (
                <TouchableOpacity
                    onPress={control}
                >
                    <GenericIcon
                        {...controlConfig}
                    />
                </TouchableOpacity>
            )}
        </View>
    </View>

export default PageLabel;

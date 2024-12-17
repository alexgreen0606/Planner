import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { theme } from '../../../theme/theme';
import { FolderItemType } from '../enums';
import { FontAwesome } from '@expo/vector-icons';
import globalStyles from '../../../theme/globalStyles';

interface LabelBannerProps {
    label: string;
    backButtonConfig: {
        display: boolean;
        label: string | undefined;
        onClick: () => void;
    };
    type: FolderItemType;
}

const LabelBanner = ({ label, backButtonConfig, type }: LabelBannerProps) => {
    const { colors } = useTheme();
    const iconStyle = type === FolderItemType.FOLDER ? 'folder-o' : 'bars';

    return (
        <View style={styles.container}>
            {backButtonConfig.display && (
                <Button
                    mode="text"
                    onPress={backButtonConfig.onClick}
                    icon="chevron-left"
                    theme={{ colors: { primary: colors.secondary } }}
                >
                    {backButtonConfig.label}
                </Button>
            )}
            <View style={globalStyles.spacedApart}>
                <View style={styles.label}>
                    <FontAwesome
                        name={iconStyle}
                        size={26}
                        color={colors.primary}
                    />
                    <Text adjustsFontSizeToFit style={styles.labelText} numberOfLines={2}>
                        {label}
                    </Text>
                </View>
                <FontAwesome
                    name='pencil'
                    size={18}
                    color={colors.outline}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
    label: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    labelText: {
        fontSize: 25,
        color: theme.colors.primary,
    },
});

export default LabelBanner;

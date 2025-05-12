import { HEADER_HEIGHT } from '@/constants';
import ButtonText from '@/foundation/components/text/ButtonText';
import CustomText from '@/foundation/components/text/CustomText';
import useDimensions from '@/foundation/hooks/useDimensions';
import { ItemStatus } from '@/foundation/sortedLists/constants';
import globalStyles from '@/theme/globalStyles';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { PlatformColor, StyleSheet, TextInput, View } from 'react-native';
import { getFolderItem, updateFolderItem } from '../storage';
import { FolderItem, FolderItemTypes } from '../types';

interface FolderItemBannerProps {
    itemId: string;
    itemType: FolderItemTypes;
    backButtonConfig: {
        pathname: string;
        label: string | undefined;
        hide?: boolean;
    };
}

const FolderItemBanner = ({
    itemId,
    itemType,
    backButtonConfig
}: FolderItemBannerProps) => {
    const router = useRouter();
    const [item, setItem] = useState<FolderItem>(getFolderItem(itemId, itemType));
    const { SCREEN_WIDTH } = useDimensions();

    const beginEditItem = () => setItem({ ...item, status: ItemStatus.EDIT });
    const updateItem = (text: string) => setItem({ ...item, value: text });
    const saveItem = () => {
        updateFolderItem({ ...item, status: ItemStatus.STATIC });
        setItem(getFolderItem(itemId, itemType));
    };

    const isItemEditing = item.status === ItemStatus.EDIT;

    return (
        <View style={[
            globalStyles.pageLabelContainer,
            styles.container
        ]}>

            {/* Name */}
            {isItemEditing ? (
                <TextInput
                    autoFocus
                    value={item.value}
                    onChangeText={updateItem}
                    style={styles.inputField}
                    cursorColor={PlatformColor('systemBlue')}
                    onSubmitEditing={saveItem}
                />
            ) : (
                <CustomText
                    type='pageLabel'
                    onPress={beginEditItem}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                >
                    {item.value}
                </CustomText>
            )}

            {/* Back Button */}
            {!backButtonConfig.hide && (
                <View style={styles.backButton}>
                    <ButtonText
                        platformColor='systemBlue'
                        onClick={() => router.back()}
                        iconConfig={{
                            type: 'chevronLeft',
                            platformColor: 'systemBlue'
                        }}
                        containerStyle={{ width: SCREEN_WIDTH - 60 }}
                    >
                        {backButtonConfig.label}
                    </ButtonText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative'
    },
    inputField: {
        height: HEADER_HEIGHT,
        width: '100%',
        fontSize: 25,
        backgroundColor: 'transparent',
        color: PlatformColor('label'),
    },
    backButton: {
        gap: 0,
        position: 'absolute',
        left: 0,
        bottom: 50,
        transform: 'translateY(10px)'
    }
});


export default FolderItemBanner;

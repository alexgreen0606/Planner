import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FolderItemActions from '@/components/actions/FolderItemActions';
import GlassIconButton from '@/components/buttons/GlassIconButton';
import useCollapsedHeaderSwift from '@/hooks/scrollTracking/useCollapsedHeaderSwift';
import { NULL } from '@/lib/constants/generic';
import { GLASS_BUTTON_SIZE, LARGE_MARGIN } from '@/lib/constants/layout';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getFolderItemFromStorageById } from '@/storage/checklistsStorage';
import { getValidCssColor } from '@/utils/colorUtils';

import CustomText from '../text/CustomText';
import ShadowView from '../views/ShadowView';

interface IFolderItemHeaderProps {
    folderItemId: string;
};

const FolderItemHeader = ({ folderItemId }: IFolderItemHeaderProps) => {
    const { isCollapsed } = useCollapsedHeaderSwift(folderItemId);
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const router = useRouter();

    const storage = useMMKV({ id: EStorageId.FOLDER_ITEM })
    const [item] = useMMKVObject<IFolderItem>(folderItemId, storage);

    const breadcrumbPath = useMemo(() => {
        if (!item) return;

        const pathItems: string[] = [];
        let currentItem = item;
        while (currentItem && currentItem.listId !== NULL) {
            const parentFolder = getFolderItemFromStorageById(currentItem.listId);
            pathItems.unshift(parentFolder.value);
            currentItem = parentFolder;
        }

        return pathItems.join(' / ');
    }, [item?.listId]);

    const totalContainerPadding = LARGE_MARGIN * 2;
    const expandedWidth = SCREEN_WIDTH - totalContainerPadding;
    const collapsedWidth = expandedWidth - (totalContainerPadding + (GLASS_BUTTON_SIZE * 2));
    const collapsedScale = collapsedWidth / expandedWidth;

    return (
        <View
            style={{
                marginTop: TOP_SPACER,
                height: EHeaderHeight.FOLDER_ITEM
            }}
            className="px-4 relative"
        >
            {/* Action Buttons */}
            <View className="flex-row justify-between items-start mb-2 z-[3]">
                <GlassIconButton
                    systemImage="chevron.left"
                    onPress={() => router.back()}
                />
                <FolderItemActions folderId={folderItemId} />
            </View>

            {/* Title and Breadcrumbs */}
            <MotiView
                className='absolute'
                animate={{
                    top: isCollapsed ? 0 : GLASS_BUTTON_SIZE + LARGE_MARGIN,
                    transform: [{ scale: isCollapsed ? collapsedScale : 1 }]
                }}
                style={{ width: expandedWidth, left: LARGE_MARGIN }}
            >
                <CustomText
                    variant='pageHeader'
                    numberOfLines={1}
                    ellipsizeMode='tail'
                    customStyle={{ color: getValidCssColor(item?.platformColor), zIndex: 7 }}
                >
                    {item?.value}
                </CustomText>
                {breadcrumbPath && (
                    <ShadowView edgeSize={{ bottom: 16 }}>
                        <CustomText
                            variant='pageSubHeader'
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {breadcrumbPath}
                        </CustomText>
                    </ShadowView>
                )}
            </MotiView>
        </View>
    );
};

export default FolderItemHeader;
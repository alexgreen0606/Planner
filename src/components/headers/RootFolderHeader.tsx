import { MotiText } from 'moti';
import { PlatformColor, Text, View } from 'react-native';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FolderItemActions from '@/components/actions/FolderItemActions';
import { useCollapsibleHeader } from '@/hooks/collapsibleHeaders/useCollapsibleHeader';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getValidCssColor } from '@/utils/colorUtils';

import { textStyles } from '../text/CustomText';

const RootFolderHeader = () => {
    const isCollapsed = useCollapsibleHeader(EStorageKey.ROOT_FOLDER_KEY, EHeaderHeight.ROOT_FOLDER);
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const [rootFolder] = useMMKVObject<IFolderItem>(EStorageKey.ROOT_FOLDER_KEY, folderItemStorage);

    return (
        <View
            style={{ marginTop: TOP_SPACER, height: EHeaderHeight.ROOT_FOLDER }}
            className="flex-row justify-between items-start px-4"
        >
            {/* Page Label */}
            <MotiText
                style={textStyles['pageHeader']}
                animate={{
                    // @ts-ignore
                    fontSize: isCollapsed ? 22 : 32
                }}
            >
                <Text style={{ color: getValidCssColor(rootFolder?.platformColor) }}>
                    {rootFolder?.value}
                </Text>
            </MotiText>

            {/* Filter Actions List */}
            <FolderItemActions folderId={EStorageKey.ROOT_FOLDER_KEY} />
        </View>
    );
};

export default RootFolderHeader;

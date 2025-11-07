import { MotiText } from 'moti';
import { View } from 'react-native';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FolderItemActions from '@/components/actions/FolderItemActions';
import { useCollapsibleHeader } from '@/hooks/collapsibleHeaders/useCollapsibleHeader';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

import { textStyles } from '../../text/CustomText';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';

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
                    style={textStyles['upcomingDatesHeader']}
                    animate={{
                        // @ts-ignore
                        fontSize: isCollapsed ? 22 : 32
                    }}
                >
                    {rootFolder?.value}
                </MotiText>

            {/* Filter Popup List */}
            <FolderItemActions folderId={EStorageKey.ROOT_FOLDER_KEY} />
        </View>
    );
};

export default RootFolderHeader;

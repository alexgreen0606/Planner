// import { folderItemAtom } from '@/atoms/folderItemAtom';
// import CustomText, { textStyles } from '@/components/text/CustomText';
// import useFolderItem from '@/hooks/useFolderItem';
// import { HEADER_HEIGHT, PAGE_LABEL_HEIGHT } from '@/lib/constants/miscLayout';
// import { EStorageId } from '@/lib/enums/EStorageId';
// import { useRouter } from 'expo-router';
// import { useAtom } from 'jotai';
// import React from 'react';
// import { PlatformColor, TextInput, useWindowDimensions, View } from 'react-native';
// import { useMMKV } from 'react-native-mmkv';
// import GlassIconButton from '../icon/GlassButtonIcon';
// import ShadowView from '../ShadowView';
// import FolderItemActions from '../actions/FolderItemActions';

// // ✅ 

// // TODO: convert to a modal for editing folder or checklist title

// const FolderItemBanner = () => {
//     const itemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
//     const { width: SCREEN_WIDTH } = useWindowDimensions();
//     const router = useRouter();

//     // const [folderItemId, setFolderItemId] = useAtom(folderItemAtom);

//     // todo: move this to top of component tree
//     const {
//         item,
//         isEditingValue,
//         transferingItem,
//         isTransferMode,
//         onToggleEditValue,
//         onValueChange,
//         onEndTransfer
//     } = useFolderItem(folderItemId, itemStorage);

//     return (
//         <View className='w-full'>
//             <ShadowView className='flex-1 px-2'>
//                 {isEditingValue ? (
//                     <TextInput
//                         autoFocus
//                         value={item?.value}
//                         onChangeText={onValueChange}
//                         cursorColor={PlatformColor('systemBlue')}
//                         onBlur={onToggleEditValue}
//                         autoCapitalize='words'
//                         className='bg-transparent pr-2'
//                         style={[
//                             textStyles.pageLabel,
//                             { height: HEADER_HEIGHT, color: PlatformColor(item?.platformColor ?? 'label') }
//                         ]}
//                     />
//                 ) : (
//                     <View className='pr-2' style={{ height: PAGE_LABEL_HEIGHT }}>
//                         <CustomText
//                             variant='pageLabel'
//                             ellipsizeMode='tail'
//                             numberOfLines={1}
//                             customStyle={{ color: PlatformColor(item?.platformColor ?? 'label') }}
//                         >
//                             {item?.value}
//                         </CustomText>
//                     </View>
//                 )}
//             </ShadowView>
//         </View>
//     )
// };

// export default FolderItemBanner;
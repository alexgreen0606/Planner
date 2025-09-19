import useAppTheme from '@/hooks/useAppTheme';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { PlatformColor, Pressable, View } from 'react-native';
import GenericIcon from '../icon';
import CustomText from '../text/CustomText';

// ✅ 

type TPlannerChipProps = {
    chip: TPlannerChip;
    backgroundPlatformColor?: string;
    collapsed?: boolean;
    chipSetIndex: number;
    shiftChipRight: boolean;
    parentPlannerDatestamp: string;
    onToggleCollapsed?: () => void;
};

const COLLAPSED_CHIP_RIGHT_MARGIN = -18;
const EXPANDED_CHIP_RIGHT_MARGIN = 6;
const CHIP_SET_GAP = 24;

const PlannerChip = ({
    chip: {
        title,
        id,
        iconConfig,
        color,
        onClick
    },
    backgroundPlatformColor = 'systemGray6',
    collapsed = false,
    chipSetIndex,
    shiftChipRight,
    onToggleCollapsed
}: TPlannerChipProps) => {
    const { onGetDeletingItemsByStorageIdCallback } = useDeleteSchedulerContext<IPlannerEvent>();

    const { weatherChip } = useAppTheme();

    const isPendingDelete = useMemo(() =>
        onGetDeletingItemsByStorageIdCallback(EStorageId.PLANNER_EVENT).some(deleteItem =>
            // This deleting item is the chip's event
            (deleteItem.id === id || (deleteItem.calendarId === id)) &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [onGetDeletingItemsByStorageIdCallback]
    );

    const isWeatherChip = id.includes('weather-chip');
    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor;

    const ChipContent = () => (
        <View
            className='flex-row h-6 gap-1 min-w-6 items-center justify-center rounded-xl mt-2 border'
            style={{
                borderColor: chipCssColor,
                backgroundColor: isWeatherChip ? PlatformColor(weatherChip.background) : PlatformColor(backgroundPlatformColor),
                paddingHorizontal: collapsed ? 0 : 8
            }}
        >
            <GenericIcon
                {...iconConfig}
                platformColor={chipColor}
                size='xs'
            />
            {!collapsed && (
                <CustomText
                    variant='eventChipLabel'
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    customStyle={{
                        color: isWeatherChip ? PlatformColor(weatherChip.label) : chipCssColor,
                        textDecorationLine: isPendingDelete ? 'line-through' : undefined,
                    }}
                >
                    {title}
                </CustomText>
            )}
        </View>
    )

    // const ChipContent = () => (
    //     <View
    //         className='flex-row h-6 gap-1 min-w-6 items-center justify-center rounded-xl mt-2 border relative'
    //         style={{
    //             borderColor: chipCssColor,
    //             paddingHorizontal: collapsed ? 0 : 8
    //         }}
    //     >
    //         <GenericIcon
    //             {...iconConfig}
    //             platformColor={chipColor}
    //             size='xs'
    //         />
    //         {!collapsed && (
    //             <CustomText
    //                 variant='eventChipLabel'
    //                 ellipsizeMode='tail'
    //                 numberOfLines={1}
    //                 customStyle={{
    //                     color: isWeatherChip ? PlatformColor(weatherChip.label) : chipCssColor,
    //                     textDecorationLine: isPendingDelete ? 'line-through' : undefined,
    //                 }}
    //             >
    //                 {title}
    //             </CustomText>
    //         )}
    //         <Host style={{ position: 'absolute', flex: 1, left: 0, top: 0 }}>
    //             <HStack modifiers={[
    //                 glassEffect({ glass: { variant: 'clear' } })
    //             ]}>
    //                 <View className='flex-1' />
    //             </HStack>
    //         </Host>
    //     </View>
    // )

    return (
        <MotiView
            animate={{
                marginRight: collapsed ? COLLAPSED_CHIP_RIGHT_MARGIN : EXPANDED_CHIP_RIGHT_MARGIN
            }}
            style={{
                // Chips stack with the firstly rendered in front
                zIndex: 9000 + (40 / (chipSetIndex + 1)),
                marginLeft: shiftChipRight ? CHIP_SET_GAP : 0,
            }}
        >
            <Pressable
                onPress={collapsed ? onToggleCollapsed : onClick}
            >
                <ChipContent />
            </Pressable>
        </MotiView>
    )
};

export default PlannerChip;
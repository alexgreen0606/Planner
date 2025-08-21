import { TCalendarEventChip } from '@/lib/types/calendar/TCalendarEventChip';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import GenericIcon from '../icon';
import CustomText from '../text/CustomText';
import { EStorageId } from '@/lib/enums/EStorageId';

// ✅ 

const COLLAPSED_CHIP_RIGHT_MARGIN = -18;
const EXPANDED_CHIP_RIGHT_MARGIN = 6;
const CHIP_SET_GAP = 24;

type EventChipProps = {
    chip: TCalendarEventChip;
    backgroundPlatformColor?: string;
    collapsed?: boolean;
    chipSetIndex: number;
    shiftChipRight: boolean;
    parentPlannerDatestamp: string;
    onToggleCollapsed?: () => void;
};

const EventChip = ({
    chip,
    backgroundPlatformColor = 'systemGray6',
    collapsed = false,
    chipSetIndex,
    shiftChipRight,
    onToggleCollapsed
}: EventChipProps) => {
    const { event: { title, id }, iconConfig, color, onClick, hasClickAccess } = chip;

    const { onGetDeletingItemsByStorageIdCallback: getDeletingItems } = useDeleteScheduler<IPlannerEvent>();
    const router = useRouter();

    const isPendingDelete = useMemo(() =>
        getDeletingItems(EStorageId.PLANNER_EVENT).some(deleteItem =>
            // This deleting item is the chip's event
            deleteItem.id === id &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [getDeletingItems]
    );

    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor;

    // =======================
    // 1. UI
    // =======================

    const ChipContent = () => (
        <View
            className='flex-row h-6 gap-1 min-w-6 items-center justify-center rounded-xl mt-2 border'
            style={{
                borderColor: chipCssColor,
                backgroundColor: PlatformColor(backgroundPlatformColor),
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
                        color: chipCssColor,
                        textDecorationLine: isPendingDelete ? 'line-through' : undefined,
                    }}
                >
                    {title}
                </CustomText>
            )}
        </View>
    );

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
            {onClick ? (
                <TouchableOpacity
                    activeOpacity={collapsed || hasClickAccess ? 0 : 1}
                    onPress={collapsed ? onToggleCollapsed : () => onClick(router)}
                >
                    <ChipContent />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    activeOpacity={collapsed ? 0 : 1}
                    onPress={collapsed ? onToggleCollapsed : undefined}
                >
                    <ChipContent />
                </TouchableOpacity>
            )}
        </MotiView>
    );
};

export default EventChip;
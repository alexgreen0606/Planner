import { HEADER_HEIGHT, PAGE_LABEL_HEIGHT } from '@/lib/constants/miscLayout';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp } from '@/utils/dateUtils';
import React from 'react';
import { TextInput, View } from 'react-native';
import CustomText, { textStyles } from '../text/CustomText';

// ✅ 

type TTodayBannerProps = {
    datestamp: string; // YYYY-MM-DD
    today: TPlanner;
    isEditingTitle: boolean;
    OverflowActionsIcon: () => React.JSX.Element;
    onEditTitle: (title: string) => void;
    onToggleEditTitle: () => void;
};

const TodayBanner = ({
    datestamp,
    today,
    isEditingTitle,
    OverflowActionsIcon,
    onEditTitle,
    onToggleEditTitle
}: TTodayBannerProps) => (
    <View
        className='flex-row items-center justify-between w-full'
        style={{ height: HEADER_HEIGHT }}
    >
        <View className='relative flex-1'>

            {/* Date */}
            <View className='absolute bottom-full translate-y-3 flex-row'>
                <CustomText variant='detail'>
                    {getDayOfWeekFromDatestamp(datestamp)}{' '}
                </CustomText>
                <CustomText variant='softDetail'>
                    {getMonthDateFromDatestamp(datestamp)}
                </CustomText>
            </View>

            {/* Title */}
            {isEditingTitle ? (
                <TextInput
                    autoFocus
                    autoCapitalize='words'
                    value={today.title}
                    onChangeText={onEditTitle}
                    onBlur={onToggleEditTitle}
                    className='pr-2'
                    style={[textStyles.pageLabel, {
                        height: PAGE_LABEL_HEIGHT
                    }]}
                />
            ) : (
                <View className='pr-2' style={{ height: PAGE_LABEL_HEIGHT }}>
                    <CustomText
                        variant='pageLabel'
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    >
                        {today.title.trim() || "Today's Plans"}
                    </CustomText>
                </View>
            )}

        </View>

        {/* Overflow Actions */}
        <OverflowActionsIcon />

    </View>
);

export default TodayBanner;
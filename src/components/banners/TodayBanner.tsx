import { HEADER_HEIGHT, PAGE_LABEL_HEIGHT } from '@/lib/constants/miscLayout';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp } from '@/utils/dateUtils';
import React from 'react';
import { TextInput, View } from 'react-native';
import ButtonText from '../text/ButtonText';
import CustomText, { textStyles } from '../text/CustomText';
import WeatherDisplay from '../weather';

// ✅ 

type TTodayBannerProps = {
    datestamp: string; // YYYY-MM-DD
    today: TPlanner;
    isEditingTitle: boolean;
    onEditTitle: (title: string) => void;
    onToggleEditTitle: () => void;
};

const TodayBanner = ({
    datestamp,
    today,
    isEditingTitle,
    onEditTitle,
    onToggleEditTitle
}: TTodayBannerProps) => {

    // TODO: load in weather data
    const high = 47;
    const low = 32;
    const weatherCode = 0;
    const currentTemp = 37;

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Date */}
            <View className='relative flex-1'>
                {isEditingTitle ? (
                    <TextInput
                        autoFocus
                        autoCapitalize='words'
                        value={today.title}
                        onChangeText={onEditTitle}
                        onBlur={onToggleEditTitle}
                        style={[textStyles.pageLabel, {
                            paddingRight: 14,
                            height: PAGE_LABEL_HEIGHT
                        }]}
                    />
                ) : (
                    <ButtonText
                        textType='pageLabel'
                        platformColor='label'
                        onPress={onToggleEditTitle}
                        containerStyle={{ paddingRight: 14, height: PAGE_LABEL_HEIGHT }}
                    >
                        {today.title.trim() || "Today's Plans"}
                    </ButtonText>
                )}
                <View className='absolute bottom-full translate-y-3 flex-row'>
                    <CustomText variant='detail'>
                        {getDayOfWeekFromDatestamp(datestamp)}{' '}
                    </CustomText>
                    <CustomText variant='softDetail'>
                        {getMonthDateFromDatestamp(datestamp)}
                    </CustomText>
                </View>
            </View>

            {/* Weather */}
            <WeatherDisplay
                low={low}
                high={high}
                currentTemp={currentTemp}
                weatherCode={weatherCode}
            />

        </View>
    );
};

export default TodayBanner;
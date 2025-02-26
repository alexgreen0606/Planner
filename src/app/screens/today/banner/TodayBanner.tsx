import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import WeatherDisplay from '../../../../feature/weather';
import LabelSublabel from '../../../../foundation/components/text/LabelSublabel';
import { Palette } from '../../../../foundation/theme/colors';
import GenericIcon from '../../../../foundation/components/GenericIcon';
import { datestampToDayOfWeek, datestampToMonthDate } from '../../../../foundation/calendarEvents/timestampUtils';
import ThinLine from '../../../../foundation/components/ThinLine';
import { BANNER_HEIGHT } from '../../../../foundation/components/constants';

interface TodayBannerProps {
    timestamp: string; // YYYY-MM-DD
    showBannerBorder: boolean;
}

const TodayBanner = ({ timestamp, showBannerBorder }: TodayBannerProps) => {
    // TODO: load in weather data
    const high = 47;
    const low = 32;
    const weatherCode = 0;
    const currentTemp = 37;

    return (
        <View>
            <View style={globalStyles.pageLabelContainer}>

                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='coffee'
                        size='xl'
                        color={Palette.BLUE}
                    />

                    {/* Date */}
                    <LabelSublabel
                        label="Today's Plans"
                        subLabel={datestampToMonthDate(timestamp)}
                        upperSublabel={datestampToDayOfWeek(timestamp)}
                        type='large'
                    />
                </View>

                {/* Weather */}
                <WeatherDisplay
                    low={low}
                    high={high}
                    currentTemp={currentTemp}
                    weatherCode={weatherCode}
                />
            </View>
            {showBannerBorder && <ThinLine centerLine={false} />}
        </View>
    );
};

export default TodayBanner;
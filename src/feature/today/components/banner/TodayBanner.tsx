import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../../../foundation/planners/timeUtils';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import WeatherDisplay from '../../../../foundation/weather/components/WeatherDisplay';
import LabelSublabel from '../../../../foundation/components/text/LabelSublabel';
import { Color } from '../../../../foundation/theme/colors';
import ThinLine from '../../../../foundation/components/separator/ThinLine';

interface TodayBannerProps {
    timestamp: string; // YYYY-MM-DD
    showBannerBorder: boolean;
}

const TodayBanner = ({ timestamp, showBannerBorder }: TodayBannerProps) => {
    // TODO: load in weather data
    const high = 47;
    const low = 32;
    const weatherCode = 0;

    return (
        <View>
            <View style={globalStyles.pageLabelContainer}>

                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='coffee'
                        size={26}
                        color={Color.BLUE}
                    />

                    {/* Date */}
                    <LabelSublabel
                        label={timestampToDayOfWeek(timestamp)}
                        subLabel={timestampToMonthDate(timestamp)}
                        type='large'
                    />
                </View>

                {/* Weather */}
                <WeatherDisplay
                    low={low}
                    high={high}
                    weatherCode={weatherCode}
                />
            </View>
            {showBannerBorder && <ThinLine centerLine={false} />}
        </View>
    );
};

export default TodayBanner;
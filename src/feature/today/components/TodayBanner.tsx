import React from 'react';
import { View, StyleSheet } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../../foundation/planners/timeUtils';
import AppleIcon from '../../../foundation/components/icons/AppleIcon';
import { weatherCodeToFontistoIcon } from '../../../foundation/weather/utils';
import colors from '../../../foundation/theme/colors';
import GenericIcon from '../../../foundation/components/icons/GenericIcon';
import ThinLine from '../../../foundation/components/separators/ThinLine';
import CustomText from '../../../foundation/components/text/CustomText';

interface TodayBannerProps {
    timestamp: string; // YYYY-MM-DD
    hight: number;
    low: number;
    weatherCode: number;
}

const TodayBanner = ({ timestamp, hight, low, weatherCode }: TodayBannerProps) => {

    return (
        <View>
            <View style={globalStyles.pageLabelContainer}>

                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='coffee'
                        size={26}
                        color={colors.blue}
                    />

                    {/* Date */}
                    <View style={styles.dayContainer}>
                        <CustomText type='pageLabel'>{timestampToDayOfWeek(timestamp)}</CustomText>
                        <CustomText type='soft' style={styles.date}>{timestampToMonthDate(timestamp)}</CustomText>
                    </View>
                </View>

                {/* Weather */}
                <View style={styles.weatherContainer}>
                    <CustomText type='highTemp'>{Math.round(hight)}°</CustomText>
                    <View style={styles.divider} />
                    <CustomText type='lowTemp'>{Math.round(low)}°</CustomText>
                    <View style={styles.icon}>
                        <AppleIcon
                            config={{
                                ...weatherCodeToFontistoIcon(weatherCode),
                                size: 20
                            }}
                        />
                    </View>
                </View>
            </View>
            <ThinLine />
        </View>
    );
};

const styles = StyleSheet.create({
    dayContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    dayOfWeek: {
        fontSize: 22,
        color: colors.white
    },
    date: {
        marginBottom: 2,
    },
    weatherContainer: {
        ...globalStyles.verticallyCentered,
        gap: 0,
        height: '100%'
    },
    divider: {
        width: StyleSheet.hairlineWidth,
        height: '80%',
        backgroundColor: colors.grey,
        marginHorizontal: 4,
    },
    icon: {
        marginLeft: 16,
        marginRight: 12
    }
});

export default TodayBanner;
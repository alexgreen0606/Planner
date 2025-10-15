import useAppTheme from "@/hooks/useAppTheme";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { DateTimePicker, Host } from '@expo/ui/swift-ui';
import { useGlobalSearchParams } from "expo-router";
import { DateTime } from "luxon";
import { View } from "react-native";
import Icon from "../Icon";

// ✅ 

type TOpenPlannerButtonProps = {
    currentDatestamp: string;
    onOpenPlanner: (date: Date) => void;
}

const OpenPlannerButton = ({ currentDatestamp, onOpenPlanner }: TOpenPlannerButtonProps) => {
    const { CssColor: { background } } = useAppTheme();
    return (
        <View className='relative h-full'>

            {/* Calendar Icon */}
            <View
                className='pointer-events-none z-[1] pr-4 h-full justify-center'
                style={{ backgroundColor: background }}
            >
                <Icon
                    name='calendar'
                    size={28}
                    color="label"
                />
            </View>

            {/* Date Picker */}
            <View
                key={`${currentDatestamp}-selector`}
                className="absolute left-0"
            >
                <Host matchContents>
                    <DateTimePicker
                        onDateSelected={onOpenPlanner}
                        displayedComponents='date'
                        initialDate={currentDatestamp}
                        variant='automatic'
                    />
                </Host>
            </View>

        </View>
    )
};

export default OpenPlannerButton;
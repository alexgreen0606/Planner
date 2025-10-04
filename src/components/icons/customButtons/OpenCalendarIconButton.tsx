import { TouchableOpacity } from "react-native";
import Icon from "../Icon";

// ✅ 

const OpenCalendarButton = () => {

    return (
        <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => null}
            className='flex-row items-center'
        >
            <Icon
                name='calendar'
                size={22}
                color="label"
            />
            <Icon
                name='chevron.right'
                size={12}
                color="label"
            />
        </TouchableOpacity>
    )
};

export default OpenCalendarButton;
import { PlatformColor, StyleSheet, View } from "react-native"
import { usePathname } from "expo-router";
import Modal from "../../src/foundation/components/Modal";
import ModalInputField from "../../src/foundation/components/ModalInputField";
import ThinLine from "../../src/foundation/sortedLists/components/list/ThinLine";
import DateSelector from "../../src/foundation/calendarEvents/components/timeModal/DateSelector";
import CustomText from "../../src/foundation/components/text/CustomText";
import globalStyles from "../../src/foundation/theme/globalStyles";
import { TIME_MODAL_INPUT_HEIGHT } from "../../src/foundation/calendarEvents/constants";
import { useEffect, useMemo, useState } from "react";
import { datestampToMidnightDate } from "../../src/foundation/calendarEvents/timestampUtils";
import { ItemStatus } from "../../src/foundation/sortedLists/constants";
import Toggle from "../../src/foundation/calendarEvents/components/timeModal/Toggle";
import { useTimeModal } from "../../src/modals/timeModal/TimeModalProvider";

export const TIME_MODAL_PATHNAME = '(modals)/TimeModal';

type FormData = {
    value: string;
    allDay: boolean;
    startDate: Date;
    endDate: Date;
    isCalendarEvent: boolean;
}

const initialFormData: FormData = {
    value: '',
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    isCalendarEvent: false
};

const TimeModal = () => {
    const pathname = usePathname();
    const { initialEvent, onSave, onClose } = useTimeModal();

    const planEvent = useMemo(() => {
        console.log(initialEvent.current)
        return initialEvent.current;
    }, [pathname]);

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const isEditMode = planEvent?.status === ItemStatus.EDIT;
    const formDataFilled = formData.value.length > 0;

    // Sync the form data every time the planEvent changes
    useEffect(() => {
        if (!planEvent) return;
        const now = new Date();
        const currentHour = now.getHours();
        const defaultStartTime = datestampToMidnightDate(planEvent.listId);
        defaultStartTime.setHours(currentHour);
        const defaultEndTime = datestampToMidnightDate(planEvent.listId);
        defaultEndTime.setHours(currentHour + 1);

        setFormData(planEvent.timeConfig ? {
            value: planEvent.value,
            startDate: new Date(planEvent.timeConfig.startTime),
            endDate: new Date(planEvent.timeConfig.endTime),
            allDay: planEvent.timeConfig.allDay,
            isCalendarEvent: !!planEvent.calendarId
        } : {
            value: planEvent.value,
            allDay: false,
            isCalendarEvent: false,
            startDate: defaultStartTime,
            endDate: defaultEndTime,
        });
    }, [planEvent]);

    // ------------- Utility Functions -------------

    function getStartOfDay(date: Date) {
        const startOfDate = new Date(date);
        startOfDate.setHours(0, 0, 0, 0);
        return startOfDate;
    }

    function handleSave() {
        if (!planEvent) return;
        const updatedItem = {
            ...planEvent,
            timeConfig: {
                allDay: formData.allDay,
                startTime: formData.startDate.toISOString(),
                endTime: formData.endDate.toISOString()
            },
            value: formData.value
        };
        if (formData.isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedItem.calendarId = 'NEW';
        }
        if (formData.allDay && updatedItem.calendarId === 'NEW') {
            // All-day events end at the start of the next day -> TODO: why is this only needed for NEW events?
            const startOfNextDay = new Date(formData.endDate);
            startOfNextDay.setDate(startOfNextDay.getDate() + 1);
            updatedItem.timeConfig.endTime = startOfNextDay.toISOString();
        }
        onSave(updatedItem);
    }

    function handleDelete() {
        if (!planEvent) return;
        const updatedItem = { ...planEvent };
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;
        onSave(updatedItem);
    }

    return (
        <Modal
            title='Time Modal'
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSave,
                disabled: !formDataFilled
            }}
            deleteButtonConfig={{
                label: 'Unschedule',
                onClick: handleDelete
            }}
            onClose={onClose}
        >
            {/* Title */}
            <ModalInputField
                label='Title'
                value={formData.value}
                onChange={(newVal) => {
                    setFormData({ ...formData, value: newVal });
                }}
                focusTrigger={pathname === TIME_MODAL_PATHNAME && planEvent?.value.length === 0}
            />

            <ThinLine />

            {/* Start Time */}
            <DateSelector
                label='Start'
                allDay={formData.allDay}
                date={formData.startDate}
                onDateChange={(startDate) => {
                    setFormData({
                        ...formData,
                        startDate
                    })
                }}
            />

            <ThinLine />

            {/* End Time */}
            <DateSelector
                label='End'
                allDay={formData.allDay}
                date={formData.endDate}
                hide={!formData.isCalendarEvent}
                onDateChange={(endDate) => {
                    setFormData({
                        ...formData,
                        endDate
                    })
                }}
            />

            <ThinLine />

            {/* All Day Toggle */}
            <View style={styles.inputField}>
                <CustomText
                    type='standard'
                    style={{
                        color: PlatformColor(!formData.isCalendarEvent ? 'tertiaryLabel' : 'label')
                    }}
                >
                    All Day
                </CustomText>
                {formData.isCalendarEvent && (
                    <Toggle
                        value={formData.allDay}
                        onValueChange={(allDay) => {
                            setFormData({
                                ...formData,
                                allDay,
                                startDate: getStartOfDay(formData.startDate),
                                endDate: getStartOfDay(formData.endDate)
                            });
                        }}
                    />
                )}
            </View>

            <ThinLine />

            {/* Calendar Toggle */}
            <View style={styles.inputField}>
                <CustomText type='standard'>Calendar Event</CustomText>
                <Toggle
                    value={formData.isCalendarEvent}
                    onValueChange={(isCalendarEvent) => {
                        setFormData({
                            ...formData,
                            isCalendarEvent
                        });
                    }}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    inputField: {
        ...globalStyles.spacedApart,
        height: TIME_MODAL_INPUT_HEIGHT
    }
});

export default TimeModal;
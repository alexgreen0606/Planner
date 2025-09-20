import useAppTheme from "@/hooks/useAppTheme";
import { MODAL_INPUT_HEIGHT } from "@/lib/constants/miscLayout";
import { TFormField } from "@/lib/types/form/TFormField";
import { Control, Controller } from "react-hook-form";
import { PlatformColor, StyleSheet, View } from "react-native";
import FormField from "./FormField";
import { MotiView } from "moti";

// ✅ 

type TFormProps = {
    fieldSets: TFormField[][];
    control: Control<any>;
};

const Form = ({ fieldSets, control }: TFormProps) => {
    const { modal: { inputField } } = useAppTheme();
    return (
        <View className='gap-4'>
            {fieldSets.map((fieldSet, fieldSetIndex) =>
                <View key={`field-set-${fieldSetIndex}`} className='rounded-xl overflow-hidden'>
                    {fieldSet.map((field, fieldIndex) => {
                        const upperItem = fieldSet[fieldIndex - 1];
                        const lowerItem = fieldSet[fieldIndex + 1];
                        const isTopEdgeRounded = !upperItem || upperItem.invisible;
                        const isBottomEdgeRounded = !lowerItem || lowerItem.invisible;

                        const topEdgeRadius = isTopEdgeRounded ? MODAL_INPUT_HEIGHT / 4 : 0;
                        const bottomEdgeRadius = isBottomEdgeRounded ? MODAL_INPUT_HEIGHT / 4 : 0;

                        return (
                            <View
                                key={`field-set-${fieldSetIndex}-field-${fieldIndex}`}
                                className='w-full'
                                style={{ height: MODAL_INPUT_HEIGHT }}
                            >
                                <MotiView
                                    animate={{
                                        opacity: field.invisible ? 0 : 1,
                                        borderTopLeftRadius: topEdgeRadius,
                                        borderTopRightRadius: topEdgeRadius,
                                        borderBottomLeftRadius: bottomEdgeRadius,
                                        borderBottomRightRadius: bottomEdgeRadius,
                                    }}
                                    className='items-center' style={{
                                        backgroundColor: PlatformColor(inputField),
                                        borderTopWidth: !isTopEdgeRounded ? StyleSheet.hairlineWidth : 0,
                                        borderColor: PlatformColor('systemGray'),
                                        paddingHorizontal: 9,
                                        pointerEvents: field.invisible ? 'none' : undefined
                                    }}
                                >
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        rules={field.rules}
                                        render={({ field: { onChange, value } }) => <FormField {...field} value={value} onChange={(val) => {
                                            onChange(val);
                                            field.onHandleSideEffects?.(val);
                                        }} />}
                                    />
                                </MotiView>
                            </View>
                        )
                    }
                    )}
                </View>
            )}
        </View>
    )
};

export default Form;
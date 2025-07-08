import { Control, Controller } from "react-hook-form";
import { PlatformColor, StyleSheet, View } from "react-native";
import FormField from "./FormField";
import { IFormField } from "@/lib/types/form/IFormField";

type FormProps = {
    fields: IFormField[][];
    control: Control<any>;
};

const Form = ({
    fields,
    control
}: FormProps) =>
    <View className='gap-4'>
        {fields.map((row, i) =>
            <View key={`form-row-${i}`} className='rounded-xl overflow-hidden'>
                {row.map(({ name, type, defaultValue, rules, hide, ...rest }, i) => !hide &&
                    <View
                        key={name}
                        className='p-3'
                        style={{
                            backgroundColor: PlatformColor('systemGray5'),
                            borderTopWidth: i !== 0 ? StyleSheet.hairlineWidth : 0,
                            borderColor: PlatformColor('systemGray')
                        }}
                    >
                        <Controller
                            name={name}
                            control={control}
                            defaultValue={defaultValue}
                            rules={rules}
                            render={({ field: { onChange, value } }) => (
                                <FormField
                                    type={type}
                                    value={value}
                                    onChange={onChange}
                                    {...rest}
                                />
                            )}
                        />
                    </View>
                )}
            </View>
        )}
    </View>

export default Form;
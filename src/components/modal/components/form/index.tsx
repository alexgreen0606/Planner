import ThinLine from "@/components/ThinLine";
import { Control, Controller } from "react-hook-form";
import { View } from "react-native";
import FormField from "./FormField";
import { IFormField } from "@/types/form/IFormField";

interface FormProps {
    fields: IFormField[];
    control: Control<any>;
}

const Form = ({
    fields,
    control
}: FormProps) =>
    <View className='gap-10'>
        {fields.map(({ name, type, defaultValue, rules, hide, ...rest }) => !hide &&
            <View key={name}>
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
                {/* <ThinLine /> */}
            </View>
        )}
    </View>

export default Form;
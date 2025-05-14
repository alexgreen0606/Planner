import ThinLine from "@/components/ThinLine";
import { Control, Controller } from "react-hook-form";
import { View } from "react-native";
import FormField from "./FormField";
import { IFormField } from "./types";

interface FormProps {
    fields: IFormField[];
    control: Control<any>;
}

const Form = ({
    fields,
    control
}: FormProps) =>
    fields.map(({ name, type, defaultValue, rules, hide, ...rest }) => !hide &&
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
            <ThinLine />
        </View>
    );

export default Form;
import { MotiView } from 'moti';
import { Control, Controller } from 'react-hook-form';
import { PlatformColor, StyleSheet, View } from 'react-native';

import useAppTheme from '@/hooks/useAppTheme';
import { MODAL_INPUT_HEIGHT } from '@/lib/constants/layout';
import { TFormField } from '@/lib/types/form/TFormField';

import FormField from './microComponents/FormField';

interface IFormProps {
  fieldSets: TFormField[][]
  control: Control<any>
}

const Form = ({ fieldSets, control }: IFormProps) => {
  const {
    CssColor: { modalInputField },
  } = useAppTheme()
  return (
    <View className="gap-4">
      {fieldSets.map((fieldSet, fieldSetIndex) => (
        <View key={`field-set-${fieldSetIndex}`} className="rounded-xl overflow-hidden">
          {fieldSet.map((field, fieldIndex) => {
            if (field.floating) {
              return (
                <MotiView
                  key={`field-set-${fieldSetIndex}-field-${fieldIndex}`}
                  className="w-full items-center overflow-hidden"
                  animate={{
                    height: field.invisible ? 0 : MODAL_INPUT_HEIGHT,
                  }}
                >
                  <Controller
                    name={field.name}
                    control={control}
                    rules={field.rules}
                    render={({ field: { onChange, value } }) => (
                      <FormField
                        {...field}
                        value={value}
                        onChange={(val) => {
                          onChange(val)
                          field.onHandleSideEffects?.(val)
                        }}
                      />
                    )}
                  />
                </MotiView>
              )
            }

            const upperItem = fieldSet[fieldIndex - 1]
            const lowerItem = fieldSet[fieldIndex + 1]
            const isTopEdgeRounded = !upperItem || upperItem.invisible
            const isBottomEdgeRounded = !lowerItem || lowerItem.invisible

            const topEdgeRadius = isTopEdgeRounded ? MODAL_INPUT_HEIGHT / 4 : 0
            const bottomEdgeRadius = isBottomEdgeRounded ? MODAL_INPUT_HEIGHT / 4 : 0

            return (
              <MotiView
                key={`field-set-${fieldSetIndex}-field-${fieldIndex}`}
                animate={{
                  height: field.invisible ? 0 : MODAL_INPUT_HEIGHT,
                }}
                className="items-center w-full overflow-hidden"
                style={{
                  backgroundColor: modalInputField,
                  borderTopWidth:
                    !field.invisible && !isTopEdgeRounded ? StyleSheet.hairlineWidth : 0,
                  borderColor: PlatformColor('systemGray'),
                  paddingHorizontal: 9,
                  pointerEvents: field.invisible ? 'none' : undefined,
                  borderTopLeftRadius: topEdgeRadius,
                  borderTopRightRadius: topEdgeRadius,
                  borderBottomLeftRadius: bottomEdgeRadius,
                  borderBottomRightRadius: bottomEdgeRadius,
                }}
              >
                <Controller
                  name={field.name}
                  control={control}
                  rules={field.rules}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      {...field}
                      value={value}
                      onChange={(val) => {
                        onChange(val)
                        field.onHandleSideEffects?.(val)
                      }}
                    />
                  )}
                />
              </MotiView>
            )
          })}
        </View>
      ),
      )}
    </View>
  )
}

export default Form
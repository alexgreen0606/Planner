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
                  className="w-full items-center overflow-hidden"
                  animate={{
                    height: field.invisible ? 0 : MODAL_INPUT_HEIGHT,
                  }}
                  key={`field-set-${fieldSetIndex}-field-${fieldIndex}`}
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
                animate={{
                  height: field.invisible ? 0 : MODAL_INPUT_HEIGHT,
                }}
                className="w-full overflow-hidden"
                key={`field-set-${fieldSetIndex}-field-${fieldIndex}`}
              >
                <View
                  style={{
                    backgroundColor: modalInputField,
                    borderTopWidth:
                      !field.invisible && !isTopEdgeRounded ? StyleSheet.hairlineWidth : 0,
                    borderColor: PlatformColor('systemGray'),
                    pointerEvents: field.invisible ? 'none' : undefined,
                    borderTopLeftRadius: topEdgeRadius,
                    borderTopRightRadius: topEdgeRadius,
                    borderBottomLeftRadius: bottomEdgeRadius,
                    borderBottomRightRadius: bottomEdgeRadius,
                  }}
                  className="items-center flex-1 px-2"
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
                </View>
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
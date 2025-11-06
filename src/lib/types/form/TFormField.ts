import { SFSymbol } from 'expo-symbols'
import { RegisterOptions } from 'react-hook-form'

import { TCheckboxModalFieldProps } from '@/components/Form/microComponents/CheckboxModalField'
import { TColorPickerModalFieldProps } from '@/components/Form/microComponents/ColorPickerModalField'
import { TDateModalFieldProps } from '@/components/Form/microComponents/DateModalField'
import { TPickerModalFieldProps } from '@/components/Form/microComponents/PickerModalField'
import { TTextModalFieldProps } from '@/components/Form/microComponents/TextModalField'
import { EFormFieldType } from '@/lib/enums/EFormFieldType'

// ✅

export type TFormFieldConfig = {
  name: string
  rules?: RegisterOptions
  invisible?: boolean
  floating?: boolean

  // Handles any side effects caused by setting the field with a new value.
  onHandleSideEffects?: (val: any) => void
}

export type TFormFieldControl<T> = {
  value: T
  onChange: (val: T) => void
}

export type TFormField =
  | (TFormFieldConfig & TTextModalFieldProps & { type: EFormFieldType.TEXT })
  | (TFormFieldConfig & TCheckboxModalFieldProps & { type: EFormFieldType.CHECKBOX })
  | (TFormFieldConfig & TDateModalFieldProps & { type: EFormFieldType.DATE })
  | (TFormFieldConfig & TPickerModalFieldProps & { type: EFormFieldType.PICKER })
  | (TFormFieldConfig & TColorPickerModalFieldProps & { type: EFormFieldType.COLOR_PICKER })

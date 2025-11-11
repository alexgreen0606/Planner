import { RegisterOptions } from 'react-hook-form';

import { ICheckboxModalFieldProps } from '@/components/Form/microComponents/CheckboxModalField';
import { IColorPickerModalFieldProps } from '@/components/Form/microComponents/ColorPickerModalField';
import { IDateModalFieldProps } from '@/components/Form/microComponents/DateModalField';
import { IPickerModalFieldProps } from '@/components/Form/microComponents/PickerModalField';
import { ITextModalFieldProps } from '@/components/Form/microComponents/TextModalField';
import { EFormFieldType } from '@/lib/enums/EFormFieldType';

type TFormFieldConfig = {
  name: string;
  rules?: RegisterOptions;
  invisible?: boolean;
  floating?: boolean;

  // Handles any side effects caused by setting the field with a new value.
  onHandleSideEffects?: (val: any) => void;
};

export type TFormField =
  | (TFormFieldConfig & ITextModalFieldProps & { type: EFormFieldType.TEXT })
  | (TFormFieldConfig & ICheckboxModalFieldProps & { type: EFormFieldType.CHECKBOX })
  | (TFormFieldConfig & IDateModalFieldProps & { type: EFormFieldType.DATE })
  | (TFormFieldConfig & IPickerModalFieldProps & { type: EFormFieldType.PICKER })
  | (TFormFieldConfig & IColorPickerModalFieldProps & { type: EFormFieldType.COLOR_PICKER });

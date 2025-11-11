import { DateTime } from 'luxon';

import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { TFormField } from '@/lib/types/form/TFormField';
import { TFormFieldControl } from '@/lib/types/form/TFormFieldControl';

import CheckboxModalField, { ICheckboxModalFieldProps } from './CheckboxModalField';
import ColorPickerModalField, { IColorPickerModalFieldProps } from './ColorPickerModalField';
import DateModalField, { IDateModalFieldProps } from './DateModalField';
import PickerModalField, { IPickerModalFieldProps } from './PickerModalField';
import TextModalField, { ITextModalFieldProps } from './TextModalField';

const TextField = (props: ITextModalFieldProps & TFormFieldControl<string>) => (
  <TextModalField {...props} />
);
const CheckboxField = (props: ICheckboxModalFieldProps & TFormFieldControl<boolean>) => (
  <CheckboxModalField {...props} />
);
const DateField = (props: IDateModalFieldProps & TFormFieldControl<DateTime>) => (
  <DateModalField {...props} />
);
const PickerField = (props: IPickerModalFieldProps & TFormFieldControl<string | undefined>) => (
  <PickerModalField {...props} />
);
const ColorPickerField = (props: IColorPickerModalFieldProps & TFormFieldControl<string>) => (
  <ColorPickerModalField {...props} />
);

const FormField = (field: TFormField & TFormFieldControl<any>) => {
  switch (field.type) {
    case EFormFieldType.TEXT:
      return <TextField {...field} />;
    case EFormFieldType.CHECKBOX:
      return <CheckboxField {...field} />;
    case EFormFieldType.DATE:
      return <DateField {...field} />;
    case EFormFieldType.PICKER:
      return <PickerField {...field} />;
    case EFormFieldType.COLOR_PICKER:
      return <ColorPickerField {...field} />;
  }
};

export default FormField;

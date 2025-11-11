import { DateTime } from 'luxon';

import { EFormFieldType } from '@/lib/enums/EFormFieldType';
import { TFormField } from '@/lib/types/form/TFormField';
import { TFormFieldControl } from '@/lib/types/form/TFormFieldControl';

import CheckboxModalField, { TCheckboxModalFieldProps } from './CheckboxModalField';
import ColorPickerModalField, { TColorPickerModalFieldProps } from './ColorPickerModalField';
import DateModalField, { TDateModalFieldProps } from './DateModalField';
import PickerModalField, { TPickerModalFieldProps } from './PickerModalField';
import TextModalField, { TTextModalFieldProps } from './TextModalField';

const TextField = (props: TTextModalFieldProps & TFormFieldControl<string>) => (
  <TextModalField {...props} />
);
const CheckboxField = (props: TCheckboxModalFieldProps & TFormFieldControl<boolean>) => (
  <CheckboxModalField {...props} />
);
const DateField = (props: TDateModalFieldProps & TFormFieldControl<DateTime>) => (
  <DateModalField {...props} />
);
const PickerField = (props: TPickerModalFieldProps & TFormFieldControl<string | undefined>) => (
  <PickerModalField {...props} />
);
const ColorPickerField = (props: TColorPickerModalFieldProps & TFormFieldControl<string>) => (
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

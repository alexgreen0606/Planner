import { DateTimePicker, Host } from '@expo/ui/swift-ui'
import { SFSymbol } from 'expo-symbols'
import { DateTime } from 'luxon'
import React from 'react'

import ModalDisplayValue from '@/components/Modal/ModalDisplayValue'
import { TFormFieldControl } from '@/lib/types/form/TFormField'
import { getValidCssColor } from '@/utils/colorUtils'

// ✅

export type TDateModalFieldProps = {
  label: string
  showTime?: boolean
  minimumDate?: Date
  disabled?: boolean
  iconName?: SFSymbol
  color?: string
}

// TODO: need to handle change of date (affects initialDate)
const DateModalField = ({
  label = '',
  value,
  showTime,
  minimumDate,
  iconName,
  disabled,
  color = 'label',
  onChange,
}: TDateModalFieldProps & TFormFieldControl<DateTime>) => (
  <ModalDisplayValue
    label={label}
    value={
      <Host matchContents>
        <DateTimePicker
          onDateSelected={(newDate) => onChange(DateTime.fromJSDate(newDate))}
          displayedComponents={showTime ? 'dateAndTime' : 'date'}
          initialDate={value.toISO()}
          variant="automatic"
          color={getValidCssColor(color)}
        />
      </Host>
    }
    disabled={disabled}
    iconName={iconName}
  />
)

export default DateModalField

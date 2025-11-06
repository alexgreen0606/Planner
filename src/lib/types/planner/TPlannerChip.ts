import { GenericIconProps } from '@/components/icons/Icon'

// ✅

export type TPlannerChip = {
  id: string
  title: string
  color: string
  iconConfig: GenericIconProps
  onClick?: () => void
}

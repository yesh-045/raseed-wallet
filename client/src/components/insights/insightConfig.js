// Insight tools configuration
import {
  MonetizationOn as MoneyIcon,
  Repeat as RepeatIcon,
  Psychology as AIIcon,
  CompareArrows as OverlapIcon,
  Kitchen as KitchenIcon,
  FlashOn as MicroIcon,
} from '@mui/icons-material';

export const insightTools = [
  {
    id: 'fhs',
    name: 'Financial Health',
    description: 'Comprehensive financial wellness analysis',
    icon: MoneyIcon,
    color: '#1976d2',
  },
  {
    id: 'recurring',
    name: 'Recurring Patterns',
    description: 'Subscription and recurring expense detection',
    icon: RepeatIcon,
    color: '#9c27b0',
  },
  {
    id: 'need_want',
    name: 'Need vs Want',
    description: 'Essential vs non-essential spending breakdown',
    icon: AIIcon,
    color: '#2e7d32',
  },
  {
    id: 'overlap',
    name: 'Spending Overlaps',
    description: 'Duplicate subscriptions and redundant spending',
    icon: OverlapIcon,
    color: '#ed6c02',
  },
  {
    id: 'pantry',
    name: 'Food Waste',
    description: 'Pantry management and waste reduction',
    icon: KitchenIcon,
    color: '#0288d1',
  },
  {
    id: 'micro_moment',
    name: 'Impulse Spending',
    description: 'Micro-moment and trigger analysis',
    icon: MicroIcon,
    color: '#d32f2f',
  }
];
import type { ComponentType, SVGProps } from 'react';
import { IconGrid, IconBolt, IconList, IconTrend, IconHeat, IconUpload, IconSettings } from '../common/Icons';

export type TabId = 'dashboard' | 'recommendations' | 'explorer' | 'trends' | 'heatmap' | 'data' | 'settings';

export interface NavItem {
  id: TabId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'لوحة القيادة', icon: IconGrid },
  { id: 'recommendations', label: 'توصيات التوزيع', icon: IconBolt },
  { id: 'explorer', label: 'مستكشف الموديلات', icon: IconList },
  { id: 'trends', label: 'الاتجاهات الأسبوعية', icon: IconTrend },
  { id: 'heatmap', label: 'خريطة الفروع', icon: IconHeat },
  { id: 'data', label: 'البيانات واللقطات', icon: IconUpload },
  { id: 'settings', label: 'الإعدادات', icon: IconSettings },
];

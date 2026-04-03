import { Platform, useWindowDimensions } from 'react-native';

export type LayoutTier = 'compact' | 'regular' | 'expanded';

export interface ResponsiveLayout {
  tier: LayoutTier;
  isIOS: boolean;
  width: number;
  contentPadding: number;
  cardPadding: number;
  heroTitleSize: number;
  titleSize: number;
  bodySize: number;
  captionSize: number;
  sectionGap: number;
  controlHeight: number;
  tabBarHeight: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();
  const isIOS = Platform.OS === 'ios';

  const tier: LayoutTier =
    width < 380 ? 'compact' : width >= 430 ? 'expanded' : 'regular';

  const base = tier === 'compact' ? 14 : tier === 'expanded' ? 18 : 16;
  const iosBoost = isIOS ? 1 : 0;

  return {
    tier,
    isIOS,
    width,
    contentPadding: base,
    cardPadding: base + 2,
    heroTitleSize: (tier === 'compact' ? 21 : tier === 'expanded' ? 25 : 23) + iosBoost,
    titleSize: (tier === 'compact' ? 17 : tier === 'expanded' ? 19 : 18) + iosBoost,
    bodySize: tier === 'compact' ? 13 : 14,
    captionSize: tier === 'compact' ? 11 : 12,
    sectionGap: tier === 'compact' ? 14 : tier === 'expanded' ? 20 : 16,
    controlHeight: tier === 'compact' ? 44 : 48,
    tabBarHeight: tier === 'compact' ? 60 : tier === 'expanded' ? 70 : 64,
  };
}

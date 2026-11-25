import { Tabs } from 'expo-router';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Kế hoạch',
          tabBarActiveTintColor: appColors.primary,
          tabBarIcon: ({ focused }) => (
            <Icon icon={focused ? icons.tabCalendarActive : icons.tabCalendar} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Mua sắm',
          tabBarActiveTintColor: appColors.primary,
          tabBarIcon: ({ focused }) => (
            <Icon icon={focused ? icons.tabBasketActive : icons.tabBasket} />
          ),
        }}
      />
    </Tabs>
  );
}

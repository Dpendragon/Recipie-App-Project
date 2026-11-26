import { Tabs } from 'expo-router';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: appColors.primary }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Yêu thích' }} />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Kế hoạch',
          tabBarIcon: ({ focused }) => (
            <Icon icon={focused ? icons.tabCalendarActive : icons.tabCalendar} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Mua sắm',
          tabBarIcon: ({ focused }) => (
            <Icon icon={focused ? icons.tabBasketActive : icons.tabBasket} />
          ),
        }}
      />
    </Tabs>
  );
}

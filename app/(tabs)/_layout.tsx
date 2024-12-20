import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? '#1a1a1a' : '#ffffff',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: isDarkColorScheme ? '#666666' : '#999999',
      }}
    >
      <Tabs.Screen
        name="(watchlist)"
        options={{
          title: 'Watchlists',
          tabBarLabel: 'Watchlists',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="search" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabBarIcon({
  name,
  color,
  size,
}: {
  name: 'list' | 'search' | 'settings';
  color: string;
  size: number;
}) {
  const icons = {
    list: '📋',
    search: '🔍',
    settings: '⚙️',
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {icons[name]}
    </Text>
  );
}
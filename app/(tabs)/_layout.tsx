import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

const C = { purple: '#6C63FF', muted: 'rgba(255,255,255,0.4)', bg: '#0f0c29', border: 'rgba(255,255,255,0.08)' };

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? C.purple : C.muted, fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Transactions" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Budget" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

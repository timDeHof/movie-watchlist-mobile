import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '~/context/auth-context';
import { useColorScheme } from '~/lib/useColorScheme';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();

  const toggleTheme = () => {
    setColorScheme(isDarkColorScheme ? 'light' : 'dark');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="p-4">
        <View className="space-y-4">
          <View className="bg-card p-4 rounded-lg">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Account
            </Text>
            <Text className="text-muted-foreground">{user?.email}</Text>
          </View>

          <View className="bg-card p-4 rounded-lg">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Appearance
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-foreground">Dark Mode</Text>
              <Switch
                value={isDarkColorScheme}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: '#0891b2' }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-red-500 p-4 rounded-lg mt-4"
            onPress={signOut}
          >
            <Text className="text-white font-semibold text-center">Sign Out</Text>
          </TouchableOpacity>

          <View className="mt-8">
            <Text className="text-center text-muted-foreground">
              Version 1.0.0
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
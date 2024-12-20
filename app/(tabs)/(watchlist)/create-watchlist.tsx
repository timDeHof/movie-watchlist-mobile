import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '~/context/auth-context';
import { supabase } from '~/lib/supabase';

interface WatchlistFormData {
  title: string;
  description: string;
  privacy_setting: 'public' | 'private';
}

export default function CreateWatchlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WatchlistFormData>({
    title: '',
    description: '',
    privacy_setting: 'private',
  });

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: insertError } = await supabase.from('watchlists').insert({
        user_id: user?.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        privacy_setting: formData.privacy_setting,
      });

      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <Text className="text-2xl font-bold text-foreground">
              Create New Watchlist
            </Text>

            {error && (
              <Text className="text-red-500 mb-4">{error}</Text>
            )}

            <View>
              <Text className="text-foreground mb-2">Title</Text>
              <TextInput
                className="bg-input border border-border rounded-lg p-4 text-foreground"
                placeholder="Enter watchlist title"
                placeholderTextColor="#666"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, title: text }))
                }
              />
            </View>

            <View>
              <Text className="text-foreground mb-2">Description (Optional)</Text>
              <TextInput
                className="bg-input border border-border rounded-lg p-4 text-foreground"
                placeholder="Enter watchlist description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
              />
            </View>

            <View>
              <Text className="text-foreground mb-2">Privacy Setting</Text>
              <View className="flex-row space-x-4">
                {(['private', 'public'] as const).map((setting) => (
                  <TouchableOpacity
                    key={setting}
                    className={`flex-1 p-4 rounded-lg border ${formData.privacy_setting === setting
                        ? 'bg-primary border-primary'
                        : 'bg-card border-border'
                      }`}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        privacy_setting: setting,
                      }))
                    }
                  >
                    <Text
                      className={`text-center font-semibold ${formData.privacy_setting === setting
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                        }`}
                    >
                      {setting.charAt(0).toUpperCase() + setting.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary p-4 rounded-lg items-center mt-4"
              onPress={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-semibold">
                  Create Watchlist
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '~/context/auth-context';
import { supabase } from '~/lib/supabase';

interface WatchlistFormData {
  title: string;
  description: string;
  privacy_setting: 'public' | 'private';
}

export default function EditWatchlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WatchlistFormData>({
    title: '',
    description: '',
    privacy_setting: 'private',
  });

  // Fetch current watchlist data
  const { data: watchlist } = useQuery({
    queryKey: ['watchlist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Set initial form data when watchlist data is loaded
  useEffect(() => {
    if (watchlist) {
      setFormData({
        title: watchlist.title,
        description: watchlist.description || '',
        privacy_setting: watchlist.privacy_setting,
      });
    }
  }, [watchlist]);

  const updateWatchlist = useMutation({
    mutationFn: async (data: WatchlistFormData) => {
      const { error } = await supabase
        .from('watchlists')
        .update({
          title: data.title.trim(),
          description: data.description.trim(),
          privacy_setting: data.privacy_setting,
        })
        .eq('id', id)
        .eq('user_id', user?.id); // Ensure user owns the watchlist

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['watchlist', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlists', user?.id] });
      router.back();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update watchlist');
    },
  });

  const handleUpdate = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await updateWatchlist.mutateAsync(formData);
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
        <ScrollView className="flex-1">
          <View className=" p-4 space-y-6">
            {error && (
              <View className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Text className="text-red-700 dark:text-red-300">{error}</Text>
              </View>
            )}

            <View className="space-y-2 my-2">
              <Text className="text-foreground font-medium">Title</Text>
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

            <View className="space-y-2 my-2">
              <Text className="text-foreground font-medium">Description (Optional)</Text>
              <TextInput
                className="bg-input border border-border rounded-lg p-4 text-foreground min-h-[100]"
                placeholder="Enter watchlist description"
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
              />
            </View>

            <View className="space-y-2 my-2">
              <Text className="text-foreground font-medium">Privacy Setting</Text>
              <View className="flex-row gap-x-4">
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
                      className={`text-center font-medium ${formData.privacy_setting === setting
                        ? 'text-primaryForeground'
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
              className={`p-4 rounded-lg items-center ${isLoading ? 'bg-primary/70' : 'bg-primary'
                }`}
              onPress={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primaryForeground font-medium">
                  Update Watchlist
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
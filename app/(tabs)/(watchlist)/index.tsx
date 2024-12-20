import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/context/auth-context';

interface Watchlist {
  id: string;
  title: string;
  description: string;
  privacy_setting: 'public' | 'private';
  created_at: string;
}

export default function WatchlistsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: watchlists, isLoading, refetch } = useQuery({
    queryKey: ['watchlists', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Watchlist[];
    },
    enabled: !!user?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={watchlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/(tabs)/(watchlist)/${item.id}`} asChild>
            <TouchableOpacity className="p-4 bg-card m-2 rounded-lg border border-border">
              <View>
                <Text className="text-lg font-semibold text-foreground">
                  {item.title}
                </Text>
                {item.description && (
                  <Text className="text-muted-foreground mt-1">
                    {item.description}
                  </Text>
                )}
                <View className="flex-row items-center mt-2">
                  <Text
                    className={`text-xs ${item.privacy_setting === 'public'
                      ? 'text-green-500'
                      : 'text-yellow-500'
                      }`}
                  >
                    {item.privacy_setting.charAt(0).toUpperCase() +
                      item.privacy_setting.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-foreground text-lg text-center">
              You don't have any watchlists yet
            </Text>
            <Link href="/(tabs)/(watchlist)/create-watchlist" asChild>
              <TouchableOpacity className="mt-4 bg-primary px-6 py-3 rounded-lg">
                <Text className="text-primary-foreground font-semibold">
                  Create Watchlist
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <Link href="/(tabs)/(watchlist)/create-watchlist" asChild>
        <TouchableOpacity className="absolute bottom-4 right-4 bg-primary w-14 h-14 rounded-full items-center justify-center">
          <Text className="text-2xl text-primary-foreground">+</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}
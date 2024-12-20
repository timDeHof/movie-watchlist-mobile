import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/context/auth-context';
import { Link } from 'expo-router';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface WatchlistItem {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  watched_status: boolean;
  details: {
    title?: string;
    name?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
  };
}

interface Watchlist {
  id: string;
  title: string;
  description: string;
  privacy_setting: 'public' | 'private';
  user_id: string;
}

export default function WatchlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: watchlist, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ['watchlist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Watchlist;
    },
  });

  useLayoutEffect(() => {
    if (watchlist) {
      router.setParams({ title: watchlist.title });
    }
  }, [watchlist]);

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['watchlist-items', id],
    queryFn: async () => {
      const { data: watchlistItems, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('watchlist_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch details for each item from TMDB
      const itemsWithDetails = await Promise.all(
        watchlistItems.map(async (item) => {
          const response = await fetch(
            `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id
            }?api_key=${Constants.expoConfig?.extra?.tmdbApiKey}`
          );
          const details = await response.json();
          return { ...item, details };
        })
      );

      return itemsWithDetails as WatchlistItem[];
    },
  });

  const toggleWatchedStatus = useMutation({
    mutationFn: async ({
      itemId,
      status,
    }: {
      itemId: string;
      status: boolean;
    }) => {
      const { error } = await supabase
        .from('watchlist_items')
        .update({ watched_status: status })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-items', id] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-items', id] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['watchlist-items', id] });
    setRefreshing(false);
  }, [id, queryClient]);

  const handleShare = async () => {
    if (!watchlist) return;

    try {
      const { data, error } = await supabase
        .from('shared_links')
        .insert({
          watchlist_id: watchlist.id,
          share_code: Math.random().toString(36).substring(2, 15),
        })
        .select()
        .single();

      if (error) throw error;

      await Share.share({
        message: `Check out my watchlist: ${watchlist.title}\n\nhttps://your-app-domain.com/shared/${data.share_code}`,
      });
    } catch (error) {
      console.error('Error sharing watchlist:', error);
    }
  };

  if (isLoadingWatchlist || isLoadingItems) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!watchlist) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-foreground text-lg text-center">
          Watchlist not found
        </Text>
      </View>
    );
  }

  const isOwner = watchlist.user_id === user?.id;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View
        className="p-4 bg-card border-b border-border"
        accessible
        accessibilityRole="header"
      >
        <View className="space-y-2">
          <Text className="text-2xl font-bold text-foreground" accessibilityRole="header">
            {watchlist.title}
          </Text>
          {watchlist.description && (
            <Text
              className="text-mutedForeground text-base"
              accessibilityRole="text"
              accessibilityLabel={`Description: ${watchlist.description}`}
            >
              {watchlist.description}
            </Text>
          )}
        </View>
        <View className="flex-row justify-between items-center mt-6">
          <View className="flex-row items-center">
            <View
              className={`px-3 py-1 rounded-full ${watchlist.privacy_setting === 'public'
                  ? 'bg-success/20'
                  : 'bg-warning/20'
                }`}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Privacy setting: ${watchlist.privacy_setting}`}
            >
              <Text
                className={`text-sm font-medium ${watchlist.privacy_setting === 'public'
                    ? 'text-success'
                    : 'text-warning'
                  }`}
              >
                {watchlist.privacy_setting.charAt(0).toUpperCase() +
                  watchlist.privacy_setting.slice(1)}
              </Text>
            </View>
          </View>
          {isOwner && (
            <View className="flex-row gap-x-3">
              <Link href={`/(tabs)/(watchlist)/edit?id=${id}`} asChild>
                <TouchableOpacity
                  className="bg-accent hover:bg-accent/80 px-4 py-2 rounded-lg min-w-[44px] min-h-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Edit watchlist"
                  accessibilityHint="Opens the edit screen for this watchlist"
                >
                  <Text className="text-foreground font-medium">Edit</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity
                onPress={handleShare}
                className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg min-w-[44px] min-h-[44px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Share watchlist"
                accessibilityHint="Opens sharing options for this watchlist"
              >
                <Text className="text-primaryForeground font-medium">Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        className="px-2"
        accessibilityRole="list"
        accessibilityLabel="Watchlist items"
        renderItem={({ item }) => (
          <View
            className="flex-row p-4 my-1 bg-card rounded-lg border border-border"
            accessible
            accessibilityRole="none"
          >
            <Image
              source={{
                uri: item.details.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}${item.details.poster_path}`
                  : 'https://via.placeholder.com/100x150',
              }}
              className="w-20 h-30 rounded-lg"
              accessibilityRole="image"
              accessibilityLabel={`Poster for ${item.details.title || item.details.name}`}
            />
            <View className="flex-1 ml-4 justify-between">
              <View>
                <Text
                  className="text-lg font-semibold text-foreground"
                  accessibilityRole="header"
                >
                  {item.details.title || item.details.name}
                </Text>
                <Text
                  className="text-mutedForeground text-sm mt-1"
                  accessibilityLabel={`Released in ${new Date(
                    item.details.release_date || item.details.first_air_date || ''
                  ).getFullYear() || 'N/A'}`}
                >
                  {new Date(
                    item.details.release_date || item.details.first_air_date || ''
                  ).getFullYear() || 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <View
                  className="flex-row items-center"
                  accessible
                  accessibilityLabel={`Rating: ${item.details.vote_average.toFixed(1)} out of 10, Type: ${item.media_type}`}
                >
                  <Text className="text-yellow-500">★</Text>
                  <Text className="text-mutedForeground ml-1">
                    {item.details.vote_average.toFixed(1)}
                  </Text>
                  <Text className="text-mutedForeground ml-4 uppercase text-xs">
                    {item.media_type}
                  </Text>
                </View>
                {isOwner && (
                  <View className="flex-row items-center gap-x-3">
                    <TouchableOpacity
                      onPress={() =>
                        toggleWatchedStatus.mutate({
                          itemId: item.id,
                          status: !item.watched_status,
                        })
                      }
                      className={`px-3 py-1 rounded-full min-w-[44px] min-h-[44px] items-center justify-center ${item.watched_status
                        ? 'bg-success/10 dark:bg-success/20'
                        : 'bg-warning/10 dark:bg-warning/20'
                        }`}
                      accessibilityRole="button"
                      accessibilityLabel={`Mark as ${item.watched_status ? 'not watched' : 'watched'}`}
                      accessibilityState={{ checked: item.watched_status }}
                    >
                      <Text
                        className={`text-sm font-medium ${item.watched_status
                          ? 'text-success dark:text-success'
                          : 'text-warning dark:text-warning'
                          }`}
                      >
                        {item.watched_status ? 'Watched' : 'Not Watched'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteItem.mutate(item.id)}
                      className="px-2 min-w-[44px] min-h-[44px] items-center justify-center"
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.details.title || item.details.name}`}
                    >
                      <Text className="text-error font-medium">Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View
            className="flex-1 justify-center items-center p-8"
            accessible
            accessibilityRole="text"
          >
            <Text className="text-foreground text-lg text-center mb-4">
              No items in this watchlist
            </Text>
            {isOwner && (
              <TouchableOpacity
                onPress={() => router.push('/search')}
                className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-lg min-w-[44px] min-h-[44px]"
                accessibilityRole="button"
                accessibilityLabel="Add items to watchlist"
                accessibilityHint="Opens the search screen to add new items"
              >
                <Text className="text-primaryForeground font-medium">
                  Add Items
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            accessibilityLabel="Pull to refresh watchlist"
          />
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </SafeAreaView>
  );
}
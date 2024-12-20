import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { supabase } from '~/lib/supabase';

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

export default function SharedWatchlistScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['shared-watchlist', code],
    queryFn: async () => {
      // Get the watchlist ID from the share code
      const { data: shareData, error: shareError } = await supabase
        .from('shared_links')
        .select('watchlist_id')
        .eq('share_code', code)
        .single();

      if (shareError) throw shareError;

      // Get the watchlist details
      const { data: watchlist, error: watchlistError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('id', shareData.watchlist_id)
        .single();

      if (watchlistError) throw watchlistError;

      // Get the watchlist items
      const { data: watchlistItems, error: itemsError } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('watchlist_id', shareData.watchlist_id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

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

      return {
        watchlist: watchlist as Watchlist,
        items: itemsWithDetails as WatchlistItem[],
      };
    },
  });

  const handleShare = async () => {
    if (!data?.watchlist) return;

    try {
      await Share.share({
        message: `Check out this watchlist: ${data.watchlist.title}\n\nhttps://your-app-domain.com/shared/${code}`,
      });
    } catch (error) {
      console.error('Error sharing watchlist:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-foreground text-lg text-center">
          Watchlist not found or no longer available
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="p-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">
          {data.watchlist.title}
        </Text>
        {data.watchlist.description && (
          <Text className="text-muted-foreground mt-2">
            {data.watchlist.description}
          </Text>
        )}
        <TouchableOpacity
          onPress={handleShare}
          className="bg-primary px-4 py-2 rounded-lg mt-4 self-start"
        >
          <Text className="text-primary-foreground">Share</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row p-4 border-b border-border">
            <Image
              source={{
                uri: item.details.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}${item.details.poster_path}`
                  : 'https://via.placeholder.com/100x150',
              }}
              className="w-20 h-30 rounded-lg"
            />
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-foreground">
                {item.details.title || item.details.name}
              </Text>
              <Text className="text-muted-foreground">
                {new Date(
                  item.details.release_date || item.details.first_air_date || ''
                ).getFullYear() || 'N/A'}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-yellow-500">★</Text>
                <Text className="text-muted-foreground ml-1">
                  {item.details.vote_average.toFixed(1)}
                </Text>
                <Text className="text-muted-foreground ml-4 uppercase text-xs">
                  {item.media_type}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-foreground text-lg text-center">
              This watchlist is empty
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
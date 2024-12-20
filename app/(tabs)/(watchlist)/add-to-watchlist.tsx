import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/context/auth-context';

const TMDB_API_KEY = Constants.expoConfig?.extra?.tmdbApiKey as string;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
}

interface Watchlist {
  id: string;
  title: string;
}

export default function AddToWatchlistScreen() {
  const { id, mediaType } = useLocalSearchParams<{
    id: string;
    mediaType: 'movie' | 'tv';
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);

  const { data: mediaDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['media-details', mediaType, id],
    queryFn: async () => {
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}`
      );
      if (!response.ok) throw new Error('Failed to fetch media details');
      return response.json() as Promise<MediaDetails>;
    },
  });

  const { data: watchlists, isLoading: isLoadingWatchlists } = useQuery({
    queryKey: ['user-watchlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlists')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Watchlist[];
    },
    enabled: !!user?.id,
  });

  const addToWatchlist = useMutation({
    mutationFn: async (watchlistId: string) => {
      const { error } = await supabase.from('watchlist_items').insert({
        watchlist_id: watchlistId,
        tmdb_id: Number(id),
        media_type: mediaType,
        watched_status: false,
      });

      if (error) throw error;
    },
    onSuccess: (_, watchlistId) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-items', watchlistId] });
      queryClient.invalidateQueries({ queryKey: ['watchlists', user?.id] });
      router.back();
    },
  });

  if (isLoadingDetails || isLoadingWatchlists) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!mediaDetails || !watchlists) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-foreground text-lg text-center">
          Failed to load content
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="flex-row">
            <Image
              source={{
                uri: mediaDetails.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}${mediaDetails.poster_path}`
                  : 'https://via.placeholder.com/300x450',
              }}
              className="w-32 h-48 rounded-lg"
            />
            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold text-foreground">
                {mediaDetails.title || mediaDetails.name}
              </Text>
              <Text className="text-muted-foreground mt-1">
                {new Date(
                  mediaDetails.release_date || mediaDetails.first_air_date || ''
                ).getFullYear() || 'N/A'}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-yellow-500">★</Text>
                <Text className="text-muted-foreground ml-1">
                  {mediaDetails.vote_average.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row flex-wrap mt-2">
                {mediaDetails.genres.map((genre) => (
                  <View
                    key={genre.id}
                    className="bg-card px-2 py-1 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-xs text-muted-foreground">
                      {genre.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Text className="text-foreground mt-4">{mediaDetails.overview}</Text>

          <View className="mt-8">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Select Watchlist
            </Text>
            {watchlists.map((watchlist) => (
              <TouchableOpacity
                key={watchlist.id}
                className={`p-4 rounded-lg border mb-2 ${selectedWatchlist === watchlist.id
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border'
                  }`}
                onPress={() => setSelectedWatchlist(watchlist.id)}
              >
                <Text
                  className={
                    selectedWatchlist === watchlist.id
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }
                >
                  {watchlist.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className={`mt-6 p-4 rounded-lg ${selectedWatchlist
                ? 'bg-primary'
                : 'bg-muted cursor-not-allowed'
              }`}
            onPress={() => {
              if (selectedWatchlist) {
                addToWatchlist.mutate(selectedWatchlist);
              }
            }}
            disabled={!selectedWatchlist || addToWatchlist.isPending}
          >
            {addToWatchlist.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`text-center font-semibold ${selectedWatchlist
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                  }`}
              >
                Add to Watchlist
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
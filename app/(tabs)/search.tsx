import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import debounce from 'lodash/debounce';
import { Link } from 'expo-router';

const TMDB_API_KEY = Constants.expoConfig?.extra?.tmdbApiKey as string;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  vote_average: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          searchQuery
        )}&include_adult=false`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await response.json();
      return data.results.filter(
        (result: any) => result.media_type === 'movie' || result.media_type === 'tv'
      ) as SearchResult[];
    },
    enabled: searchQuery.length > 0,
  });

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 500),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="p-4">
        <TextInput
          className="bg-input border border-border rounded-lg p-4 text-foreground"
          placeholder="Search movies and TV shows..."
          placeholderTextColor="#666"
          onChangeText={debouncedSearch}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: '/add-to-watchlist',
                params: {
                  id: item.id,
                  mediaType: item.media_type,
                },
              }}
              asChild
            >
              <TouchableOpacity className="flex-row p-4 border-b border-border">
                <Image
                  source={{
                    uri: item.poster_path
                      ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
                      : 'https://via.placeholder.com/100x150',
                  }}
                  className="w-20 h-30 rounded-lg"
                />
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold text-foreground">
                    {item.title || item.name}
                  </Text>
                  <Text className="text-muted-foreground">
                    {new Date(
                      item.release_date || item.first_air_date || ''
                    ).getFullYear() || 'N/A'}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text className="text-yellow-500">★</Text>
                    <Text className="text-muted-foreground ml-1">
                      {item.vote_average.toFixed(1)}
                    </Text>
                    <Text className="text-muted-foreground ml-4 uppercase text-xs">
                      {item.media_type}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )}
          ListEmptyComponent={() =>
            searchQuery ? (
              <View className="flex-1 justify-center items-center p-4">
                <Text className="text-foreground text-lg text-center">
                  No results found
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
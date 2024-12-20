import { Stack } from 'expo-router';

export default function WatchlistLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          presentation: 'card',
          title: 'Watchlist'
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Edit Watchlist'
        }}
      />
      <Stack.Screen
        name="create-watchlist"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Create Watchlist'
        }}
      />
      <Stack.Screen
        name="add-to-watchlist"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Add to Watchlist'
        }}
      />
    </Stack>
  );
}
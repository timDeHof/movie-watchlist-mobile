import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '~/context/auth-context';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUp(email, password);
      router.replace('/sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-4">
          <View className="space-y-4">
            <Text className="text-4xl font-bold text-foreground mb-8">
              Create Account
            </Text>

            {error && (
              <Text className="text-red-500 mb-4">{error}</Text>
            )}

            <View>
              <Text className="text-foreground mb-2">Email</Text>
              <TextInput
                className="bg-input border border-border rounded-lg p-4 text-foreground"
                placeholder="Enter your email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-foreground my-2">Password</Text>
              <TextInput
                className="bg-input border border-border rounded-lg p-4 text-foreground"
                placeholder="Enter your password"
                placeholderTextColor="#666"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View>
              <Text className="text-foreground my-2">Confirm Password</Text>
              <TextInput
                className="bg-input border border-border rounded-lg p-4 text-foreground"
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              className="bg-primary p-4 rounded-lg items-center mt-4"
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-semibold">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center space-x-1 mt-4">
              <Text className="text-foreground">Already have an account?</Text>
              <Link href="/sign-in" className="text-primary font-semibold pl-1">
                Sign In
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
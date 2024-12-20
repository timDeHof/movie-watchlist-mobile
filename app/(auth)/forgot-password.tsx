import { Link } from 'expo-router';
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(email);
      setSuccess(true);
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
              Reset Password
            </Text>

            {error && (
              <Text className="text-red-500 mb-4">{error}</Text>
            )}

            {success ? (
              <View className="space-y-4">
                <Text className="text-green-500">
                  Password reset email sent! Check your inbox for further instructions.
                </Text>
                <Link href="/sign-in" className="text-primary font-semibold text-center">
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <>
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

                <TouchableOpacity
                  className="bg-primary p-4 rounded-lg items-center"
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-primary-foreground font-semibold">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>

                <Link
                  href="/sign-in"
                  className="text-primary font-semibold text-center mt-4"
                >
                  Back to Sign In
                </Link>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
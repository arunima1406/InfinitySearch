import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles, spacing, typography } from '../utils/styles';

interface SignInScreenProps {
  onSignInComplete: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onSignInComplete }) => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  // Email/password sign-in
const handleSignIn = async () => {
  if (!isLoaded) return;

  try {
    const signInAttempt = await signIn.create({
      identifier: emailAddress,
      password,
    });

    console.log('SignInAttempt:', signInAttempt);

    if (signInAttempt.status === 'complete') {
      console.log('Sign-in complete! Setting active session...');
      await setActive({ session: signInAttempt.createdSessionId });
      onSignInComplete?.();
    } else {
      console.log('Sign-in not complete:', signInAttempt.status);
      console.log('Next steps required:', signInAttempt);
      Alert.alert(
        'Incomplete Sign-in',
        `Status: ${signInAttempt.status}. Check console for details.`
      );
    }
  } catch (err: any) {
    console.error('Sign-in error:', err);
    Alert.alert('Sign-in failed', err.errors?.[0]?.longMessage || 'Please check your credentials.');
  }
};

const handleGoogleSignIn = async () => {
  if (!startOAuthFlow) {
    console.log('Google OAuth not available');
    Alert.alert('Error', 'Google sign-in is not available.');
    return;
  }

  try {
    const result = await startOAuthFlow();
    console.log('Google OAuth result:', result);

    if (result.createdSessionId) {
      console.log('Google sign-in complete, setting active session...');
      await setActive?.({ session: result.createdSessionId });
       onSignInComplete?.();
    } else {
      console.log('Google OAuth did not create a session:', result);
      Alert.alert('Google sign-in incomplete', 'Check console for details.');
    }
  } catch (err) {
    console.error('Google sign-in error:', err);
    Alert.alert('Google sign-in failed', 'Please try again.');
  }
};


  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Semantic Search</Text>
        <Text style={styles.subtitle}>
          Sign in with your email or Google to access your documents.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          value={emailAddress}
          onChangeText={setEmailAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn}>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => Alert.alert('Sign-up', 'Sign-up flow not implemented yet.')}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  signUpText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SignInScreen;

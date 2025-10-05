import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../utils/styles';

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

    //console.log('SignInAttempt:', signInAttempt);

    if (signInAttempt.status === 'complete') {
      //console.log('Sign-in complete! Setting active session...');
      await setActive({ session: signInAttempt.createdSessionId });
      onSignInComplete?.();
    } else {
     // console.log('Sign-in not complete:', signInAttempt.status);
      //console.log('Next steps required:', signInAttempt);
      Alert.alert(
        'Incomplete Sign-in',
        `Status: ${signInAttempt.status}. Check console for details.`
      );
    }
  } catch (err: any) {
   // console.error('Sign-in error:', err);
    Alert.alert('Sign-in failed', err.errors?.[0]?.longMessage || 'Please check your credentials.');
  }
};

const handleGoogleSignIn = async () => {
  if (!startOAuthFlow) {
    //console.log('Google OAuth not available');
    Alert.alert('Error', 'Google sign-in is not available.');
    return;
  }

  try {
    const result = await startOAuthFlow();
    //console.log('Google OAuth result:', result);

    if (result.createdSessionId) {
      //console.log('Google sign-in complete, setting active session...');
      await setActive?.({ session: result.createdSessionId });
       onSignInComplete?.();
    } else {
      //console.log('Google OAuth did not create a session:', result);
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
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Semantic Search</Text>
        <Text style={styles.subtitle}>
          Sign in with your email or Google to access your documents.
        </Text>
        </View>

      <View style={styles.content}>
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIcon}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8B8B8B"
          autoCapitalize="none"
          keyboardType="email-address"
          value={emailAddress}
          onChangeText={setEmailAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8B8B8B"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign in</Text>
        </TouchableOpacity>
        </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => Alert.alert('Sign-up', 'Sign-up flow')}>
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
    backgroundColor: '#FFFFFF'
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign:'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    lineHeight: 22,
    textAlign:'center'
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 48,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9B9B9B',
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  input: {
   backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  signInButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 32,
    paddingHorizontal: 28,
  },
  footerText: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  signUpText: {
    fontSize: 15,
    color: '#7C3AED',
    fontWeight: '600',
  },
});

export default SignInScreen;

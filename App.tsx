import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import FilePreviewScreen from './src/screens/FilePreviewScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import SearchScreen from './src/screens/SearchScreen';
import SignInScreen from './src/screens/SignInScreen';
import { clerkConfig, isClerkConfigured } from './src/utils/authConfig';
import { colors } from './src/utils/styles';
import { RootStackParamList } from './src/utils/type';

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Loading" component={LoadingScreen} options={{ title: 'Files' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Semantic Search' }} />
      <Stack.Screen name="FilePreview" component={FilePreviewScreen} options={{ title: 'File Preview' }} />
    </Stack.Navigator>
  );
}

function AppWithAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  const [authComplete, setAuthComplete] = useState(false);

  // Show loading indicator while Clerk SDK is initializing
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  // Show SignInScreen if user is not signed in or sign-in is not yet complete
  if (!isSignedIn || !authComplete) {
    return <SignInScreen onSignInComplete={() => setAuthComplete(true)} />;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  if (!isClerkConfigured()) {
    return (
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
  }

  return (
    <ClerkProvider {...clerkConfig}>
      <AppWithAuth />
    </ClerkProvider>
  );
}

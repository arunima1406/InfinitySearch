import { useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import BottomNavBar from './src/components/BottomNavBar';
import FilePreviewScreen from './src/screens/FilePreviewScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import SearchScreen from './src/screens/SearchScreen';
import { colors } from './src/utils/styles';

export type RootStackParamList = {
  Loading: undefined;
  Search: undefined;
  FilePreview: {
    fileId: string;
    fileName: string;
    fileType: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <>
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
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ title:'Files' }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Semantic Search' }}
        />
        <Stack.Screen
          name="FilePreview"
          component={FilePreviewScreen}
          options={{ title: 'File Preview' }}
        />
      </Stack.Navigator>
    </>
  );
}

function AppWithBottomNav() {
  const navigationState = useNavigationState(state => state);
  const currentRoute = navigationState?.routes[navigationState.index]?.name || 'Loading';

  return (
      <View style={{ flex: 1 }}>
        <AppNavigator />
        {currentRoute !== 'FilePreview' && (
          <BottomNavBar
            currentRoute={currentRoute}
            onNavigate={(route) => {
              // Navigation logic handled by each screen
            }}
          />
        )}
      </View>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <AppWithBottomNav />
    </>
  );
}
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import WorkspaceOverviewScreen from './src/screens/WorkspaceOverviewScreen';
import WorkspaceScreen from './src/screens/WorkspaceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import ShiftSwapScreen from './src/screens/ShiftSwapScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showShiftSwap, setShowShiftSwap] = useState(false);

  const handleWorkspaceUpdate = (updatedWorkspace) => {
    setWorkspaces(workspaces.map(w =>
      w.id === updatedWorkspace.id ? updatedWorkspace : w
    ));
    setSelectedWorkspace(updatedWorkspace);
  };

  const handleLogout = () => {
    setUser(null);
    setShowSettings(false);
    setShowSubscription(false);
    setShowNotificationSettings(false);
    setShowShiftSwap(false);
    setSelectedWorkspace(null);
    setCurrentScreen('login');
  };

  const renderScreen = () => {
    if (!user) {
      return currentScreen === 'login' ? (
        <LoginScreen
          onLogin={setUser}
          onNavigateToSignup={() => setCurrentScreen('signup')}
        />
      ) : (
        <SignupScreen
          onSignup={setUser}
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      );
    }

    if (showSubscription) {
      return (
        <SubscriptionScreen
          onBack={() => setShowSubscription(false)}
          workspaces={workspaces}
        />
      );
    }

    if (showShiftSwap) {
      return (
        <ShiftSwapScreen
          onBack={() => setShowShiftSwap(false)}
          workspace={selectedWorkspace}
        />
      );
    }

    if (showNotificationSettings) {
      return (
        <NotificationSettingsScreen
          onBack={() => {
            setShowNotificationSettings(false);
            setShowSettings(true);
          }}
        />
      );
    }

    if (showSettings) {
      return (
        <SettingsScreen
          onBack={() => setShowSettings(false)}
          onLogout={handleLogout}
          onNavigateToSubscription={() => {
            setShowSettings(false);
            setShowSubscription(true);
          }}
          onNavigateToNotifications={() => {
            setShowSettings(false);
            setShowNotificationSettings(true);
          }}
        />
      );
    }

    if (!selectedWorkspace) {
      return (
        <WorkspaceOverviewScreen
          workspaces={workspaces}
          setWorkspaces={setWorkspaces}
          onSelectWorkspace={setSelectedWorkspace}
          onNavigateToSettings={() => setShowSettings(true)}
        />
      );
    }

    return (
      <WorkspaceScreen
        workspace={selectedWorkspace}
        onBack={() => setSelectedWorkspace(null)}
        onWorkspaceUpdate={handleWorkspaceUpdate}
        onNavigateToShiftSwap={() => setShowShiftSwap(true)}
      />
    );
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <View style={styles.container}>
          {renderScreen()}
        </View>
      </ThemeProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
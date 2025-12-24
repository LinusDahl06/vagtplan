import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Image, Linking } from 'react-native';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDocs, query, where, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function SettingsScreen({ onBack, onLogout, onNavigateToSubscription }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user data from Firestore on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name || auth.currentUser?.displayName || '');
          setProfilePicture(userData.photoURL || null);
        } else {
          setName(auth.currentUser?.displayName || '');
          setProfilePicture(auth.currentUser?.photoURL || null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setName(auth.currentUser?.displayName || '');
        setProfilePicture(auth.currentUser?.photoURL || null);
      }
    };

    loadUserData();
  }, []);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(t('common.error'), t('settings.errors.permissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        // Resize image to 200x200 for faster upload and loading
        const manipulatedImage = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 200, height: 200 } }],
          { compress: 0.5, format: SaveFormat.JPEG }
        );
        setProfilePicture(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('settings.errors.pickImageFailed'));
    }
  };

  const handleRemoveProfilePicture = () => {
    Alert.alert(
      t('settings.removePhotoConfirm.title'),
      t('settings.removePhotoConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => setProfilePicture(null)
        }
      ]
    );
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('settings.errors.enterName'));
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser.uid;

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: profilePicture,
      });

      // Update Firestore users collection
      await updateDoc(doc(db, 'users', userId), {
        name: name,
        photoURL: profilePicture || null,
      });

      // Update all workspaces where this user is an employee
      const workspacesQuery = query(collection(db, 'workspaces'));
      const workspacesSnapshot = await getDocs(workspacesQuery);

      const updatePromises = [];

      workspacesSnapshot.forEach((workspaceDoc) => {
        const workspaceData = workspaceDoc.data();
        const employees = workspaceData.employees || [];

        // Check if current user is in this workspace's employees
        const employeeIndex = employees.findIndex(emp => emp.userId === userId);

        if (employeeIndex !== -1) {
          // Update the employee's name and photoURL
          employees[employeeIndex] = {
            ...employees[employeeIndex],
            name: name,
            photoURL: profilePicture || null,
          };

          // Update the workspace document
          updatePromises.push(
            updateDoc(doc(db, 'workspaces', workspaceDoc.id), {
              employees: employees
            })
          );
        }

        // Also update schedule entries with this user's name
        if (workspaceData.schedule) {
          const updatedSchedule = workspaceData.schedule.map(shift => {
            if (shift.employeeId === userId) {
              return { ...shift, employeeName: name };
            }
            return shift;
          });

          updatePromises.push(
            updateDoc(doc(db, 'workspaces', workspaceDoc.id), {
              schedule: updatedSchedule
            })
          );
        }
      });

      await Promise.all(updatePromises);

    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), t('settings.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutConfirm.title'),
      t('settings.logoutConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.account.logout'),
          style: 'destructive',
          onPress: onLogout
        }
      ]
    );
  };

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).safeAreaSpacer} />
        <View style={styles(theme).headerContent}>
          <TouchableOpacity onPress={onBack} style={styles(theme).backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>{t('settings.title')}</Text>
          <View style={styles(theme).placeholder} />
        </View>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('settings.profile.title')}</Text>

          {/* Profile Picture */}
          <View style={styles(theme).profilePictureContainer}>
            <View style={styles(theme).profilePictureWrapper}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles(theme).profilePicture} />
              ) : (
                <View style={styles(theme).profilePicturePlaceholder}>
                  <Text style={styles(theme).profilePicturePlaceholderText}>
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles(theme).editProfilePictureButton}
                onPress={handlePickImage}
              >
                <Ionicons name="camera" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles(theme).profilePictureActions}>
              <Text style={styles(theme).profilePictureHint}>{t('settings.profile.tapCameraHint')}</Text>
              {profilePicture && (
                <TouchableOpacity onPress={handleRemoveProfilePicture}>
                  <Text style={styles(theme).removePhotoText}>{t('settings.profile.removePhoto')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Name Input */}
          <View style={styles(theme).inputGroup}>
            <Text style={styles(theme).inputLabel}>{t('settings.profile.name')}</Text>
            <TextInput
              style={styles(theme).input}
              placeholder={t('settings.profile.namePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles(theme).inputHint}>{t('settings.profile.nameHint')}</Text>
          </View>

          {/* Email (Read-only) */}
          <View style={styles(theme).inputGroup}>
            <Text style={styles(theme).inputLabel}>{t('settings.profile.email')}</Text>
            <View style={styles(theme).inputReadonly}>
              <Text style={styles(theme).inputReadonlyText}>{auth.currentUser?.email}</Text>
            </View>
            <Text style={styles(theme).inputHint}>{t('settings.profile.emailHint')}</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles(theme).saveButton, loading && styles(theme).buttonDisabled]}
            onPress={handleSaveChanges}
            disabled={loading}
          >
            <Text style={styles(theme).saveButtonText}>
              {loading ? t('settings.profile.saving') : t('settings.profile.saveChanges')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('settings.appearance.title')}</Text>

          <TouchableOpacity
            style={styles(theme).settingRow}
            onPress={toggleTheme}
          >
            <View style={styles(theme).settingLeft}>
              <View style={styles(theme).settingIconContainer}>
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View style={styles(theme).settingTextContainer}>
                <Text style={styles(theme).settingTitle}>{t('settings.appearance.theme')}</Text>
                <Text style={styles(theme).settingDescription}>
                  {isDarkMode ? t('settings.appearance.darkMode') : t('settings.appearance.lightMode')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('settings.language.title')}</Text>

          <TouchableOpacity
            style={styles(theme).settingRow}
            onPress={() => changeLanguage(currentLanguage === 'en' ? 'da' : 'en')}
          >
            <View style={styles(theme).settingLeft}>
              <View style={styles(theme).settingIconContainer}>
                <Ionicons
                  name="language"
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View style={styles(theme).settingTextContainer}>
                <Text style={styles(theme).settingTitle}>{t('settings.language.selectLanguage')}</Text>
                <Text style={styles(theme).settingDescription}>
                  {currentLanguage === 'en' ? t('settings.language.english') : t('settings.language.danish')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Subscription Section */}
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('settings.subscription')}</Text>

          <TouchableOpacity
            style={styles(theme).settingRow}
            onPress={onNavigateToSubscription}
          >
            <View style={styles(theme).settingLeft}>
              <Ionicons name="card-outline" size={24} color={theme.primary} style={styles(theme).settingIcon} />
              <Text style={styles(theme).settingTitle}>{t('subscriptions.manageSubscription')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>Legal</Text>

          <TouchableOpacity
            style={styles(theme).settingRow}
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'Our Privacy Policy explains how we collect, use, and protect your personal data.\n\nKey points:\n• We don\'t sell your data\n• Data is encrypted and stored securely\n• You can delete your account anytime\n• GDPR & CCPA compliant\n\nFor the full privacy policy, visit:\nhttps://linusdahl06.github.io/vagtplan/privacy.html',
                [
                  { text: 'OK', style: 'default' },
                  { text: 'Open Link', onPress: () => Linking.openURL('https://linusdahl06.github.io/vagtplan/privacy.html') }
                ]
              );
            }}
          >
            <View style={styles(theme).settingLeft}>
              <View style={styles(theme).settingIconContainer}>
                <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              </View>
              <View style={styles(theme).settingTextContainer}>
                <Text style={styles(theme).settingTitle}>Privacy Policy</Text>
                <Text style={styles(theme).settingDescription}>How we handle your data</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(theme).settingRow}
            onPress={() => {
              Alert.alert(
                'Terms of Service',
                'By using ScheduHub, you agree to our Terms of Service.\n\nKey points:\n• Must be 13+ years old to use\n• You own your content\n• Use only for lawful purposes\n• We can terminate accounts that violate terms\n\nFor the full terms, visit:\nhttps://linusdahl06.github.io/vagtplan/terms.html',
                [
                  { text: 'OK', style: 'default' },
                  { text: 'Open Link', onPress: () => Linking.openURL('https://linusdahl06.github.io/vagtplan/terms.html') }
                ]
              );
            }}
          >
            <View style={styles(theme).settingLeft}>
              <View style={styles(theme).settingIconContainer}>
                <Ionicons name="document-text" size={20} color={theme.primary} />
              </View>
              <View style={styles(theme).settingTextContainer}>
                <Text style={styles(theme).settingTitle}>Terms of Service</Text>
                <Text style={styles(theme).settingDescription}>Terms and conditions</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('settings.account.title')}</Text>

          <TouchableOpacity
            style={styles(theme).settingRow}
            onPress={handleLogout}
          >
            <View style={styles(theme).settingLeft}>
              <View style={[styles(theme).settingIconContainer, styles(theme).logoutIconContainer]}>
                <Ionicons name="log-out-outline" size={20} color={theme.error} />
              </View>
              <View style={styles(theme).settingTextContainer}>
                <Text style={[styles(theme).settingTitle, styles(theme).logoutText]}>{t('settings.account.logout')}</Text>
                <Text style={styles(theme).settingDescription}>{t('settings.account.logoutDescription')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles(theme).appInfo}>
          <Text style={styles(theme).appInfoText}>{t('settings.appInfo')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.surface,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  safeAreaSpacer: {
    height: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePictureWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface,
    borderWidth: 3,
    borderColor: theme.border,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.primary,
    borderWidth: 3,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    color: '#000',
    fontSize: 48,
    fontWeight: 'bold',
  },
  editProfilePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.background,
  },
  profilePictureActions: {
    alignItems: 'center',
    gap: 8,
  },
  profilePictureHint: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  removePhotoText: {
    fontSize: 13,
    color: theme.error,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    color: theme.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputReadonly: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputReadonlyText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIconContainer: {
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e1a1a' : '#ffe0e0',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  logoutText: {
    color: theme.error,
  },
  appInfo: {
    padding: 20,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});

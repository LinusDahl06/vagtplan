import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useGoogleAuth, handleGoogleSignIn } from '../utils/googleAuth';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getDefaultSubscriptionTier } from '../utils/subscriptions';

export default function SignupScreen({ onSignup, onNavigateToLogin }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (response) {
      handleGoogleSignIn(response, onSignup);
    }
  }, [response]);

  // Check if username is unique
  const checkUsernameUnique = async (usernameToCheck) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', usernameToCheck.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Animate to next step
  const animateToStep = (nextStep) => {
    Animated.timing(slideAnim, {
      toValue: nextStep,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentStep(nextStep);
  };

  // Handle continue for each step
  const handleContinue = async () => {
    if (loading) return;

    switch (currentStep) {
      case 0: // Username step
        if (!username.trim()) {
          Alert.alert(t('common.error'), t('signup.errors.enterUsername'));
          return;
        }
        if (username.length < 3) {
          Alert.alert(t('common.error'), t('signup.errors.usernameMinLength'));
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          Alert.alert(t('common.error'), t('signup.errors.usernameInvalidChars'));
          return;
        }

        setLoading(true);
        const isUnique = await checkUsernameUnique(username);
        setLoading(false);

        if (!isUnique) {
          setUsernameError(t('signup.errors.usernameTaken'));
          Alert.alert(t('common.error'), t('signup.errors.usernameTaken'));
          return;
        }
        setUsernameError('');
        animateToStep(1);
        break;

      case 1: // Name step
        if (!name.trim()) {
          Alert.alert(t('common.error'), t('signup.errors.enterName'));
          return;
        }
        animateToStep(2);
        break;

      case 2: // Email step
        if (!email.trim()) {
          Alert.alert(t('common.error'), t('signup.errors.enterEmail'));
          return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          Alert.alert(t('common.error'), t('signup.errors.invalidEmail'));
          return;
        }
        animateToStep(3);
        break;

      case 3: // Password step
        if (!password) {
          Alert.alert(t('common.error'), t('signup.errors.enterPassword'));
          return;
        }
        if (password.length < 6) {
          Alert.alert(t('common.error'), t('signup.errors.passwordMinLength'));
          return;
        }
        animateToStep(4);
        break;

      case 4: // Profile picture step (optional)
        await handleSignup();
        break;
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    } else {
      onNavigateToLogin();
    }
  };

  // Pick profile image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(t('signup.permissionNeeded'), t('signup.permissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      // Resize image to 200x200 for faster upload and loading
      // This size is optimal for profile pictures (displayed at 40-120px typically)
      const manipulatedImage = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 200, height: 200 } }],
        { compress: 0.5, format: SaveFormat.JPEG }
      );
      setProfileImage(manipulatedImage.uri);
    }
  };

  // Upload profile image to Firebase Storage
  const uploadProfileImage = async (userId) => {
    if (!profileImage) return null;

    try {
      const response = await fetch(profileImage);
      const blob = await response.blob();
      const imageRef = ref(storage, `profileImages/${userId}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        t('signup.imageUploadFailed'),
        t('signup.imageUploadMessage'),
        [{ text: t('common.confirm') }]
      );
      return null;
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Upload profile image if exists
      const photoURL = await uploadProfileImage(user.uid);

      await updateProfile(user, {
        displayName: name,
        photoURL: photoURL || undefined
      });

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        username: username.toLowerCase(),
        email: email,
        photoURL: photoURL || null,
        subscriptionTier: getDefaultSubscriptionTier(),
        createdAt: new Date().toISOString()
      });

      onSignup({
        id: user.uid,
        email: user.email,
        name: name,
        username: username,
        photoURL: photoURL
      });

      Alert.alert(t('common.success'), t('signup.accountCreated'));
    } catch (error) {
      let errorMessage = t('signup.errors.createFailed');
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('signup.errors.emailInUse');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('signup.errors.invalidEmail');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('signup.errors.weakPassword');
      }
      Alert.alert(t('signup.signupError'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (currentStep === 4) {
      await handleSignup();
    }
  };

  // Step configurations
  const steps = [
    {
      title: t('signup.steps.username.title'),
      subtitle: t('signup.steps.username.subtitle'),
      icon: 'at-outline',
      placeholder: t('signup.steps.username.placeholder'),
      value: username,
      onChange: setUsername,
      autoCapitalize: 'none',
      keyboardType: 'default',
    },
    {
      title: t('signup.steps.name.title'),
      subtitle: t('signup.steps.name.subtitle'),
      icon: 'person-outline',
      placeholder: t('signup.steps.name.placeholder'),
      value: name,
      onChange: setName,
      autoCapitalize: 'words',
      keyboardType: 'default',
    },
    {
      title: t('signup.steps.email.title'),
      subtitle: t('signup.steps.email.subtitle'),
      icon: 'mail-outline',
      placeholder: t('signup.steps.email.placeholder'),
      value: email,
      onChange: setEmail,
      autoCapitalize: 'none',
      keyboardType: 'email-address',
    },
    {
      title: t('signup.steps.password.title'),
      subtitle: t('signup.steps.password.subtitle'),
      icon: 'lock-closed-outline',
      placeholder: t('signup.steps.password.placeholder'),
      value: password,
      onChange: setPassword,
      autoCapitalize: 'none',
      keyboardType: 'default',
      secureTextEntry: true,
    },
    {
      title: t('signup.steps.profilePicture.title'),
      subtitle: t('signup.steps.profilePicture.subtitle'),
      icon: 'camera-outline',
      isProfilePicture: true,
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <KeyboardAvoidingView
      style={styles(theme).container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles(theme).scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles(theme).headerSection}>
          <TouchableOpacity
            style={styles(theme).backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles(theme).progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles(theme).progressDot,
                  index <= currentStep && styles(theme).progressDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles(theme).logoContainer}>
            <Ionicons name={currentStepData.icon} size={48} color={theme.primary} />
          </View>
          <Text style={styles(theme).title}>{currentStepData.title}</Text>
          <Text style={styles(theme).subtitle}>{currentStepData.subtitle}</Text>
        </View>

        {/* Form Section */}
        <View style={styles(theme).formSection}>
          {/* Current Step Content */}
          <Animated.View
            style={{
              opacity: slideAnim.interpolate({
                inputRange: [currentStep - 0.5, currentStep, currentStep + 0.5],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              }),
            }}
          >
            {currentStepData.isProfilePicture ? (
              // Profile Picture Step
              <View style={styles(theme).profilePictureContainer}>
                <TouchableOpacity
                  style={styles(theme).imagePickerButton}
                  onPress={pickImage}
                  disabled={loading}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles(theme).profileImage}
                    />
                  ) : (
                    <View style={styles(theme).imagePlaceholder}>
                      <Ionicons name="camera" size={48} color={theme.textSecondary} />
                      <Text style={styles(theme).imagePlaceholderText}>{t('signup.tapToAddPhoto')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Input Steps
              <View style={styles(theme).inputContainer}>
                <Ionicons
                  name={currentStepData.icon}
                  size={20}
                  color={theme.textSecondary}
                  style={styles(theme).inputIcon}
                />
                <TextInput
                  style={styles(theme).input}
                  placeholder={currentStepData.placeholder}
                  placeholderTextColor={theme.textSecondary}
                  value={currentStepData.value}
                  onChangeText={currentStepData.onChange}
                  autoCapitalize={currentStepData.autoCapitalize}
                  keyboardType={currentStepData.keyboardType}
                  secureTextEntry={currentStepData.secureTextEntry && !showPassword}
                  editable={!loading}
                  autoFocus={true}
                />
                {currentStepData.secureTextEntry && (
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles(theme).eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles(theme).primaryButton, loading && styles(theme).buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles(theme).primaryButtonText}>
                {currentStep === 4 ? t('signup.creatingAccount') : t('signup.checking')}
              </Text>
            ) : (
              <>
                <Text style={styles(theme).primaryButtonText}>
                  {currentStep === 4 ? t('signup.createAccount') : t('signup.continue')}
                </Text>
                <Ionicons
                  name={currentStep === 4 ? 'checkmark-circle-outline' : 'arrow-forward'}
                  size={20}
                  color="#000"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Previous Button (show on all steps except first) */}
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles(theme).previousButton}
              onPress={() => animateToStep(currentStep - 1)}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
              <Text style={styles(theme).previousButtonText}>{t('signup.previous')}</Text>
            </TouchableOpacity>
          )}

          {/* Skip Button (only on profile picture step) */}
          {currentStep === 4 && (
            <TouchableOpacity
              style={styles(theme).skipButton}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles(theme).skipButtonText}>{t('signup.skipForNow')}</Text>
            </TouchableOpacity>
          )}

          {/* Sign In Link */}
          <View style={styles(theme).footer}>
            <Text style={styles(theme).footerText}>{t('signup.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={onNavigateToLogin} disabled={loading}>
              <Text style={styles(theme).linkText}>{t('signup.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    top: -36,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  progressDotActive: {
    backgroundColor: theme.primary,
    width: 24,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: theme.textSecondary,
    fontSize: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previousButton: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previousButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

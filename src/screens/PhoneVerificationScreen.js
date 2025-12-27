import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import CountryPicker from 'react-native-country-picker-modal';

export default function PhoneVerificationScreen({ user, onVerified, onBack }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const recaptchaVerifier = useRef(null);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('common.error'), t('phoneVerification.errors.enterPhone'));
      return;
    }

    // Validate phone number has at least some digits
    if (phoneNumber.trim().length < 6) {
      Alert.alert(t('common.error'), t('phoneVerification.errors.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      // Format phone number with country code
      const fullPhoneNumber = `+${callingCode}${phoneNumber.trim()}`;

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        fullPhoneNumber,
        recaptchaVerifier.current
      );

      setVerificationId(verificationId);
      setCodeSent(true);
      setResendCooldown(60); // 60 second cooldown
      Alert.alert(
        t('phoneVerification.codeSent'),
        t('phoneVerification.checkPhone')
      );
    } catch (error) {
      console.error('Error sending verification code:', error);
      let errorMessage = t('phoneVerification.errors.sendFailed');

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = t('phoneVerification.errors.invalidPhone');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('phoneVerification.errors.tooManyRequests');
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = t('phoneVerification.errors.quotaExceeded');
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t('common.error'), t('phoneVerification.errors.enterCode'));
      return;
    }

    if (verificationCode.trim().length !== 6) {
      Alert.alert(t('common.error'), t('phoneVerification.errors.invalidCode'));
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode.trim()
      );

      // Link phone number to existing email account
      await linkWithCredential(user, credential);

      // Update phone number in Firestore user document
      const fullPhoneNumber = `+${callingCode}${phoneNumber.trim()}`;
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: fullPhoneNumber
      });

      Alert.alert(
        t('common.success'),
        t('phoneVerification.verified'),
        [{ text: t('common.confirm'), onPress: onVerified }]
      );
    } catch (error) {
      console.error('Error verifying code:', error);
      let errorMessage = t('phoneVerification.errors.verificationFailed');

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = t('phoneVerification.errors.invalidCode');
      } else if (error.code === 'auth/credential-already-in-use') {
        errorMessage = t('phoneVerification.errors.phoneInUse');
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await sendVerificationCode();
  };

  return (
    <KeyboardAvoidingView
      style={styles(theme).container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={true}
      />

      <ScrollView
        contentContainerStyle={styles(theme).scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles(theme).headerSection}>
          <TouchableOpacity
            style={styles(theme).backButton}
            onPress={onBack}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles(theme).logoContainer}>
            <Ionicons name="phone-portrait-outline" size={48} color={theme.primary} />
          </View>
          <Text style={styles(theme).title}>{t('phoneVerification.title')}</Text>
          <Text style={styles(theme).subtitle}>
            {codeSent
              ? t('phoneVerification.subtitleCode', { phone: phoneNumber })
              : t('phoneVerification.subtitle')
            }
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles(theme).formSection}>
          {!codeSent ? (
            <>
              <Text style={styles(theme).instruction}>
                {t('phoneVerification.instruction')}
              </Text>

              {/* Phone Number Input with Country Picker */}
              <View style={styles(theme).phoneInputContainer}>
                <TouchableOpacity
                  style={styles(theme).countryPickerButton}
                  onPress={() => setShowCountryPicker(true)}
                  disabled={loading}
                >
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCountryNameButton={false}
                    withAlphaFilter
                    withCallingCode
                    onSelect={(country) => {
                      setCountryCode(country.cca2);
                      setCallingCode(country.callingCode[0]);
                    }}
                    visible={showCountryPicker}
                    onClose={() => setShowCountryPicker(false)}
                  />
                  <Text style={styles(theme).callingCodeText}>+{callingCode}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                <View style={styles(theme).phoneNumberInput}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={theme.textSecondary}
                    style={styles(theme).inputIcon}
                  />
                  <TextInput
                    style={styles(theme).input}
                    placeholder={t('phoneVerification.phonePlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!loading}
                    autoFocus={true}
                  />
                </View>
              </View>

              <Text style={styles(theme).helperText}>
                {t('phoneVerification.helperWithCode', { code: `+${callingCode}` })}
              </Text>

              {/* Send Code Button */}
              <TouchableOpacity
                style={[styles(theme).primaryButton, loading && styles(theme).buttonDisabled]}
                onPress={sendVerificationCode}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles(theme).primaryButtonText}>
                    {t('phoneVerification.sending')}
                  </Text>
                ) : (
                  <>
                    <Ionicons name="send-outline" size={20} color="#000" />
                    <Text style={styles(theme).primaryButtonText}>
                      {t('phoneVerification.sendCode')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles(theme).instruction}>
                {t('phoneVerification.codeInstruction')}
              </Text>

              {/* Verification Code Input */}
              <View style={styles(theme).inputContainer}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles(theme).inputIcon}
                />
                <TextInput
                  style={styles(theme).input}
                  placeholder={t('phoneVerification.codePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  autoFocus={true}
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles(theme).primaryButton, loading && styles(theme).buttonDisabled]}
                onPress={verifyCode}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles(theme).primaryButtonText}>
                    {t('phoneVerification.verifying')}
                  </Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
                    <Text style={styles(theme).primaryButtonText}>
                      {t('phoneVerification.verify')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Link */}
              <View style={styles(theme).footer}>
                <Text style={styles(theme).footerText}>
                  {t('phoneVerification.didntReceive')}{' '}
                </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={loading || resendCooldown > 0}
                >
                  <Text style={[
                    styles(theme).linkText,
                    (loading || resendCooldown > 0) && styles(theme).linkTextDisabled
                  ]}>
                    {resendCooldown > 0
                      ? t('phoneVerification.resendIn', { seconds: resendCooldown })
                      : t('phoneVerification.resend')
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Change Number Link */}
              <TouchableOpacity
                style={styles(theme).changeNumberButton}
                onPress={() => {
                  setCodeSent(false);
                  setVerificationCode('');
                  setVerificationId(null);
                }}
                disabled={loading}
              >
                <Text style={styles(theme).linkText}>
                  {t('phoneVerification.changeNumber')}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingHorizontal: 16,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  instruction: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 8,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  callingCodeText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '600',
  },
  phoneNumberInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
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
  linkTextDisabled: {
    opacity: 0.5,
  },
  changeNumberButton: {
    alignItems: 'center',
    marginTop: 16,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { User, Mail, Lock, Eye, EyeOff, Wallet } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { performGoogleSignIn } from '../../lib/googleAuth';
import { showGlassAlert } from '../../components/common/GlassAlert';
import { Card } from '../../components/common/Card';
import { GoogleIcon } from '../../components/common/GoogleIcon';

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) {
      showGlassAlert('Error', 'Please fill out all fields.', undefined, 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      showGlassAlert('Signup Failed', error.message, undefined, 'error');
    } else {
      showGlassAlert('Success', 'Check your email for the confirmation link!', undefined, 'success');
      onNavigateToLogin();
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const idToken = await performGoogleSignIn();
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          showGlassAlert('Google Signup Failed', error.message, undefined, 'error');
        } else {
          onSignupSuccess();
        }
      }
    } catch (error: any) {
      showGlassAlert('Google Signup Error', error.message || 'An error occurred during Google Signup', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Compact Hero Branding Header */}
            <View style={styles.header}>
              <View style={[styles.iconBadge, { backgroundColor: theme.primaryDim }]}>
                <Wallet size={28} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Start managing your expenses smartly.
              </Text>
            </View>

            {/* Glass Form Card */}
            <Card variant="glass" style={styles.formCard}>
              {/* Google Signup Button */}
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.secondary, borderColor: theme.borderSubtle },
                ]}
                onPress={handleGoogleSignup}
                disabled={loading}
              >
                <GoogleIcon size={20} />
                <Text style={[styles.socialButtonText, { color: theme.text }]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
                <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
              </View>

              {/* Signup Form */}
              <View style={styles.form}>
                {/* Full Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Full Name</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: theme.secondary, borderColor: theme.borderSubtle },
                    ]}
                  >
                    <User size={18} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Alex Johnson"
                      placeholderTextColor={theme.textDim}
                      value={fullName}
                      onChangeText={setFullName}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Email Address</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: theme.secondary, borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Mail size={18} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="alex@example.com"
                      placeholderTextColor={theme.textDim}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Password Input with Show/Hide Toggle */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: theme.secondary, borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Lock size={18} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.textDim}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={theme.primary} />
                      ) : (
                        <Eye size={18} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                onPress={handleEmailSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Card>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={onNavigateToLogin} disabled={loading}>
                <Text style={[styles.footerLink, { color: theme.primary }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  content: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    gap: 10,
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  submitButton: {
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});

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
import { Mail, Lock, Eye, EyeOff, Wallet } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { performGoogleSignIn } from '../../lib/googleAuth';
import { showGlassAlert } from '../../components/common/GlassAlert';
import { Card } from '../../components/common/Card';
import { GoogleIcon } from '../../components/common/GoogleIcon';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToSignup: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      showGlassAlert('Error', 'Please enter both email and password.', undefined, 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      showGlassAlert('Login Failed', error.message, undefined, 'error');
    } else {
      onLoginSuccess();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const idToken = await performGoogleSignIn();
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          showGlassAlert('Google Login Failed', error.message, undefined, 'error');
        } else {
          onLoginSuccess();
        }
      }
    } catch (error: any) {
      showGlassAlert('Google Login Error', error.message || 'An error occurred during Google Login', undefined, 'error');
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
            {/* Hero Branding Header */}
            <View style={styles.header}>
              <View style={[styles.iconBadge, { backgroundColor: theme.primaryDim }]}>
                <Wallet size={28} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Access your Pocket Vault financial dashboard.
              </Text>
            </View>

            {/* Glass Form Card */}
            <Card variant="glass" style={styles.formCard}>
              {/* Google Login Button */}
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.secondary, borderColor: theme.borderSubtle },
                ]}
                onPress={handleGoogleLogin}
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

              {/* Email / Password Form */}
              <View style={styles.form}>
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

              {/* Forgot Password Link */}
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity disabled={loading}>
                  <Text style={[styles.forgotPassword, { color: theme.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Card>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={onNavigateToSignup} disabled={loading}>
                <Text style={[styles.footerLink, { color: theme.primary }]}>Sign up</Text>
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '600',
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

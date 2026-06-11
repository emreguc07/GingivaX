// src/screens/auth/RegisterScreen.js
import React, { useState, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { authApi } from "../../services/api";
import { User, Mail, Lock, ChevronLeft } from "lucide-react-native";

const ScaleButton = ({ children, onPress, style, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Input focus states for active border styling
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    if (password.length < 6) {
      setError("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.register(name.trim(), email.trim(), password);
      
      if (response.message) {
        navigation.navigate("Verify", { email: email.trim(), message: response.message });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Kayıt işlemi başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0a1515", "#102626", "#070f0f"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Pressable onPress={Keyboard.dismiss} style={{ flex: 1, width: "100%", justifyContent: "center" }}>
              {/* Back Button */}
              <ScaleButton 
                style={styles.backButton}
                onPress={() => navigation.navigate("Welcome")}
              >
                <ChevronLeft size={24} color={COLORS.secondary} />
              </ScaleButton>

              <View style={styles.header}>
                <Text style={styles.title}>Kayıt Olun</Text>
                <Text style={styles.subtitle}>GingivaX ailesine hemen katılın</Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adınız Soyadınız</Text>
                  <Pressable 
                    style={[
                      styles.inputContainer, 
                      nameFocused && styles.inputContainerActive
                    ]}
                    onPress={() => nameInputRef.current?.focus()}
                  >
                    <User size={18} color={nameFocused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput 
                      ref={nameInputRef}
                      style={styles.input}
                      placeholder="Ad Soyad"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                    />
                  </Pressable>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta Adresi</Text>
                  <Pressable 
                    style={[
                      styles.inputContainer, 
                      emailFocused && styles.inputContainerActive
                    ]}
                    onPress={() => emailInputRef.current?.focus()}
                  >
                    <Mail size={18} color={emailFocused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput 
                      ref={emailInputRef}
                      style={styles.input}
                      placeholder="gingivax@gmail.com"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </Pressable>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <Pressable 
                    style={[
                      styles.inputContainer, 
                      passwordFocused && styles.inputContainerActive
                    ]}
                    onPress={() => passwordInputRef.current?.focus()}
                  >
                    <Lock size={18} color={passwordFocused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput 
                      ref={passwordInputRef}
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                  </Pressable>
                </View>

                <ScaleButton 
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#00ced1", "#008b8b"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
                    )}
                  </LinearGradient>
                </ScaleButton>

                <View style={styles.footerLinks}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("Login")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkText}>
                      Zaten bir hesabınız var mı? <Text style={styles.linkAccent}>Giriş Yapın</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 20,
    left: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    zIndex: 10,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: "500",
  },
  form: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 32,
    padding: SPACING.lg,
    width: "100%",
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.secondary,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "700",
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputContainerActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
    height: "100%",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  passwordInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
    height: "100%",
    fontFamily: Platform.OS === "ios" ? "System" : "monospace",
  },
  primaryButton: {
    borderRadius: 30,
    marginTop: SPACING.md,
    ...SHADOWS.neonGlow,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    width: "100%",
    paddingVertical: SPACING.md - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footerLinks: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  linkAccent: {
    color: COLORS.primaryDark,
    fontWeight: "700",
  },
});

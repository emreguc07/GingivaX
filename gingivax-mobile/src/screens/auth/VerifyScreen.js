// src/screens/auth/VerifyScreen.js
import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING } from "../../styles/theme";
import { authApi } from "../../services/api";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";

export default function VerifyScreen({ route, navigation }) {
  const { email, message: initialMessage } = route.params || {};
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(initialMessage || "E-postanıza gönderilen 6 haneli kodu girin.");
  const [countdown, setCountdown] = useState(60);
  const [inputFocused, setInputFocused] = useState(false);

  const codeInputRef = useRef(null);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Doğrulama kodu 6 haneli olmalıdır.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.verify(email, code);
      if (response.success) {
        Alert.alert("Başarılı", "E-postanız başarıyla doğrulandı! Artık giriş yapabilirsiniz.", [
          { text: "Tamam", onPress: () => navigation.navigate("Login", { email }) }
        ]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Doğrulama başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const response = await authApi.resendCode(email);
      if (response.success) {
        setInfoMessage("Yeni kod e-postanıza başarıyla gönderildi.");
        setCountdown(60);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Kod tekrar gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0a1515", "#102626", "#070f0f"]}
      style={styles.gradientContainer}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={COLORS.secondary} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <ShieldCheck size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Doğrulama</Text>
              <Text style={styles.subtitle}>{email}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.infoText}>{infoMessage}</Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable 
                style={[
                  styles.inputContainer,
                  inputFocused && styles.inputContainerActive
                ]}
                onPress={() => codeInputRef.current?.focus()}
              >
                <TextInput
                  ref={codeInputRef}
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                  autoFocus
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
              </Pressable>

              <TouchableOpacity 
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Kodu Doğrula</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Yeni kod için bekleyin: <Text style={styles.timerText}>{countdown} sn</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                    {resending ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.resendText}>Kodu Tekrar Gönder</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.bottomLink}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text style={styles.bottomLinkText}>Giriş Ekranına Dön</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    shadowColor: "rgba(0, 206, 209, 0.15)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
  card: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 32,
    padding: SPACING.lg,
    width: "100%",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: SPACING.md,
    lineHeight: 20,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    width: "100%",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
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
  codeInput: {
    color: COLORS.secondary,
    width: "100%",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 8,
    paddingLeft: 8,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md - 2,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resendContainer: {
    marginTop: SPACING.lg,
    height: 25,
    justifyContent: "center",
  },
  countdownText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  timerText: {
    color: COLORS.secondary,
    fontWeight: "700",
  },
  resendText: {
    color: COLORS.primaryDark,
    fontWeight: "700",
    fontSize: 14,
  },
  bottomLink: {
    marginTop: SPACING.xl,
  },
  bottomLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

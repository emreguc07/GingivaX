// src/screens/auth/WelcomeScreen.js
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Animated, TouchableWithoutFeedback } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { Sparkles, Calendar, MessageSquare, Bot } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  // Ambient parallax animations
  const ambientOrb1 = useRef(new Animated.Value(0)).current;
  const ambientOrb2 = useRef(new Animated.Value(0)).current;

  // Spring animations for buttons
  const scaleBtn1 = useRef(new Animated.Value(1)).current;
  const scaleBtn2 = useRef(new Animated.Value(1)).current;

  const handlePressIn1 = () => {
    Animated.spring(scaleBtn1, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut1 = () => {
    Animated.spring(scaleBtn1, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  const handlePressIn2 = () => {
    Animated.spring(scaleBtn2, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut2 = () => {
    Animated.spring(scaleBtn2, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ambientOrb1, {
            toValue: 25,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(ambientOrb1, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          })
        ]),
        Animated.sequence([
          Animated.timing(ambientOrb2, {
            toValue: -20,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(ambientOrb2, {
            toValue: 0,
            duration: 4500,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();
  }, []);

  const features = [
    {
      id: "1",
      icon: <Bot size={20} color={COLORS.primary} />,
      title: "Dr. Perio Yapay Zeka",
      desc: "Anında diş sağlığı analizi ve ön değerlendirme",
    },
    {
      id: "2",
      icon: <Calendar size={20} color={COLORS.primary} />,
      title: "Hızlı Online Randevu",
      desc: "Uzman hekimlerden saniyeler içinde randevu al",
    },
    {
      id: "3",
      icon: <MessageSquare size={20} color={COLORS.primary} />,
      title: "Hekimine Danış",
      desc: "Tedavini yürüten uzman hekimle doğrudan mesajlaş",
    }
  ];

  return (
    <LinearGradient
      colors={["#0a1515", "#102626", "#070f0f"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Parallax ambient glows */}
        <Animated.View style={[
          styles.decorOrb1,
          { transform: [{ translateY: ambientOrb1 }] }
        ]} />
        <Animated.View style={[
          styles.decorOrb2,
          { transform: [{ translateY: ambientOrb2 }] }
        ]} />

        <View style={styles.content}>
          
          {/* Brand Typographic Header */}
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Sparkles size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.logoText}>
              Gingiva<Text style={styles.logoAccent}>X</Text>
            </Text>
            <Text style={styles.tagline}>AĞIZ VE DİŞ SAĞLIĞI KLİNİĞİ</Text>
          </View>

          {/* Premium Features Checklist */}
          <View style={styles.featuresList}>
            <View style={styles.badgeContainer}>
              <Sparkles size={14} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
              <Text style={styles.badgeText}>YAPAY ZEKA DESTEKLİ SAĞLIK</Text>
            </View>
            
            {features.map(feat => (
              <View key={feat.id} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  {feat.icon}
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDesc}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Glowing CTA Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableWithoutFeedback
              onPressIn={handlePressIn1}
              onPressOut={handlePressOut1}
              onPress={() => navigation.navigate("Login")}
            >
              <Animated.View style={[styles.primaryBtnWrapper, { transform: [{ scale: scaleBtn1 }] }]}>
                <LinearGradient
                  colors={["#00ced1", "#008b8b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryGradientButton}
                >
                  <Text style={styles.primaryButtonText}>Giriş Yap</Text>
                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPressIn={handlePressIn2}
              onPressOut={handlePressOut2}
              onPress={() => navigation.navigate("Register")}
            >
              <Animated.View style={[styles.secondaryButton, { transform: [{ scale: scaleBtn2 }] }]}>
                <Text style={styles.secondaryButtonText}>Yeni Hesap Oluştur</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>

        </View>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "space-between",
    alignItems: "center",
  },
  decorOrb1: {
    position: "absolute",
    top: height * 0.1,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(0, 206, 209, 0.03)",
    zIndex: -1,
  },
  decorOrb2: {
    position: "absolute",
    bottom: height * 0.3,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 206, 209, 0.02)",
    zIndex: -1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 45,
    width: "100%",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(0, 206, 209, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm + 4,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  logoText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.55)",
    marginTop: 6,
    letterSpacing: 3,
    fontWeight: "800",
    textAlign: "center",
  },
  featuresList: {
    width: "100%",
    marginVertical: SPACING.md,
  },
  badgeContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 206, 209, 0.06)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
  },
  badgeText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.15)",
  },
  featureTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.secondary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    lineHeight: 16,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: SPACING.xl,
  },
  primaryBtnWrapper: {
    width: "100%",
    marginBottom: SPACING.sm + 2,
    ...SHADOWS.neonGlow,
  },
  primaryGradientButton: {
    paddingVertical: SPACING.md - 2,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingVertical: SPACING.md - 2,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0, 206, 209, 0.25)",
  },
  secondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

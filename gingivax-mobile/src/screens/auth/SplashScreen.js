// src/screens/auth/SplashScreen.js
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated, Dimensions, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING } from "../../styles/theme";
import { initApiSession } from "../../services/api";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  
  const loadingBarScale = useRef(new Animated.Value(0)).current;

  // Background ambient circles animations
  const circle1Translate = useRef(new Animated.Value(0)).current;
  const circle2Translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Background Ambient Parallax
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(circle1Translate, {
            toValue: 20,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Translate, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          })
        ]),
        Animated.sequence([
          Animated.timing(circle2Translate, {
            toValue: -15,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Translate, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();

    // 2. Entrance Animation
    Animated.sequence([
      // Stage 1: Fade and scale up logo, fade in glow
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 25,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        })
      ]),
      // Stage 2: Slide up tagline
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      // 3. Loop animations (breathing glow & floating logo)
      // Glow breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.25,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.85,
            duration: 2500,
            useNativeDriver: true,
          })
        ])
      ).start();

      // Logo floating bounce
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoTranslateY, {
            toValue: -8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: 8,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
    });

    // 4. Progress bar linear scale
    Animated.timing(loadingBarScale, {
      toValue: 1,
      duration: 2400,
      useNativeDriver: false,
    }).start();

    // 5. Session navigation check
    const checkSessionAndTransition = async () => {
      const startTime = Date.now();
      let destination = "Welcome";
      
      try {
        const activeUser = await initApiSession();
        if (activeUser) {
          destination = "Main";
        }
      } catch (err) {
        console.error("Failed to check user session on splash screen", err);
      }

      const elapsed = Date.now() - startTime;
      const minimumDelay = 4000; // Keep dark premium splash visible for 4 seconds
      const remainingTime = Math.max(0, minimumDelay - elapsed);

      setTimeout(() => {
        navigation.replace(destination);
      }, remainingTime);
    };

    checkSessionAndTransition();
  }, []);

  return (
    <LinearGradient
      colors={["#0a1515", "#102626", "#070f0f"]}
      style={styles.gradientContainer}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Parallax Ambient Orbs */}
        <Animated.View style={[
          styles.ambientOrb1,
          { transform: [{ translateY: circle1Translate }] }
        ]} />
        <Animated.View style={[
          styles.ambientOrb2,
          { transform: [{ translateY: circle2Translate }] }
        ]} />

        <View style={styles.content}>
          {/* Glowing Aura Behind Logo */}
          <Animated.View style={[
            styles.logoGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }]
            }
          ]} />

          {/* Logo container with float & scale animations */}
          <Animated.View style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY }
              ]
            }
          ]}>
            <Animated.Image 
              source={require("../../../assets/logo.png")} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Slide & Fade in Tagline */}
          <Animated.View style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }]
          }}>
            <Text style={styles.tagline}>AĞIZ VE DİŞ SAĞLIĞI KLİNİĞİ</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          {/* Glow Loading Track */}
          <View style={styles.progressBarBg}>
            <Animated.View style={[
              styles.progressBarActive,
              {
                width: loadingBarScale.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"]
                })
              }
            ]} />
          </View>
          <Text style={styles.footerText}>GINGIVAX PREMIUM EXPERIENCE</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  ambientOrb1: {
    position: "absolute",
    top: height * 0.15,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0, 206, 209, 0.04)",
    zIndex: -1,
  },
  ambientOrb2: {
    position: "absolute",
    bottom: height * 0.2,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(0, 206, 209, 0.03)",
    zIndex: -1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoGlow: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: "rgba(0, 206, 209, 0.12)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 8,
    zIndex: -1,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.72,
    // Add custom iOS shadow for logo depth
    shadowColor: "rgba(0, 206, 209, 0.35)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  logoImage: {
    width: "100%",
    height: 90,
  },
  tagline: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.65)",
    marginTop: 20,
    letterSpacing: 4.5,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0, 206, 209, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  footer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: SPACING.xxl,
  },
  progressBarBg: {
    height: 2,
    width: 160,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 1.5,
    overflow: "hidden",
    marginBottom: SPACING.md,
  },
  progressBarActive: {
    height: "100%",
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  footerText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.35)",
    fontWeight: "800",
    letterSpacing: 2,
  },
});

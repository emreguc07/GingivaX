// src/screens/main/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  Vibration,
  Animated,
  TouchableWithoutFeedback,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { 
  Calendar, 
  Bot, 
  MessageSquare, 
  Stethoscope, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  User, 
  Activity,
  Play,
  Pause,
  RotateCcw,
  X,
  Clock,
  Award,
  Check
} from "lucide-react-native";
import { getApiUrl, appointmentsApi } from "../../services/api";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width, height } = Dimensions.get("window");

const ScaleButton = ({ children, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
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
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("Hasta");
  const [userInitials, setUserInitials] = useState("H");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [userRole, setUserRole] = useState("USER");

  // Brushing Timer States
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [currentQuadrant, setCurrentQuadrant] = useState(1);
  const [timerFinished, setTimerFinished] = useState(false);

  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  const dentalTips = [
    "Dişlerinizi günde en az iki kez, en az iki dakika boyunca dairesel hareketlerle fırçalayın.",
    "Diş fırçanızın ulaşamadığı ara yüzeyleri temizlemek için her gün diş ipi kullanın.",
    "Dilinizi de fırçalayarak ağız kokusuna neden olan bakterileri uzaklaştırabilirsiniz.",
    "Sağlıklı diş etleri için kalsiyum yönünden zengin gıdalar tüketin.",
    "Diş fırçanızı en geç 3 ayda bir veya fırça kılları yıprandığında değiştirmelisiniz.",
    "Yılda en az iki kez düzenli diş hekimi kontrolüne giderek sorunları önleyin."
  ];

  const services = [
    { id: "1", title: "Cerrahi", desc: "Gömülü diş çekimi ve ameliyatlar." },
    { id: "2", title: "Ortodonti", desc: "Şeffaf plak ve tel tedavisi." },
    { id: "3", title: "Periodontoloji", desc: "Diş eti teşhis ve tedavisi." },
    { id: "4", title: "Endodonti", desc: "Ağrılı diş kanal tedavileri." },
    { id: "5", title: "Protetik Diş", desc: "Zirkonyum kuron ve implant." },
    { id: "6", title: "Pedodonti", desc: "Çocuk diş koruyucu tedavileri." }
  ];

  const parseAppDate = (dateStr) => {
    try {
      if (dateStr.includes(".")) {
        const parts = dateStr.split(".");
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return new Date(dateStr);
    } catch (e) {
      return new Date();
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Onaylandı":
        return { bg: "rgba(16, 185, 129, 0.1)", text: COLORS.approved || "#10b981" };
      case "İptal Edildi":
        return { bg: "rgba(239, 68, 68, 0.1)", text: COLORS.cancelled || "#ef4444" };
      case "Zaman Aşımı":
        return { bg: "rgba(107, 114, 128, 0.1)", text: COLORS.timeout || "#6b7280" };
      default: // Bekliyor
        return { bg: "rgba(245, 158, 11, 0.1)", text: COLORS.pending || "#f59e0b" };
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    let actionText = status === "Onaylandı" ? "onaylamak" : "iptal etmek";
    Alert.alert(
      "Randevu Güncelleme",
      `Bu randevuyu ${actionText} istediğinize emin misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: status === "Onaylandı" ? "Onayla" : "İptal Et",
          style: status === "Onaylandı" ? "default" : "destructive",
          onPress: async () => {
            try {
              const response = await appointmentsApi.updateAppointmentStatus(appointmentId, status);
              if (response.success) {
                // Update local list state
                setAppointments(appointments.map(app => 
                  app.id === appointmentId ? { ...app, status: status } : app
                ));
                Alert.alert("Başarılı", `Randevu başarıyla ${status.toLowerCase()}.`);
              }
            } catch (err) {
              Alert.alert("Hata", err.message || "Randevu güncellenemedi.");
            }
          }
        }
      ]
    );
  };

  const fetchHomeData = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserRole(user.role || "USER");
        setUserName(user.name?.split(" ")[0] || "Hasta");
        
        const nameParts = user.name?.split(" ") || [];
        if (nameParts.length >= 2) {
          setUserInitials((nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase());
        } else if (nameParts.length === 1) {
          setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
        }
      }

      const response = await appointmentsApi.getAppointments();
      if (response.success) {
        setAppointments(response.appointments || []);
      }
    } catch (e) {
      console.error("Home data fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * dentalTips.length));
  }, []);

  // Brushing Timer Logic
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            Vibration.vibrate([0, 500, 200, 500, 200, 800]);
            setTimeout(() => {
              setTimerFinished(true);
            }, 100);
            return 0;
          }
          
          const nextTime = prev - 1;
          
          let nextQuad = 1;
          if (nextTime <= 30) {
            nextQuad = 4;
          } else if (nextTime <= 60) {
            nextQuad = 3;
          } else if (nextTime <= 90) {
            nextQuad = 2;
          } else {
            nextQuad = 1;
          }
          
          if (Math.ceil(prev / 30) !== Math.ceil(nextTime / 30)) {
            Vibration.vibrate(500);
          }
          
          setCurrentQuadrant(nextQuad);
          return nextTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Pulse Animation Loop for Active Quadrant
  useEffect(() => {
    let animation;
    if (timerRunning) {
      pulseAnim.setValue(0.4);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(0.8);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [timerRunning]);

  const handleToggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(120);
    setCurrentQuadrant(1);
    setTimerFinished(false);
  };

  const handleCloseTimer = () => {
    setTimerRunning(false);
    pulseAnim.setValue(0.8);
    setTimeout(() => {
      setTimerVisible(false);
      setTimerFinished(false);
    }, 50);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const quadrants = {
    1: { name: "1. Çeyrek: Üst Sağ Dişler", desc: "Fırçanızı 45 derece eğimle tutarak üst sağ dişlerinizin dış ve iç yüzeylerini dairesel hareketlerle fırçalayın." },
    2: { name: "2. Çeyrek: Üst Sol Dişler", desc: "Şimdi üst sol dişlerinize geçin. Süpürme ve dairesel hareketlerle diş etinden dişe doğru fırçalamayı sürdürün." },
    3: { name: "3. Çeyrek: Alt Sol Dişler", desc: "Alt sol dişlerinizin dış, iç ve özellikle arka çiğneyici yüzeylerini fırçalayın." },
    4: { name: "4. Çeyrek: Alt Sağ Dişler", desc: "Son olarak alt sağ dişlerinizi fırçalayın. Süre sonunda dilinizi de arkadan öne doğru hafifçe süpürün." },
  };

  const MouthVisual = ({ activeQuadrant }) => {
    const getToothFill = (quad) => {
      return activeQuadrant === quad ? "rgba(0, 206, 209, 0.4)" : "rgba(255, 255, 255, 0.05)";
    };

    const getToothStroke = (quad) => {
      return activeQuadrant === quad ? COLORS.primary : "rgba(255, 255, 255, 0.15)";
    };

    // Tooth coordinates along the quadrants
    const teeth = {
      1: [ { cx: 46, cy: 12 }, { cx: 54, cy: 15 }, { cx: 62, cy: 20 }, { cx: 68, cy: 27 } ], // Upper Right
      2: [ { cx: 34, cy: 12 }, { cx: 26, cy: 15 }, { cx: 18, cy: 20 }, { cx: 12, cy: 27 } ], // Upper Left
      3: [ { cx: 12, cy: 33 }, { cx: 18, cy: 40 }, { cx: 26, cy: 45 }, { cx: 34, cy: 48 } ], // Lower Left
      4: [ { cx: 46, cy: 48 }, { cx: 54, cy: 45 }, { cx: 62, cy: 40 }, { cx: 68, cy: 33 } ], // Lower Right
    };

    return (
      <Svg width="100" height="75" viewBox="0 0 80 60">
        {/* Upper Right Arc */}
        {activeQuadrant === 1 ? (
          <AnimatedPath
            d="M 40 10 A 30 20 0 0 1 70 30"
            fill="transparent"
            stroke={COLORS.primary}
            strokeWidth="5"
            strokeLinecap="round"
            style={{ opacity: pulseAnim }}
          />
        ) : (
          <Path
            d="M 40 10 A 30 20 0 0 1 70 30"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Upper Left Arc */}
        {activeQuadrant === 2 ? (
          <AnimatedPath
            d="M 10 30 A 30 20 0 0 1 40 10"
            fill="transparent"
            stroke={COLORS.primary}
            strokeWidth="5"
            strokeLinecap="round"
            style={{ opacity: pulseAnim }}
          />
        ) : (
          <Path
            d="M 10 30 A 30 20 0 0 1 40 10"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Lower Left Arc */}
        {activeQuadrant === 3 ? (
          <AnimatedPath
            d="M 10 30 A 30 20 0 0 0 40 50"
            fill="transparent"
            stroke={COLORS.primary}
            strokeWidth="5"
            strokeLinecap="round"
            style={{ opacity: pulseAnim }}
          />
        ) : (
          <Path
            d="M 10 30 A 30 20 0 0 0 40 50"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Lower Right Arc */}
        {activeQuadrant === 4 ? (
          <AnimatedPath
            d="M 40 50 A 30 20 0 0 0 70 30"
            fill="transparent"
            stroke={COLORS.primary}
            strokeWidth="5"
            strokeLinecap="round"
            style={{ opacity: pulseAnim }}
          />
        ) : (
          <Path
            d="M 40 50 A 30 20 0 0 0 70 30"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Teeth dots */}
        {[1, 2, 3, 4].map((quad) => {
          const isCurrent = activeQuadrant === quad;
          const ToothComponent = isCurrent ? AnimatedCircle : Circle;
          const toothProps = isCurrent ? { style: { opacity: pulseAnim } } : {};
          
          return teeth[quad].map((t, idx) => (
            <ToothComponent
              key={`${quad}-${idx}`}
              cx={t.cx}
              cy={t.cy}
              r="2"
              fill={getToothFill(quad)}
              stroke={getToothStroke(quad)}
              strokeWidth="0.8"
              {...toothProps}
            />
          ));
        })}

        {/* Center cross division */}
        <Path
          d="M 40 5 L 40 55 M 5 30 L 75 30"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="0.8"
          strokeDasharray="2, 2"
        />
      </Svg>
    );
  };

  const renderDoctorDashboard = () => {
    const todayStr = getTodayDateString();
    const todayAppointments = appointments.filter(app => app.date === todayStr);
    const pendingAppointments = appointments.filter(app => app.status === "Bekliyor");
    const uniquePatients = new Set(appointments.map(app => app.userId).filter(Boolean)).size;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Background blobs */}
        <View style={styles.decorOrb1} />
        <View style={styles.decorOrb2} />

        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={[styles.avatarCircle, { backgroundColor: "rgba(0, 206, 209, 0.15)" }]}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.7}
            >
              <Text style={[styles.avatarText, { color: COLORS.primary }]}>{userInitials}</Text>
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Hoş Geldiniz,</Text>
              <Text style={styles.nameText}>Dr. {userName} 👨‍⚕️</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.logoText}>Gingiva<Text style={styles.logoAccent}>X</Text></Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand Badge */}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>HEKİM KONTROL PANELİ</Text>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={["rgba(0, 206, 209, 0.15)", "rgba(0, 206, 209, 0.02)"]}
              style={styles.statCard}
            >
              <Calendar size={20} color={COLORS.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.statNumber}>{todayAppointments.length}</Text>
              <Text style={styles.statLabel}>Bugünkü Randevular</Text>
            </LinearGradient>

            <LinearGradient
              colors={["rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0.02)"]}
              style={styles.statCard}
            >
              <Clock size={20} color="#f59e0b" style={{ marginBottom: 6 }} />
              <Text style={[styles.statNumber, { color: "#f59e0b" }]}>{pendingAppointments.length}</Text>
              <Text style={styles.statLabel}>Bekleyen Onaylar</Text>
            </LinearGradient>

            <LinearGradient
              colors={["rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.02)"]}
              style={styles.statCard}
            >
              <User size={20} color="#10b981" style={{ marginBottom: 6 }} />
              <Text style={[styles.statNumber, { color: "#10b981" }]}>{uniquePatients}</Text>
              <Text style={styles.statLabel}>Toplam Hasta</Text>
            </LinearGradient>
          </View>

          {/* Today's Schedule or Pending */}
          <Text style={styles.sectionTitle}>
            {todayAppointments.length > 0 ? "Bugünün Randevuları" : "Bekleyen Randevu İstekleri"}
          </Text>

          {/* List Appointments */}
          {(todayAppointments.length > 0 ? todayAppointments : pendingAppointments).length === 0 ? (
            <View style={styles.emptyCard}>
              <Calendar size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>Bekleyen veya planlanmış randevu bulunmuyor.</Text>
            </View>
          ) : (
            (todayAppointments.length > 0 ? todayAppointments : pendingAppointments).slice(0, 5).map((app) => {
              const statusStyle = getStatusStyle(app.status);
              return (
                <View key={app.id} style={styles.doctorAppCard}>
                  <View style={styles.doctorAppCardHeader}>
                    <Text style={styles.doctorAppService}>{app.service}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{app.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.doctorAppDetails}>
                    <View style={styles.doctorAppDetailRow}>
                      <Clock size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.doctorAppDetailValue}>{app.date} @ {app.time}</Text>
                    </View>
                    <View style={styles.doctorAppDetailRow}>
                      <User size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.doctorAppDetailValue}>Hasta: {app.user?.name || app.name || "Anonim"}</Text>
                    </View>
                  </View>

                  {app.status === "Bekliyor" && (
                    <View style={styles.doctorAppActions}>
                      <TouchableOpacity 
                        style={[styles.doctorAppBtn, styles.doctorApproveBtn]}
                        onPress={() => handleUpdateStatus(app.id, "Onaylandı")}
                      >
                        <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.doctorAppBtnText}>Onayla</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.doctorAppBtn, styles.doctorCancelBtn]}
                        onPress={() => handleUpdateStatus(app.id, "İptal Edildi")}
                      >
                        <X size={14} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.doctorAppBtnText}>İptal Et</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Quick Actions Shortcuts */}
          <Text style={styles.sectionTitle}>Hızlı Kısayollar</Text>
          
          <ScaleButton 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate("ChatTab")}
          >
            <LinearGradient
              colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
              style={styles.shortcutCardGradient}
            >
              <View style={styles.shortcutContent}>
                <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)", marginBottom: 0 }]}>
                  <MessageSquare size={22} color={COLORS.primary} />
                </View>
                <View style={styles.shortcutTextContainer}>
                  <Text style={styles.shortcutTitle}>Hastalarla Sohbet</Text>
                  <Text style={styles.shortcutDesc}>Hasta sorularını yanıtlayın ve sohbet edin</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </LinearGradient>
          </ScaleButton>

          <ScaleButton 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate("Profile")}
          >
            <LinearGradient
              colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
              style={styles.shortcutCardGradient}
            >
              <View style={styles.shortcutContent}>
                <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)", marginBottom: 0 }]}>
                  <Calendar size={22} color={COLORS.primary} />
                </View>
                <View style={styles.shortcutTextContainer}>
                  <Text style={styles.shortcutTitle}>Hekim Profili</Text>
                  <Text style={styles.shortcutDesc}>Randevu takviminizi ve profil bilgilerinizi düzenleyin</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </LinearGradient>
          </ScaleButton>

        </ScrollView>
      </SafeAreaView>
    );
  };

  if (userRole === "DOCTOR") {
    return renderDoctorDashboard();
  }

  // Filter for upcoming active appointments
  const upcomingAppointment = appointments
    .filter(app => app.status === "Onaylandı" || app.status === "Bekliyor")
    .sort((a, b) => parseAppDate(a.date) - parseAppDate(b.date))[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Decorative Glowing Blobs */}
      <View style={styles.decorOrb1} />
      <View style={styles.decorOrb2} />
      
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.avatarCircle}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{userInitials}</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.nameText}>{userName} 👋</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.logoText}>Gingiva<Text style={styles.logoAccent}>X</Text></Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Web-style Brand Badge */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>GÜLÜŞÜNÜZ BİZİM İÇİN DEĞERLİ</Text>
        </View>

        {/* Always-on Promo Banner at the Top */}
        <LinearGradient
          colors={["rgba(0, 206, 209, 0.8)", "rgba(13, 148, 136, 0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoCard}
        >
          <View style={styles.promoContent}>
            <View style={styles.promoTextContainer}>
              <View style={styles.promoBadge}>
                <Sparkles size={11} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.promoBadgeText}>AI KLİNİK YARDIMCISI</Text>
              </View>
              <Text style={styles.promoTitle}>Dişlerinizi Kontrol Ettiniz mi?</Text>
              <Text style={styles.promoDesc}>
                Dr. Perio ile saniyeler içinde ağız sağlığı ön analizi alın.
              </Text>
              <ScaleButton 
                style={styles.promoBtn}
                onPress={() => navigation.navigate("ChatTab", { activeTab: "ai" })}
              >
                <Text style={styles.promoBtnText}>Analize Başla</Text>
                <ChevronRight size={13} color="#0d9488" />
              </ScaleButton>
            </View>
            <View style={styles.promoImageWrapper}>
              <Image 
                source={require("../../../assets/dr-perio.png")} 
                style={styles.promoBotImage} 
              />
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Panel */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.actionsGrid}>
          
          {/* Card 1: Online Randevu Al */}
          <ScaleButton 
            style={[styles.actionCard, { borderColor: COLORS.glassBorder }]}
            onPress={() => navigation.navigate("Book")}
          >
            <LinearGradient
              colors={["rgba(16, 185, 129, 0.08)", "rgba(16, 185, 129, 0.01)"]}
              style={styles.actionCardGradient}
            >
              <View style={[styles.iconBg, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                <Calendar size={22} color="#10b981" />
              </View>
              <Text style={styles.actionTitle}>Online Randevu</Text>
              <Text style={styles.actionDesc}>Hemen hekiminden randevu al</Text>
            </LinearGradient>
          </ScaleButton>

          {/* Card 2: Dynamic Upcoming Appointment Card */}
          {loading ? (
            <View style={[styles.actionCard, { borderColor: COLORS.glassBorder, justifyContent: "center", alignItems: "center", minHeight: 125 }]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : upcomingAppointment ? (
            <ScaleButton 
              style={[styles.actionCard, { borderColor: COLORS.primary }]}
              onPress={() => navigation.navigate("Profile")}
            >
              <LinearGradient
                colors={["rgba(0, 206, 209, 0.12)", "rgba(0, 206, 209, 0.02)"]}
                style={styles.actionCardGradient}
              >
                <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.15)" }]}>
                  <Calendar size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.actionTitle} numberOfLines={1}>Aktif Randevu</Text>
                <Text style={styles.actionDesc} numberOfLines={4}>
                  <Text style={{ fontWeight: "700", color: COLORS.secondary }}>{upcomingAppointment.service}</Text>{"\n"}
                  {upcomingAppointment.date} - {upcomingAppointment.time}{"\n"}
                  {upcomingAppointment.doctor?.name || "Uzman Hekim"}
                </Text>
              </LinearGradient>
            </ScaleButton>
          ) : (
            <ScaleButton 
              style={[styles.actionCard, { borderColor: COLORS.glassBorder }]}
              onPress={() => navigation.navigate("Book")}
            >
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.04)", "rgba(255, 255, 255, 0.01)"]}
                style={styles.actionCardGradient}
              >
                <View style={[styles.iconBg, { backgroundColor: "rgba(255, 255, 255, 0.06)" }]}>
                  <Calendar size={22} color={COLORS.textSecondary} />
                </View>
                <Text style={styles.actionTitle}>Randevu Yok</Text>
                <Text style={styles.actionDesc}>Planlanmış aktif bir randevunuz bulunmuyor</Text>
              </LinearGradient>
            </ScaleButton>
          )}
          
        </View>

        <ScaleButton 
          style={styles.chatPromoCard}
          onPress={() => navigation.navigate("ChatTab", { activeTab: "doctors" })}
        >
          <LinearGradient
            colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCardInnerGradient}
          >
            <View style={styles.chatPromoContent}>
              <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)", marginBottom: 0 }]}>
                <MessageSquare size={22} color={COLORS.primary} />
              </View>
              <View style={styles.chatPromoTextContainer}>
                <Text style={styles.promoTitleText}>Hekimine Danış</Text>
                <Text style={styles.promoDescText}>Tedavini yürüten uzman hekimle sohbet et</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </LinearGradient>
        </ScaleButton>

        {/* Brushing Timer Promo Card */}
        <ScaleButton 
          style={styles.timerPromoCard}
          onPress={() => {
            setTimeLeft(120);
            setCurrentQuadrant(1);
            setTimerRunning(false);
            setTimerFinished(false);
            setTimerVisible(true);
          }}
        >
          <LinearGradient
            colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCardInnerGradient}
          >
            <View style={styles.timerPromoContent}>
              <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)", marginBottom: 0 }]}>
                <Clock size={22} color={COLORS.primary} />
              </View>
              <View style={styles.timerPromoTextContainer}>
                <Text style={styles.promoTitleText}>Diş Fırçalama Zamanlayıcısı</Text>
                <Text style={styles.promoDescText}>2 dakikalık kılavuzlu ve titreşim uyarıklı sayaç</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </LinearGradient>
        </ScaleButton>

        {/* Daily Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Heart size={15} color={COLORS.primary} fill={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.tipTitle}>Günün Sağlık Önerisi</Text>
          </View>
          <Text style={styles.tipText}>"{dentalTips[tipIndex]}"</Text>
        </View>

        {/* Services List Grid */}
        <Text style={styles.sectionTitle}>Hizmetlerimiz</Text>
        <View style={styles.servicesGrid}>
          {services.map(service => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <Stethoscope size={15} color={COLORS.primary} />
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
              </View>
              <Text style={styles.serviceDesc}>{service.desc}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Brushing Timer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={timerVisible}
        onRequestClose={handleCloseTimer}
      >
        <SafeAreaView style={styles.modalBg}>
          <LinearGradient
            colors={["#070e0e", "#0a1b1b", "#050a0a"]}
            style={styles.modalGradient}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diş Fırçalama Rehberi</Text>
              <TouchableOpacity onPress={handleCloseTimer} style={styles.closeButton}>
                <X size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {!timerFinished ? (
              <View style={styles.timerBody}>
                {/* Central Ring & Countdown */}
                <View style={styles.circleContainer}>
                  <Svg width="180" height="180" viewBox="0 0 180 180">
                    <Circle
                      cx="90"
                      cy="90"
                      r="70"
                      stroke="rgba(0, 206, 209, 0.08)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <Circle
                      cx="90"
                      cy="90"
                      r="70"
                      stroke={COLORS.primary}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={439.8}
                      strokeDashoffset={439.8 - (timeLeft / 120) * 439.8}
                      strokeLinecap="round"
                      transform="rotate(-90 90 90)"
                    />
                  </Svg>
                  <View style={styles.timerTextContainer}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerSubText}>kalan süre</Text>
                  </View>
                </View>

                {/* Mouth Quadrant Highlighter */}
                <View style={styles.mouthContainer}>
                  <MouthVisual activeQuadrant={currentQuadrant} />
                </View>

                {/* Quadrant Guide Instructions */}
                <View style={styles.guideContainer}>
                  <View style={styles.badgeRow}>
                    <View style={styles.pulseIndicator}>
                      <View style={styles.pulseInnerDot} />
                    </View>
                    <Text style={styles.quadrantTitle}>
                      {quadrants[currentQuadrant].name}
                    </Text>
                  </View>
                  <Text style={styles.quadrantDesc}>
                    {quadrants[currentQuadrant].desc}
                  </Text>
                </View>

                {/* Controls */}
                <View style={styles.controlsRow}>
                  <ScaleButton 
                    style={styles.controlBtnSecondary} 
                    onPress={handleResetTimer}
                  >
                    <RotateCcw size={20} color={COLORS.secondary} />
                  </ScaleButton>

                  <ScaleButton 
                    style={[
                      styles.controlBtnPrimary, 
                      timerRunning ? styles.btnPause : styles.btnPlay
                    ]} 
                    onPress={handleToggleTimer}
                  >
                    {timerRunning ? (
                      <Pause size={28} color="#ffffff" fill="#ffffff" />
                    ) : (
                      <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 4 }} />
                    )}
                  </ScaleButton>
                  
                  {/* Invisible placeholder for alignment */}
                  <View style={{ width: 56 }} />
                </View>

                <Text style={styles.vibrateNote}>
                  * Her 30 saniyede bir telefonunuz titreşerek bölge değişimini bildirecektir.
                </Text>
              </View>
            ) : (
              // Success / Celebration State
              <View style={styles.successBody}>
                <View style={styles.successBadgeContainer}>
                  <LinearGradient
                    colors={["#00ced1", "#0d9488"]}
                    style={styles.successBadgeGradient}
                  >
                    <Award size={64} color="#ffffff" />
                  </LinearGradient>
                </View>
                <Text style={styles.successTitle}>Harika İş!</Text>
                <Text style={styles.successDesc}>
                  2 dakikalık diş fırçalama seansını başarıyla tamamladınız. Diş hekimlerimiz bu harika rutininiz için gurur duyuyor! 🌟
                </Text>
                <ScaleButton 
                  style={styles.successCloseBtn}
                  onPress={handleCloseTimer}
                >
                  <Text style={styles.successCloseBtnText}>Ana Sayfaya Dön</Text>
                </ScaleButton>
              </View>
            )}
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  decorOrb1: {
    position: "absolute",
    top: height * 0.15,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(0, 206, 209, 0.03)",
    zIndex: -1,
  },
  decorOrb2: {
    position: "absolute",
    bottom: height * 0.25,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 206, 209, 0.02)",
    zIndex: -1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 10,
    flexDirection: "column",
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.secondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  badgeContainer: {
    backgroundColor: "rgba(0, 206, 209, 0.06)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.12)",
  },
  badgeText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  loaderContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  appointmentCardContainer: {
    width: "100%",
    marginBottom: SPACING.md,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  appointmentCard: {
    padding: SPACING.lg,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  activeIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  appointmentLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  appointmentService: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  appointmentDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  appInfoText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  promoCard: {
    width: "100%",
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    position: "relative",
    overflow: "hidden",
  },
  promoContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  promoBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
  },
  promoDesc: {
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  promoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  promoBtnText: {
    color: "#0d9488",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 4,
  },
  promoImageWrapper: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  promoBotImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
    resizeMode: "cover",
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  actionCard: {
    width: "48%",
    backgroundColor: COLORS.glass,
    borderWidth: 1.5,
    borderRadius: 24,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  actionCardGradient: {
    padding: SPACING.md,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  chatPromoCard: {
    backgroundColor: "transparent",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    marginBottom: SPACING.md,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  chatPromoContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatPromoTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  promoTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 2,
  },
  promoDescText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  tipCard: {
    backgroundColor: "rgba(0, 206, 209, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.1)",
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  tipTitle: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontStyle: "italic",
    lineHeight: 18,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceItem: {
    width: "48%",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  serviceTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.secondary,
    flex: 1,
  },
  serviceDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  timerPromoCard: {
    backgroundColor: "transparent",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    marginBottom: SPACING.md,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  promoCardInnerGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    width: "100%",
  },
  timerPromoContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timerPromoTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalGradient: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "space-between",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  closeButton: {
    padding: 4,
  },
  timerBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  circleContainer: {
    position: "relative",
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  timerTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  timerSubText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  mouthContainer: {
    marginBottom: SPACING.xl,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.05)",
  },
  guideContainer: {
    width: "100%",
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    backgroundColor: "rgba(0, 206, 209, 0.05)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.1)",
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  quadrantTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  quadrantDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: SPACING.lg,
  },
  controlBtnPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.neonGlow,
  },
  controlBtnSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  btnPlay: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.md,
  },
  btnPause: {
    backgroundColor: COLORS.danger,
    marginLeft: SPACING.md,
  },
  vibrateNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  successBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  successBadgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  successBadgeGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  successDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  successCloseBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.neonGlow,
  },
  successCloseBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: "31%",
    padding: SPACING.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  doctorAppCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  doctorAppCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  doctorAppService: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
    flex: 1,
    marginRight: 6,
  },
  doctorAppDetails: {
    marginBottom: SPACING.xs,
  },
  doctorAppDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  doctorAppDetailValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  doctorAppActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: SPACING.sm,
  },
  doctorAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    paddingVertical: 8,
    borderRadius: 20,
  },
  doctorApproveBtn: {
    backgroundColor: "#10b981",
  },
  doctorCancelBtn: {
    backgroundColor: "#ef4444",
  },
  doctorAppBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  shortcutCard: {
    backgroundColor: "transparent",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    marginBottom: SPACING.md,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  shortcutCardGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    width: "100%",
  },
  shortcutContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  shortcutTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  shortcutDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 13,
  },
});

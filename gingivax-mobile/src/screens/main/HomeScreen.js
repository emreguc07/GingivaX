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
  Alert,
  TextInput
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
import { getApiUrl, appointmentsApi, chatApi } from "../../services/api";

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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteInputs, setNoteInputs] = useState({}); // { [appointmentId]: string }
  const [savingNoteId, setSavingNoteId] = useState(null);

  // Brushing Timer States
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [currentQuadrant, setCurrentQuadrant] = useState(1);
  const [timerFinished, setTimerFinished] = useState(false);

  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const titlePulse = useRef(new Animated.Value(1)).current;

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

  const fetchUserInfo = async () => {
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
    } catch (e) {
      console.error("User info fetch error", e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsApi.getAppointments();
      if (response.success) {
        setAppointments(response.appointments || []);
      }
    } catch (e) {
      console.error("Appointments fetch error", e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await chatApi.getChatList();
      if (response.success) {
        setUnreadMessages(response.totalUnread || 0);
      }
    } catch (e) {
      // Sessizce geç
    }
  };

  // Ekran odaklandığında tüm veriyi çek, ardından her 15sn'de randevuları ve mesajları yenile
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const init = async () => {
        await Promise.all([fetchUserInfo(), fetchAppointments(), fetchUnreadCount()]);
        if (isMounted) setLoading(false);
      };

      init();

      const interval = setInterval(() => {
        if (isMounted) {
          fetchAppointments();
          fetchUnreadCount();
        }
      }, 15000);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [])
  );

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * dentalTips.length));

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, {
          toValue: 1.25,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(titlePulse, {
          toValue: 0.85,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
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
      1: [{ cx: 46, cy: 12 }, { cx: 54, cy: 15 }, { cx: 62, cy: 20 }, { cx: 68, cy: 27 }], // Upper Right
      2: [{ cx: 34, cy: 12 }, { cx: 26, cy: 15 }, { cx: 18, cy: 20 }, { cx: 12, cy: 27 }], // Upper Left
      3: [{ cx: 12, cy: 33 }, { cx: 18, cy: 40 }, { cx: 26, cy: 45 }, { cx: 34, cy: 48 }], // Lower Left
      4: [{ cx: 46, cy: 48 }, { cx: 54, cy: 45 }, { cx: 62, cy: 40 }, { cx: 68, cy: 33 }], // Lower Right
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
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

    const todayAppointments = appointments.filter(app => app.date === todayStr);
    const tomorrowAppointments = appointments.filter(app => app.date === tomorrowStr);
    const pendingAppointments = appointments.filter(app => app.status === "Bekliyor");
    const uniquePatients = new Set(appointments.map(app => app.userId).filter(Boolean)).size;
    const completedNoNote = appointments.filter(app => app.status === "Onaylandı" && !app.clinicalNote);

    // Haftalık özet (son 7 gün)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayApps = appointments.filter(a => a.date === ds);
      last7Days.push({
        label: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"][d.getDay()],
        total: dayApps.length,
        completed: dayApps.filter(a => a.status === "Onaylandı" || a.status === "Tamamlandı").length,
        pending: dayApps.filter(a => a.status === "Bekliyor").length,
        cancelled: dayApps.filter(a => a.status === "İptal Edildi").length,
      });
    }
    const maxBarVal = Math.max(...last7Days.map(d => d.total), 1);

    // Hasta arama filtresi
    const filteredAppointments = searchQuery.trim()
      ? appointments.filter(app =>
        (app.user?.name || app.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
      : null;

    const displayAppointments = filteredAppointments ||
      (todayAppointments.length > 0 ? todayAppointments : pendingAppointments);

    const sectionTitle = filteredAppointments
      ? `"${searchQuery}" Arama Sonuçları (${filteredAppointments.length})`
      : todayAppointments.length > 0
        ? "Bugünün Randevuları"
        : "Bekleyen Randevu İstekleri";

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
              {pendingAppointments.length > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{pendingAppointments.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Hoş Geldiniz,</Text>
              <Text style={styles.nameText}>Dt. {userName} 👨‍⚕️</Text>
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

          {/* Hasta Arama */}
          <View style={styles.searchBar}>
            <User size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Hasta adı ile ara..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Randevu uyarıları — reçete notu girilmemiş */}
          {completedNoNote.length > 0 && !searchQuery && (
            <TouchableOpacity
              style={styles.warningBanner}
              onPress={() => {
                // Not inputlarını önceden boş yükle
                const inputs = {};
                completedNoNote.forEach(a => { inputs[a.id] = ""; });
                setNoteInputs(inputs);
                setNoteModalVisible(true);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>📋 Eksik Reçete Notu</Text>
                <Text style={styles.warningDesc}>{completedNoNote.length} onaylı randevuda hekim notu girilmemiş.</Text>
              </View>
              <ChevronRight size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}

          {/* Eksik Reçete Notu Modalı */}
          <Modal
            visible={noteModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setNoteModalVisible(false)}
          >
            <View style={styles.noteModalOverlay}>
              <View style={styles.noteModalSheet}>
                <View style={styles.noteModalHeader}>
                  <Text style={styles.noteModalTitle}>📋 Eksik Reçete Notları</Text>
                  <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                    <X size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteModalSubtitle}>
                  {completedNoNote.length} randevu için hekim notu girilmemiş.
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                  {completedNoNote.map((app) => {
                    let formattedDate = app.date;
                    try {
                      const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
                      const parts = app.date.split("-");
                      if (parts.length === 3) formattedDate = `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}`;
                    } catch (e) { }

                    const isSaving = savingNoteId === app.id;

                    return (
                      <View key={app.id} style={styles.noteCard}>
                        <View style={styles.noteCardHeader}>
                          <View>
                            <Text style={styles.noteCardPatient}>{app.user?.name || app.name || "Anonim"}</Text>
                            <Text style={styles.noteCardMeta}>{app.service} · {formattedDate} {app.time}</Text>
                          </View>
                        </View>
                        <TextInput
                          style={styles.noteTextInput}
                          placeholder="Reçete notunu buraya girin..."
                          placeholderTextColor={COLORS.textMuted}
                          multiline
                          numberOfLines={3}
                          value={noteInputs[app.id] || ""}
                          onChangeText={(text) => setNoteInputs(prev => ({ ...prev, [app.id]: text }))}
                        />
                        <TouchableOpacity
                          style={[
                            styles.noteSubmitBtn,
                            (!noteInputs[app.id]?.trim() || isSaving) && styles.noteSubmitBtnDisabled
                          ]}
                          disabled={!noteInputs[app.id]?.trim() || isSaving}
                          onPress={async () => {
                            setSavingNoteId(app.id);
                            try {
                              const res = await appointmentsApi.updateAppointmentStatus(
                                app.id,
                                app.status,
                                noteInputs[app.id].trim()
                              );
                              if (res.success) {
                                // Lokal listeyi güncelle
                                setAppointments(prev => prev.map(a =>
                                  a.id === app.id ? { ...a, clinicalNote: noteInputs[app.id].trim() } : a
                                ));
                                Alert.alert("Kaydedildi", "Reçete notu başarıyla eklendi.");
                              }
                            } catch (e) {
                              Alert.alert("Hata", "Not kaydedilemedi.");
                            } finally {
                              setSavingNoteId(null);
                            }
                          }}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.noteSubmitText}>Kaydet</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Haftalık Özet Grafiği */}
          {!searchQuery && (
            <>
              <Text style={styles.sectionTitle}>Haftalık Özet</Text>
              <View style={styles.weeklyChart}>
                {last7Days.map((day, idx) => (
                  <View key={idx} style={styles.barColumn}>
                    <Text style={styles.barValue}>{day.total > 0 ? day.total : ""}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.round((day.total / maxBarVal) * 100)}%`,
                            backgroundColor:
                              day.cancelled > 0 ? "#ef4444"
                                : day.pending > 0 ? "#f59e0b"
                                  : day.completed > 0 ? COLORS.primary
                                    : "rgba(255,255,255,0.05)"
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{day.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Yarının randevuları (bugün boşsa veya arama yoksa göster) */}
          {!searchQuery && todayAppointments.length === 0 && tomorrowAppointments.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Yarınki Randevular ({tomorrowAppointments.length})</Text>
              {tomorrowAppointments.slice(0, 3).map((app) => {
                let formattedDate = app.date;
                try {
                  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
                  const parts = app.date.split("-");
                  if (parts.length === 3) formattedDate = `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}`;
                } catch (e) { }
                const statusStyle = getStatusStyle(app.status);
                return (
                  <View key={`tmr-${app.id}`} style={[styles.doctorAppCardHorizontal, { borderColor: "rgba(99,102,241,0.3)" }]}>
                    <View style={[styles.timeBadge, { backgroundColor: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)" }]}>
                      <Text style={[styles.timeText, { color: "#818cf8" }]}>{app.time}</Text>
                      <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={styles.patientName}>{app.user?.name || app.name || "Anonim"}</Text>
                      <Text style={styles.treatmentText} numberOfLines={1}>{app.service}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, minWidth: 72, alignItems: "center" }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text, fontSize: 10 }]}>{app.status}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Bugün / Bekleyen / Arama listesi */}
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>

          {/* List Appointments */}
          {displayAppointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Calendar size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>Bekleyen veya planlanmış randevu bulunmuyor.</Text>
            </View>
          ) : (
            displayAppointments.slice(0, 5).map((app) => {
              const statusStyle = getStatusStyle(app.status);

              // Format date as "13 Haz"
              let formattedDate = app.date;
              try {
                const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
                const parts = app.date.split("-");
                if (parts.length === 3) {
                  formattedDate = `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}`;
                }
              } catch (e) { }

              return (
                <View key={app.id} style={styles.doctorAppCardHorizontal}>
                  {/* Left: Time and Date Badge */}
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{app.time}</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                  </View>

                  {/* Middle: Patient & Service */}
                  <View style={styles.appInfo}>
                    <Text style={styles.patientName}>{app.user?.name || app.name || "Anonim"}</Text>
                    <Text style={styles.treatmentText} numberOfLines={1}>{app.service}</Text>
                  </View>

                  {/* Right: Actions or Status */}
                  <View style={styles.appActionWrapper}>
                    {app.status === "Bekliyor" ? (
                      <View style={styles.quickActionRow}>
                        <TouchableOpacity
                          style={[styles.quickBtn, styles.quickApprove]}
                          onPress={() => handleUpdateStatus(app.id, "Onaylandı")}
                        >
                          <Check size={14} color="#ffffff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.quickBtn, styles.quickCancel]}
                          onPress={() => handleUpdateStatus(app.id, "İptal Edildi")}
                        >
                          <X size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, minWidth: 80, alignItems: "center" }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text, fontSize: 10 }]}>{app.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Quick Actions Shortcuts */}
          <Text style={styles.sectionTitle}>Hızlı Kısayollar</Text>

          <View style={styles.doctorShortcutsRow}>
            <ScaleButton
              style={styles.doctorShortcutCard}
              onPress={() => navigation.navigate("ChatTab")}
            >
              <LinearGradient
                colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
                style={styles.doctorShortcutCardGradient}
              >
                <View style={{ position: "relative", marginBottom: 0 }}>
                  <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)", marginBottom: 0 }]}>
                    <MessageSquare size={22} color={COLORS.primary} />
                  </View>
                  {unreadMessages > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.doctorShortcutTextContainer}>
                  <Text style={styles.doctorShortcutTitle}>Mesajlar</Text>
                  <Text style={styles.doctorShortcutDesc}>
                    {unreadMessages > 0 ? `${unreadMessages} okunmamış` : "Hastalarla Sohbet"}
                  </Text>
                </View>
              </LinearGradient>
            </ScaleButton>

            <ScaleButton
              style={styles.doctorShortcutCard}
              onPress={() => navigation.navigate("Profile")}
            >
              <LinearGradient
                colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
                style={styles.doctorShortcutCardGradient}
              >
                <View style={[styles.iconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)", marginBottom: 0 }]}>
                  <Calendar size={22} color={COLORS.primary} />
                </View>
                <View style={styles.doctorShortcutTextContainer}>
                  <Text style={styles.doctorShortcutTitle}>Takvim</Text>
                  <Text style={styles.doctorShortcutDesc}>Randevu Yönetimi</Text>
                </View>
              </LinearGradient>
            </ScaleButton>
          </View>

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

        {/* Dr. Perio Hero Kartı */}
        <ScaleButton
          style={styles.perioBannerContainer}
          onPress={() => navigation.navigate("ChatTab", { activeTab: "ai" })}
        >
          <LinearGradient
            colors={["rgba(0, 206, 209, 0.72)", "rgba(13, 148, 136, 0.88)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.perioBanner}
          >
            <View style={styles.perioBannerLeft}>
              <View style={styles.perioBadge}>
                <Sparkles size={10} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.perioBadgeText}>YAPAY ZEKA ASISTAN</Text>
              </View>
              <Text style={styles.perioBannerTitle}>Dr. Perio</Text>
              <Text style={styles.perioBannerDesc}>
                GingivaX vizyonunun en yeni parçası olan Dr. Perio, yapay zeka destekli akıllı klinik asistanınızdır.
              </Text>
              <View style={styles.perioBannerBtn}>
                <Text style={styles.perioBannerBtnText}>Şimdi Analiz Edin</Text>
                <ChevronRight size={12} color="#0d9488" />
              </View>
            </View>
            <View style={styles.perioBannerRight}>
              <Image
                source={require("../../../assets/dr-perio.png")}
                style={styles.perioBotImage}
                resizeMode="cover"
              />
            </View>
          </LinearGradient>
        </ScaleButton>

        {/* Gülüşün Işıldasın */}
        <View style={styles.titleRow}>
          <Text style={[styles.premiumTitle, styles.premiumTitleHighlight]}>
            Gülüşün Işıldasın
          </Text>
          <Animated.View style={{ transform: [{ scale: titlePulse }], marginLeft: 6 }}>
            <Sparkles size={16} color={COLORS.primary} />
          </Animated.View>
        </View>
        <View style={styles.widgetContainer}>
          {/* Sol Sütun: Randevu Hatırlatıcı (Büyük Kare Kart) */}
          {upcomingAppointment ? (
            <ScaleButton
              style={styles.appointmentWidget}
              onPress={() => navigation.navigate("Profile")}
            >
              <LinearGradient
                colors={["rgba(0, 206, 209, 0.25)", "rgba(13, 148, 136, 0.08)"]}
                style={styles.appointmentWidgetGradient}
              >
                <View style={styles.widgetHeader}>
                  <View style={[styles.widgetIconBg, { backgroundColor: "rgba(0, 206, 209, 0.15)" }]}>
                    <Calendar size={18} color={COLORS.primary} />
                  </View>
                  {upcomingAppointment.status === "Onaylandı" ? (
                    <View style={[styles.liveBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                      <View style={[styles.liveDot, { backgroundColor: "#10b981" }]} />
                      <Text style={[styles.liveBadgeText, { color: "#10b981" }]}>ONAYLANDI</Text>
                    </View>
                  ) : (
                    <View style={[styles.liveBadge, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                      <View style={[styles.liveDot, { backgroundColor: "#f59e0b" }]} />
                      <Text style={[styles.liveBadgeText, { color: "#f59e0b" }]}>BEKLİYOR</Text>
                    </View>
                  )}
                </View>

                <View style={styles.widgetBody}>
                  <Text style={styles.widgetTime}>{upcomingAppointment.time}</Text>
                  <Text style={styles.widgetDate}>{upcomingAppointment.date}</Text>
                  {upcomingAppointment.doctor?.name && (
                    <Text style={styles.widgetDoctorName} numberOfLines={1}>
                      Dt. {upcomingAppointment.doctor.name}
                    </Text>
                  )}
                </View>

                <View style={styles.widgetFooter}>
                  <Text style={styles.widgetService} numberOfLines={1}>
                    {upcomingAppointment.service}
                  </Text>
                </View>
              </LinearGradient>
            </ScaleButton>
          ) : (
            <ScaleButton
              style={styles.appointmentWidget}
              onPress={() => navigation.navigate("Book")}
            >
              <LinearGradient
                colors={["rgba(14, 27, 27, 0.85)", "rgba(22, 45, 45, 0.45)"]}
                style={styles.appointmentWidgetGradient}
              >
                <View style={styles.widgetHeader}>
                  <View style={[styles.widgetIconBg, { backgroundColor: "rgba(0, 206, 209, 0.08)" }]}>
                    <Calendar size={18} color={COLORS.primary} />
                  </View>
                </View>

                <View style={styles.widgetBodyCentered}>
                  <Text style={styles.widgetEmptyTitle}>Yeni Randevu</Text>
                  <Text style={styles.widgetEmptyDesc}>Hemen online randevu alın</Text>
                </View>

                <View style={styles.widgetFooterCentered}>
                  <Text style={styles.widgetActionText}>Randevu Al</Text>
                </View>
              </LinearGradient>
            </ScaleButton>
          )}

          {/* Sağ Sütun: Hekime Danışın (Büyük Kare Kart) */}
          <ScaleButton
            style={styles.appointmentWidget}
            onPress={() => navigation.navigate("ChatTab", { activeTab: "doctors" })}
          >
            <LinearGradient
              colors={["rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0.03)"]}
              style={styles.appointmentWidgetGradient}
            >
              <View style={styles.widgetHeader}>
                <View style={[styles.widgetIconBg, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                  <MessageSquare size={18} color={COLORS.warning} />
                </View>
              </View>

              <View style={styles.widgetBodyCentered}>
                <Text style={styles.widgetEmptyTitle}>Hekime Danış</Text>
                <Text style={styles.widgetEmptyDesc}>Uzmanlarımızla soru & sohbet başlatın</Text>
              </View>

              <View style={styles.widgetFooterCentered}>
                <Text style={[styles.widgetActionText, { color: COLORS.warning }]}>Sohbet Başlat</Text>
              </View>
            </LinearGradient>
          </ScaleButton>
        </View>

        {/* Diş Fırçalama Takipçisi */}
        <ScaleButton
          style={styles.brushingBannerContainer}
          onPress={() => {
            setTimeLeft(120);
            setCurrentQuadrant(1);
            setTimerRunning(false);
            setTimerFinished(false);
            setTimerVisible(true);
          }}
        >
          <LinearGradient
            colors={["rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brushingBanner}
          >
            <View style={styles.brushingBannerLeft}>
              <View style={styles.brushingBadge}>
                <Clock size={11} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.brushingBadgeText}>SAĞLIK RUTİNİ</Text>
              </View>
              <Text style={styles.brushingBannerTitle}>Diş Fırçalama Zamanlayıcısı</Text>
              <Text style={styles.brushingBannerDesc}>
                Sağlıklı diş ve diş etleri için günde 2 kez 2 dakika doğru teknikle fırçalayın.
              </Text>
              <View style={styles.brushingStartBtn}>
                <Play size={10} color="#ffffff" fill="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.brushingStartBtnText}>Başlat (2 dk)</Text>
              </View>
            </View>
            <View style={styles.brushingBannerRight}>
              <View style={styles.brushingIconOuter}>
                <View style={styles.brushingIconInner}>
                  <Clock size={28} color="#10b981" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </ScaleButton>

        {/* Daily Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Heart size={14} color={COLORS.primary} fill={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.tipTitle}>Günün Sağlık Önerisi</Text>
          </View>
          <Text style={styles.tipText}>"{dentalTips[tipIndex]}"</Text>
        </View>

        {/* Services List Horizontal Slider */}
        <Text style={styles.sectionTitle}>Hizmetlerimiz</Text>
        <ScrollView
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesHorizontalScroll}
        >
          {services.map(service => (
            <View key={service.id} style={styles.horizontalServiceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <Stethoscope size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
              </View>
              <Text style={styles.serviceDesc}>{service.desc}</Text>
            </View>
          ))}
        </ScrollView>

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
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
    flex: 1,
  },
  serviceDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 17,
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
  doctorAppCardHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.glass,
  },
  timeBadge: {
    width: 65,
    height: 55,
    borderRadius: 12,
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.15)",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  treatmentText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appActionWrapper: {
    marginLeft: SPACING.sm,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  quickApprove: {
    backgroundColor: "#10b981",
  },
  quickCancel: {
    backgroundColor: "#ef4444",
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
  doctorShortcutsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  doctorShortcutCard: {
    width: "48%",
    backgroundColor: "transparent",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  doctorShortcutCardGradient: {
    padding: SPACING.md,
    alignItems: "flex-start",
    width: "100%",
  },
  doctorShortcutTextContainer: {
    marginTop: 8,
  },
  doctorShortcutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  doctorShortcutDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  widgetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    width: "100%",
  },
  appointmentWidget: {
    width: "48%",
    height: 152,
    backgroundColor: "transparent",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  appointmentWidgetGradient: {
    padding: 12,
    justifyContent: "space-between",
    height: "100%",
    width: "100%",
  },
  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  widgetIconBg: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 206, 209, 0.12)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  widgetBody: {
    marginTop: 6,
  },
  widgetTime: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  widgetDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: "500",
  },
  widgetDoctorName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  widgetFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 6,
    marginTop: 4,
  },
  widgetService: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
  },
  widgetBodyCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    marginTop: 4,
  },
  widgetEmptyTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  widgetEmptyDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 13,
  },
  widgetFooterCentered: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 6,
  },
  widgetActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  brushingBannerContainer: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.15)",
    overflow: "hidden",
    marginBottom: SPACING.md,
    ...SHADOWS.glass,
  },
  brushingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
  },
  brushingBannerLeft: {
    flex: 1,
    marginRight: 12,
  },
  brushingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  brushingBadgeText: {
    color: "#10b981",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brushingBannerTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  brushingBannerDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  brushingStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  brushingStartBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  brushingBannerRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  brushingIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.15)",
  },
  brushingIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  servicesHorizontalScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
  },

  horizontalServiceCard: {
    width: '48%', // İkişerli dizilim
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: 12,
    ...SHADOWS.glass,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  premiumTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.secondary,
    letterSpacing: 0.3,
  },
  premiumTitleHighlight: {
    color: COLORS.primary,
    textShadowColor: "rgba(0, 206, 209, 0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // --- YENİ STİLLER ---
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginBottom: SPACING.md,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f59e0b",
    marginBottom: 2,
  },
  warningDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  weeklyChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    height: 110,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginBottom: 3,
    fontWeight: "600",
  },
  barTrack: {
    width: 16,
    height: 55,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
  // --- REÇETE NOTU MODAL STİLLERİ ---
  noteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  noteModalSheet: {
    backgroundColor: "#0f1f1f",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  noteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noteModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  noteModalSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  noteCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  noteCardPatient: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  noteCardMeta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noteTextInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: SPACING.sm + 2,
    color: COLORS.text,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: SPACING.sm,
  },
  noteSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  noteSubmitBtnDisabled: {
    opacity: 0.4,
  },
  noteSubmitText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  // --- DR. PERİO HERO BANNER ---
  perioBannerContainer: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: SPACING.md,
    ...SHADOWS.glass,
  },
  perioBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
  },
  perioBannerLeft: {
    flex: 1,
    marginRight: 12,
  },
  perioBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  perioBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  perioBannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  perioBannerDesc: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  perioBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  perioBannerBtnText: {
    color: "#0d9488",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 4,
  },
  perioBannerRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  perioBotCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  perioBotImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
});

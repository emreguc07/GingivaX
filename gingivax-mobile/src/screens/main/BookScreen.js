// src/screens/main/BookScreen.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  Image,
  Animated,
  TouchableWithoutFeedback
} from "react-native";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { doctorsApi, appointmentsApi, getApiUrl } from "../../services/api";
import { Calendar as CalendarIcon, User, Stethoscope, Clock, Check } from "lucide-react-native";

const ScaleButton = ({ children, onPress, style, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.96,
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

export default function BookScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  
  // Selection state
  const [selectedService, setSelectedService] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null); // { id, name } or null (Any Doctor)
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState("");

  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const services = [
    "Ağız ve Çene Cerrahisi",
    "Ortodonti",
    "Periodontoloji",
    "Endodonti (Kanal Tedavisi)",
    "Protetik Diş Tedavisi",
    "Pedodonti (Çocuk Diş)"
  ];

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  useFocusEffect(
    useCallback(() => {
      const fetchDoctors = async () => {
        try {
          const response = await doctorsApi.getDoctors();
          if (response.success) {
            setDoctors(response.doctors);
          }
        } catch (err) {
          console.error("Failed to load doctors", err);
        }
      };
      fetchDoctors();
    }, [])
  );

  // Fetch booked slots when doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      
      const docId = selectedDoctor?.id;
      if (!docId) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const response = await appointmentsApi.getBookedSlots(docId, selectedDate);
        setBookedSlots(response.booked || []);
      } catch (err) {
        console.error("Failed to load slots", err);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctor, selectedDate]);

  // Generate next 7 days dynamically (excluding Sundays)
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      // Skip Sundays (0)
      if (futureDate.getDay() === 0) continue;
      
      const yyyy = futureDate.getFullYear();
      const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
      const dd = String(futureDate.getDate()).padStart(2, '0');
      const formattedString = `${yyyy}-${mm}-${dd}`;
      
      const displayString = futureDate.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
      days.push({ raw: formattedString, display: displayString });

      if (days.length === 7) break;
    }
    return days;
  };

  const isPastTime = (dateStr, timeStr) => {
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayFormatted = `${yyyy}-${mm}-${dd}`;
      
      if (dateStr === todayFormatted) {
        const [slotHour, slotMinute] = timeStr.split(":").map(Number);
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        
        if (slotHour < currentHour) {
          return true;
        }
        if (slotHour === currentHour && slotMinute <= currentMinute) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleBookAppointment = async () => {
    setLoading(true);
    try {
      const response = await appointmentsApi.bookAppointment({
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
        doctorId: selectedDoctor?.id || null,
        doctorName: selectedDoctor?.name || "Belirlenmedi",
      });

      if (response.success) {
        Alert.alert("Başarılı 🎉", "Randevunuz başarıyla oluşturuldu! Profilinizden takip edebilirsiniz.", [
          { 
            text: "Harika", 
            onPress: () => {
              // Reset state and redirect to Home or Profile
              setStep(1);
              setSelectedService("");
              setSelectedDoctor(null);
              setSelectedDate("");
              setSelectedTime("");
              navigation.navigate("Home");
            } 
          }
        ]);
      }
    } catch (err) {
      Alert.alert("Hata", err.message || "Randevu oluşturulurken bir sorun çıktı.");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.wizardHeader}>
      <Text style={styles.title}>Randevu Al</Text>
      <Text style={styles.subtitle}>Adım {step} / 5</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressIndicator, { width: `${(step / 5) * 100}%` }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Step 1: Select Service */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionLabel}>Hangi hizmet için randevu alacaksınız?</Text>
            {services.map(service => (
              <ScaleButton 
                key={service} 
                style={[
                  styles.cardButton, 
                  selectedService === service && styles.cardActive
                ]}
                onPress={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
              >
                <Stethoscope size={20} color={selectedService === service ? "#ffffff" : COLORS.primary} style={styles.iconStyle} />
                <Text style={[styles.cardButtonText, selectedService === service && styles.textActive]}>{service}</Text>
              </ScaleButton>
            ))}
          </View>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionLabel}>Dilediğiniz bir hekimi seçin:</Text>

            {doctors.map(doc => (
              <ScaleButton 
                key={doc.id} 
                style={[
                  styles.cardButton, 
                  selectedDoctor?.id === doc.id && styles.cardActive
                ]}
                onPress={() => {
                  setSelectedDoctor({ id: doc.id, name: doc.name });
                  setStep(3);
                }}
              >
                <View style={styles.avatarContainerMini}>
                  {doc.image && !imageErrors[doc.id] ? (
                    <Image 
                      source={{ uri: doc.image.startsWith("http") ? doc.image : `${getApiUrl()}${doc.image}` }} 
                      style={styles.avatarMini} 
                      onError={() => {
                        setImageErrors(prev => ({ ...prev, [doc.id]: true }));
                      }}
                    />
                  ) : (
                    <User size={18} color={selectedDoctor?.id === doc.id ? "#ffffff" : COLORS.primary} />
                  )}
                </View>
                <View>
                  <Text style={[styles.cardButtonText, selectedDoctor?.id === doc.id && styles.textActive]}>{doc.name}</Text>
                  <Text style={[styles.subLabel, selectedDoctor?.id === doc.id && styles.textActiveSub]}>{doc.specialty || "Diş Hekimi"}</Text>
                </View>
              </ScaleButton>
            ))}
          </View>
        )}

        {/* Step 3: Select Date */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionLabel}>Randevu tarihi seçin:</Text>
            {getNext7Days().map(day => (
              <ScaleButton 
                key={day.raw} 
                style={[
                  styles.cardButton, 
                  selectedDate === day.raw && styles.cardActive
                ]}
                onPress={() => {
                  setSelectedDate(day.raw);
                  setStep(4);
                }}
              >
                <CalendarIcon size={20} color={selectedDate === day.raw ? "#ffffff" : COLORS.primary} style={styles.iconStyle} />
                <Text style={[styles.cardButtonText, selectedDate === day.raw && styles.textActive]}>{day.display}</Text>
              </ScaleButton>
            ))}
          </View>
        )}

        {/* Step 4: Select Time Slot */}
        {step === 4 && (
          <View>
            <Text style={styles.sectionLabel}>Randevu saati seçin ({selectedDate}):</Text>
            
            {loadingSlots ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
            ) : (
              <View style={styles.timeGrid}>
                {timeSlots.map(time => {
                  const isPast = isPastTime(selectedDate, time);
                  const isBooked = bookedSlots.includes(time) || isPast;
                  const isSelected = selectedTime === time;

                  return (
                    <ScaleButton 
                      key={time} 
                      style={[
                        styles.timeBox, 
                        isSelected && styles.timeBoxActive,
                        isBooked && styles.timeBoxDisabled
                      ]}
                      disabled={isBooked}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Clock size={16} color={isSelected ? "#ffffff" : isBooked ? COLORS.textMuted : COLORS.secondary} style={{ marginBottom: 4 }} />
                      <Text style={[
                        styles.timeBoxText, 
                        isSelected && styles.textActive,
                        isBooked && styles.textDisabled
                      ]}>
                        {time}
                      </Text>
                    </ScaleButton>
                  );
                })}
              </View>
            )}

            {selectedTime !== "" && !loadingSlots && (
              <ScaleButton 
                style={[styles.nextButton, { marginTop: SPACING.xl }]}
                onPress={() => setStep(5)}
              >
                <Text style={styles.nextButtonText}>Devam Et</Text>
              </ScaleButton>
            )}
          </View>
        )}

        {/* Step 5: Review & Confirm */}
        {step === 5 && (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Randevu Detayları</Text>
            
            <View style={styles.reviewRow}>
              <Stethoscope size={18} color={COLORS.primary} />
              <View style={styles.reviewRowText}>
                <Text style={styles.reviewLabel}>Tedavi Hizmeti</Text>
                <Text style={styles.reviewValue}>{selectedService}</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <User size={18} color={COLORS.primary} />
              <View style={styles.reviewRowText}>
                <Text style={styles.reviewLabel}>Hekim</Text>
                <Text style={styles.reviewValue}>{selectedDoctor?.name}</Text>
              </View>
            </View>

            <View style={styles.reviewRow}>
              <CalendarIcon size={18} color={COLORS.primary} />
              <View style={styles.reviewRowText}>
                <Text style={styles.reviewLabel}>Tarih & Saat</Text>
                <Text style={styles.reviewValue}>{selectedDate} - {selectedTime}</Text>
              </View>
            </View>

            <ScaleButton 
              style={styles.confirmButton}
              onPress={handleBookAppointment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Check size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmButtonText}>Randevuyu Onayla ve Oluştur</Text>
                </>
              )}
            </ScaleButton>
          </View>
        )}

      </ScrollView>

      {/* Back button logic */}
      {step > 1 && (
        <ScaleButton 
          style={styles.backButton}
          onPress={() => setStep(step - 1)}
        >
          <Text style={styles.backButtonText}>← Geri Dön</Text>
        </ScaleButton>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  wizardHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: "hidden",
  },
  progressIndicator: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 80,
  },
  sectionLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontWeight: "600",
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 25,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  iconStyle: {
    marginRight: SPACING.md,
  },
  cardButtonText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  textActive: {
    color: "#ffffff",
  },
  subLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  textActiveSub: {
    color: "#ffffff",
    opacity: 0.8,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeBox: {
    width: "30%",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  timeBoxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeBoxDisabled: {
    backgroundColor: "transparent",
    borderColor: "rgba(255, 255, 255, 0.03)",
    opacity: 0.3,
  },
  timeBoxText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "700",
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 30,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  reviewCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.lg,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  reviewRowText: {
    marginLeft: SPACING.md,
  },
  reviewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.secondary,
    marginTop: 2,
  },
  confirmButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
    ...SHADOWS.neonGlow,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    position: "absolute",
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  backButtonText: {
    color: COLORS.secondary,
    fontWeight: "600",
  },
  avatarContainerMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  avatarMini: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});

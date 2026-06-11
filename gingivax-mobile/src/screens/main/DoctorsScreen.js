// src/screens/main/DoctorsScreen.js
import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  ActivityIndicator, 
  ScrollView,
  Image,
  Animated,
  TouchableWithoutFeedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { doctorsApi, getApiUrl } from "../../services/api";
import { User, Star, Award, BookOpen, Calendar, X } from "lucide-react-native";

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

export default function DoctorsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorsApi.getDoctors();
      if (response.success) {
        setDoctors(response.doctors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setModalVisible(true);
  };

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return "Yeni Hekim";
    const total = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    return (total / reviews.length).toFixed(1) + " ⭐";
  };

  const renderDoctorItem = ({ item }) => (
    <ScaleButton 
      style={styles.doctorCard}
      onPress={() => openDoctorDetails(item)}
    >
      <LinearGradient
        colors={["rgba(14, 27, 27, 0.82)", "rgba(22, 45, 45, 0.42)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.doctorCardGradient}
      >
        <View style={styles.avatarPlaceholder}>
          {item.image && !imageErrors[item.id] ? (
            <Image 
              source={{ uri: item.image.startsWith("http") ? item.image : `${getApiUrl()}${item.image}` }} 
              style={styles.avatar} 
              onError={() => {
                setImageErrors(prev => ({ ...prev, [item.id]: true }));
              }}
            />
          ) : (
            <User size={32} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty || "Diş Hekimi"}</Text>
          
          <View style={styles.ratingRow}>
            <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={styles.ratingText}>
              {getAverageRating(item.doctorReviews)} ({item.doctorReviews?.length || 0} Yorum)
            </Text>
          </View>
        </View>
      </LinearGradient>
    </ScaleButton>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hekimlerimiz</Text>
        <Text style={styles.subtitle}>GingivaX uzman diş hekimi kadrosu</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctorItem}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchDoctors}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Kayıtlı hekim bulunamadı.</Text>
          }
        />
      )}

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalBg}>
            <View style={styles.modalContent}>
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hekim Profili</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                
                {/* Intro */}
                <View style={styles.modalIntro}>
                  <TouchableOpacity 
                    disabled={!selectedDoctor.image || imageErrors[selectedDoctor.id]}
                    onPress={() => setIsImageZoomed(true)}
                    style={[styles.avatarPlaceholder, { width: 70, height: 70, borderRadius: 35 }]}
                  >
                    {selectedDoctor.image && !imageErrors[selectedDoctor.id] ? (
                      <Image 
                        source={{ uri: selectedDoctor.image.startsWith("http") ? selectedDoctor.image : `${getApiUrl()}${selectedDoctor.image}` }} 
                        style={styles.avatar} 
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [selectedDoctor.id]: true }));
                        }}
                      />
                    ) : (
                      <User size={40} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.modalName}>{selectedDoctor.name}</Text>
                  <Text style={styles.modalSpecialty}>{selectedDoctor.specialty || "Diş Hekimi"}</Text>
                  
                  <View style={styles.modalRatingRow}>
                    <Star size={16} color={COLORS.warning} fill={COLORS.warning} />
                    <Text style={styles.modalRatingText}>
                      {getAverageRating(selectedDoctor.doctorReviews)} ({selectedDoctor.doctorReviews?.length || 0} hasta yorumu)
                    </Text>
                  </View>
                </View>

                {/* Biography */}
                {selectedDoctor.bio && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Award size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.sectionLabel}>Hakkında</Text>
                    </View>
                    <Text style={styles.sectionValue}>{selectedDoctor.bio}</Text>
                  </View>
                )}

                {/* Education */}
                {selectedDoctor.education && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <BookOpen size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.sectionLabel}>Eğitim / Uzmanlık</Text>
                    </View>
                    <Text style={styles.sectionValue}>{selectedDoctor.education}</Text>
                  </View>
                )}

                {/* Reviews */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Hasta Yorumları</Text>
                  {selectedDoctor.doctorReviews && selectedDoctor.doctorReviews.length > 0 ? (
                    selectedDoctor.doctorReviews.map((rev, index) => (
                      <View key={index} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewerName}>{rev.patient?.name || "Misafir Hasta"}</Text>
                          <Text style={styles.starsRow}>
                            {"⭐".repeat(rev.rating)}
                          </Text>
                        </View>
                        <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noReviews}>Bu hekime henüz yorum yapılmamış.</Text>
                  )}
                </View>

              </ScrollView>

              <ScaleButton 
                style={styles.bookButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate("Book");
                }}
              >
                <Calendar size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.bookButtonText}>Bu Hekimden Randevu Al</Text>
              </ScaleButton>

              {/* Image Zoom Overlay inside Hekim Profili Modal */}
              {isImageZoomed && selectedDoctor.image && (
                <TouchableOpacity 
                  style={styles.zoomOverlayBg}
                  activeOpacity={1}
                  onPress={() => setIsImageZoomed(false)}
                >
                  <View style={styles.zoomContainer}>
                    <TouchableOpacity style={styles.closeZoomButton} onPress={() => setIsImageZoomed(false)}>
                      <X size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Image 
                      source={{ uri: selectedDoctor.image.startsWith("http") ? selectedDoctor.image : `${getApiUrl()}${selectedDoctor.image}` }} 
                      style={styles.zoomedImage} 
                    />
                    <Text style={styles.zoomedDoctorName}>{selectedDoctor.name}</Text>
                  </View>
                </TouchableOpacity>
              )}

            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
  doctorCard: {
    backgroundColor: "transparent",
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    marginBottom: SPACING.sm,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  doctorCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    width: "100%",
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardContent: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
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
  modalScroll: {
    flex: 1,
    marginTop: SPACING.md,
  },
  modalIntro: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.secondary,
    marginTop: SPACING.sm,
  },
  modalSpecialty: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  modalRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  modalRatingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  sectionBlock: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    paddingVertical: SPACING.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  starsRow: {
    fontSize: 10,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  noReviews: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: "italic",
  },
  bookButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    ...SHADOWS.neonGlow,
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  zoomOverlayBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  zoomContainer: {
    width: "90%",
    alignItems: "center",
  },
  closeZoomButton: {
    alignSelf: "flex-end",
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  zoomedImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  zoomedDoctorName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: SPACING.lg,
  },
});

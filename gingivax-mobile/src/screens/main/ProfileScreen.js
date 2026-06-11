// src/screens/main/ProfileScreen.js
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable
} from "react-native";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { profileApi, appointmentsApi, authApi } from "../../services/api";
import { User, Mail, Phone, Calendar, LogOut, Check, Edit, FileText, X } from "lucide-react-native";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 3;

  // Profil bilgisini sadece ilk açılışta çek
  const fetchProfile = async () => {
    try {
      const profileData = await profileApi.getProfile();
      if (profileData.success) {
        setUser(profileData.user);
        setName(profileData.user.name || "");
        setPhone(profileData.user.phone || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sadece randevuları çek (polling için hafif)
  const fetchAppointments = async () => {
    try {
      const appData = await appointmentsApi.getAppointments();
      if (appData.success) {
        setAppointments(appData.appointments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ekran odaklandığında profil + randevuları çek, ardından her 15sn'de randevuları güncelle
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const init = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchProfile(), fetchAppointments()]);
          if (isMounted) setCurrentPage(1);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      init();

      // Anlık güncelleme: her 15 saniyede randevuları yenile
      const interval = setInterval(() => {
        if (isMounted) fetchAppointments();
      }, 15000);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [])
  );

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Ad Soyad alanı boş bırakılamaz.");
      return;
    }

    setUpdating(true);
    try {
      const response = await profileApi.updateProfile(name.trim(), phone.trim());
      if (response.success) {
        setUser(response.user);
        setEditMode(false);
        Alert.alert("Başarılı", "Profiliniz güncellendi.");
      }
    } catch (err) {
      Alert.alert("Hata", err.message || "Profil güncellenemedi.");
    } finally {
      setUpdating(false);
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

  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { 
        text: "Çıkış", 
        style: "destructive",
        onPress: async () => {
          await authApi.logout();
          navigation.replace("Welcome");
        } 
      }
    ]);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Onaylandı":
        return { bg: "rgba(16, 185, 129, 0.1)", text: COLORS.approved };
      case "İptal Edildi":
        return { bg: "rgba(239, 68, 68, 0.1)", text: COLORS.cancelled };
      case "Zaman Aşımı":
        return { bg: "rgba(107, 114, 128, 0.1)", text: COLORS.timeout };
      default: // Bekliyor
        return { bg: "rgba(245, 158, 11, 0.1)", text: COLORS.pending };
    }
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAppointments = appointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(currentPage - 2, 1);
      let end = Math.min(start + maxVisiblePages - 1, totalPages);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(end - maxVisiblePages + 1, 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profilim</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
            {/* User Info Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <User size={36} color={COLORS.primary} />
                </View>
                {!editMode && (
                  <TouchableOpacity style={styles.editIcon} onPress={() => setEditMode(true)}>
                    <Edit size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>

              {editMode ? (
                <View style={styles.editForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ad Soyad</Text>
                    <TextInput 
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Adınız Soyadınız"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Telefon Numarası</Text>
                    <TextInput 
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="0555 555 5555"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.editButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.cancelBtn]} 
                      onPress={() => {
                        setName(user.name || "");
                        setPhone(user.phone || "");
                        setEditMode(false);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.saveBtn]} 
                      onPress={handleUpdateProfile}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.saveBtnText}>Kaydet</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoDisplay}>
                  <Text style={styles.profileName}>{user?.name}</Text>
                  <Text style={styles.profileRole}>{user?.role === "DOCTOR" ? "Diş Hekimi" : "Hasta"}</Text>
                  
                  <View style={styles.infoRow}>
                    <Mail size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={styles.infoValue}>{user?.email}</Text>
                  </View>

                  {user?.phone && (
                    <View style={styles.infoRow}>
                      <Phone size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                      <Text style={styles.infoValue}>{user?.phone}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Appointments List */}
            <Text style={styles.sectionTitle}>
              {user?.role === "DOCTOR" ? "Randevu Takvimi" : "Randevularım"}
            </Text>
            {appointments.length === 0 ? (
              <View style={styles.emptyAppointments}>
                <Calendar size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>Aktif veya geçmiş bir randevunuz bulunmuyor.</Text>
              </View>
            ) : (
              <View>
                {paginatedAppointments.map((app) => {
                  const statusStyle = getStatusStyle(app.status);
                  if (user?.role === "DOCTOR") {
                    let formattedDate = app.date;
                    try {
                      const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
                      const parts = app.date.split("-");
                      if (parts.length === 3) {
                        formattedDate = `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}`;
                      }
                    } catch (e) {}

                    return (
                      <View key={app.id} style={styles.doctorAppCardHorizontal}>
                        {/* Left: Time and Date Badge */}
                        <View style={styles.timeBadge}>
                          <Text style={styles.timeText}>{app.time}</Text>
                          <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>

                        {/* Middle: Patient & Service & Contact */}
                        <View style={styles.appInfo}>
                          <Text style={styles.patientName}>{app.user?.name || app.name || "Anonim"}</Text>
                          <Text style={styles.treatmentText}>{app.service}</Text>
                          {(app.user?.phone || app.phone) && (
                            <View style={styles.contactRow}>
                              <Phone size={11} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                              <Text style={styles.contactText}>{app.user?.phone || app.phone}</Text>
                            </View>
                          )}
                          {(app.user?.email || app.email) && (
                            <View style={styles.contactRow}>
                              <Mail size={11} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                              <Text style={styles.contactText}>{app.user?.email || app.email}</Text>
                            </View>
                          )}
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
                  }

                  return (
                    <View key={app.id} style={styles.appCard}>
                      <View style={styles.appCardHeader}>
                        <Text style={styles.appService}>{app.service}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.text }]}>{app.status}</Text>
                        </View>
                      </View>

                      <View style={styles.appDetails}>
                        <View style={styles.appDetailRow}>
                          <Calendar size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.appDetailValue}>{app.date} @ {app.time}</Text>
                        </View>

                        <View style={styles.appDetailRow}>
                          <User size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.appDetailValue}>
                            Hekim: {app.doctor?.name || "Atanıyor..."}
                          </Text>
                        </View>
                      </View>

                      {app.clinicalNote && (
                        <View style={styles.clinicalNoteBlock}>
                          <View style={styles.noteHeader}>
                            <FileText size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.noteLabel}>Hekim Notu / Reçete:</Text>
                          </View>
                          <Text style={styles.noteValue}>{app.clinicalNote}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Pagination Row */}
                {totalPages > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity 
                      style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                      onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Önceki</Text>
                    </TouchableOpacity>

                    <View style={styles.pageNumbers}>
                      {getPageNumbers().map((page) => (
                        <TouchableOpacity 
                          key={page}
                          style={[styles.pageNumBtn, currentPage === page && styles.pageNumBtnActive]}
                          onPress={() => setCurrentPage(page)}
                        >
                          <Text style={[styles.pageNumText, currentPage === page && styles.pageNumTextActive]}>
                            {page}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity 
                      style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                      onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Sonraki</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  logoutButton: {
    padding: 6,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  profileCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.xl,
    ...SHADOWS.glass,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  infoDisplay: {
    alignItems: "center",
    width: "100%",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  profileRole: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  infoValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  editForm: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md + 4,
    borderRadius: 25,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  actionButton: {
    width: "48%",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  cancelBtnText: {
    color: COLORS.secondary,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  emptyAppointments: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 13,
  },
  appCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  appCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  appService: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
    flex: 1,
    marginRight: 6,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  appDetails: {
    marginBottom: SPACING.xs,
  },
  appDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  appDetailValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  clinicalNoteBlock: {
    marginTop: SPACING.sm,
    backgroundColor: "rgba(16, 185, 129, 0.04)",
    borderColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  noteValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    width: "100%",
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(0, 206, 209, 0.06)",
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  pageBtnDisabled: {
    opacity: 0.3,
    borderColor: "transparent",
  },
  pageBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  pageBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  pageNumbers: {
    flexDirection: "row",
    alignItems: "center",
  },
  pageNumBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  pageNumBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pageNumText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  pageNumTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  doctorActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: SPACING.sm,
  },
  docBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    paddingVertical: 8,
    borderRadius: 20,
  },
  docApproveBtn: {
    backgroundColor: "#10b981",
  },
  docCancelBtn: {
    backgroundColor: "#ef4444",
  },
  docBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
});

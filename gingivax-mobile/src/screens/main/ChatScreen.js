// src/screens/main/ChatScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SPACING, SHADOWS } from "../../styles/theme";
import { chatApi, doctorsApi, getApiUrl } from "../../services/api";
import { Bot, Send, User, ChevronLeft, RefreshCw, Camera, Stethoscope, Clock, X } from "lucide-react-native";

export default function ChatScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState("ai"); // "ai" or "doctors"
  const [userRole, setUserRole] = useState("USER"); // DOCTOR or USER
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  // AI Chat State
  const [aiMessages, setAiMessages] = useState([
    {
      id: "1",
      sender: "ai",
      text: "Merhaba! Ben GingivaX kliniğinin yapay zeka asistanı Dr. Perio'yum. Ağız ve diş sağlığınızla ilgili şikayetlerinizi dinlemeye hazırım. Size nasıl yardımcı olabilirim?"
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("İzin Gerekli", "Dr. Perio'ya görsel yüklemek için galeri iznine ihtiyacımız var.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let mimeType = "image/jpeg";
        if (asset.mimeType) {
          mimeType = asset.mimeType;
        } else if (asset.uri.endsWith(".png")) {
          mimeType = "image/png";
        }
        
        setSelectedImage({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: mimeType
        });
      }
    } catch (err) {
      console.error("Image pick error", err);
      Alert.alert("Hata", "Görsel seçilirken bir sorun oluştu.");
    }
  };

  // Doctor Chat State
  const [activeChats, setActiveChats] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null); // The doctor/patient we are chatting with
  const [directMessages, setDirectMessages] = useState([]);
  const [directInput, setDirectInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const flatListRef = useRef();
  const directFlatRef = useRef();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserRole(user.role || "USER");
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkRole();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.activeTab) {
        setActiveTab(route.params.activeTab);
        navigation.setParams({ activeTab: undefined });
      }
    }, [route.params])
  );

  // Fetch doctors or patient active chats when "doctors" tab selected
  useEffect(() => {
    if (activeTab === "doctors") {
      loadChatUsers();
    }
  }, [activeTab]);

  // Poll for messages when a chat is open
  useEffect(() => {
    let interval;
    if (selectedChatUser) {
      loadMessages(selectedChatUser.id, false);
      interval = setInterval(() => {
        loadMessages(selectedChatUser.id, false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedChatUser]);

  const loadChatUsers = async () => {
    setLoadingChats(true);
    try {
      if (userRole === "DOCTOR") {
        // Doctor sees patients who messaged them
        const response = await chatApi.getChatList();
        if (response.success) {
          setActiveChats(response.users);
        }
      } else {
        // Patient sees list of all doctors they can chat with
        const response = await doctorsApi.getDoctors();
        if (response.success) {
          setDoctorsList(response.doctors);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (otherUserId, showLoader = true) => {
    if (showLoader) setLoadingMessages(true);
    try {
      const response = await chatApi.getMessages(otherUserId);
      if (response.success) {
        setDirectMessages(response.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  };

  const handleSendAiMessage = async () => {
    if (!aiInput.trim() && !selectedImage) return;
    
    const textToSend = aiInput.trim();
    const imageToSend = selectedImage;
    
    setAiInput("");
    setSelectedImage(null);

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      image: imageToSend ? imageToSend.uri : null
    };

    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const response = await chatApi.sendAiMessage(
        textToSend, 
        imageToSend ? imageToSend.base64 : null, 
        imageToSend ? imageToSend.mimeType : null
      );
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: response.reply,
        image: response.image || null
      };
      setAiMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin."
      };
      setAiMessages(prev => [...prev, errorMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!directInput.trim() || !selectedChatUser) return;

    const messageText = directInput.trim();
    setDirectInput("");

    try {
      const response = await chatApi.sendMessage(selectedChatUser.id, messageText);
      if (response.success) {
        // Append message to history
        setDirectMessages(prev => [...prev, response.message]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startChat = (otherUser) => {
    setSelectedChatUser(otherUser);
    loadMessages(otherUser.id, true);
  };

  const closeChat = () => {
    setSelectedChatUser(null);
    setDirectMessages([]);
    loadChatUsers();
  };

  const renderMessageText = (text, textStyle) => {
    if (!text) return null;

    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const linkText = match[1];
      const linkUrl = match[2];

      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      parts.push({
        isLink: true,
        text: linkText,
        url: linkUrl
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (parts.length === 0) {
      return <Text style={textStyle}>{text}</Text>;
    }

    return (
      <Text style={textStyle}>
        {parts.map((part, i) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part.isLink) {
            const isRandevu = part.url.includes("randevu") || part.url.includes("book");
            return (
              <Text 
                key={i} 
                style={styles.linkTextInline}
                onPress={() => {
                  if (isRandevu) {
                    navigation.navigate("Book");
                  }
                }}
              >
                {part.text}
              </Text>
            );
          }
          return null;
        })}
      </Text>
    );
  };

  const renderBubble = ({ item }) => {
    const isUser = item.sender === "user" || item.senderId !== selectedChatUser?.id;
    return (
      <View style={[styles.bubbleContainer, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUserBg : styles.bubbleOtherBg]}>
          {renderMessageText(item.text || item.content, isUser ? styles.bubbleUserText : styles.bubbleOtherText)}
          <Text style={styles.bubbleTime}>
            {new Date(item.createdAt || Date.now()).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  const renderAiHeader = useMemo(() => (
    <View style={styles.introCard}>
      <View style={styles.introHeader}>
        <TouchableOpacity onPress={() => setIsImageZoomed(true)}>
          <Image 
            source={require("../../../assets/dr-perio.png")} 
            style={styles.introAvatar} 
          />
        </TouchableOpacity>
        <View style={styles.introTextContainer}>
          <Text style={styles.introTitle}>Dr. Perio ile Tanışın ✨</Text>
          <Text style={styles.introSubtitle}>Yapay Zeka Klinik Asistanı</Text>
        </View>
      </View>
      <Text style={styles.introDesc}>
        GingivaX vizyonunun yapay zeka destekli akıllı klinik asistanıdır. Şikayetlerinizi dinler, diş sağlığınızla ilgili ön değerlendirme yapar ve sizi en doğru diş hekimliği uzmanlığına yönlendirir.
      </Text>
      
      <View style={styles.featureRow}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBg, { backgroundColor: "rgba(0, 206, 209, 0.1)" }]}>
            <Camera size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.featureText}>Ön Analiz</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBg, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
            <Stethoscope size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.featureText}>Doğru Yönlendirme</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBg, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
            <Clock size={16} color={COLORS.pending} />
          </View>
          <Text style={styles.featureText}>7/24 Aktif</Text>
        </View>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Header */}
      {!selectedChatUser && (
        <View style={styles.tabsHeader}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === "ai" && styles.tabButtonActive]}
            onPress={() => setActiveTab("ai")}
          >
            <Image 
              source={require("../../../assets/dr-perio.png")} 
              style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }} 
            />
            <Text style={[styles.tabText, activeTab === "ai" && styles.tabTextActive]}>Dr. Perio</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === "doctors" && styles.tabButtonActive]}
            onPress={() => setActiveTab("doctors")}
          >
            <User size={16} color={activeTab === "doctors" ? "#ffffff" : COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === "doctors" && styles.tabTextActive]}>
              {userRole === "DOCTOR" ? "Hastalarım" : "Hekimlerim"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Chat Window Header */}
      {selectedChatUser && (
        <View style={styles.chatWindowHeader}>
          <TouchableOpacity onPress={closeChat} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <View style={styles.chatHeaderUserInfo}>
            <Text style={styles.chatHeaderName}>{selectedChatUser.name}</Text>
            <Text style={styles.chatHeaderSub}>{selectedChatUser.specialty || (selectedChatUser.role === "USER" ? "Hasta" : "Hekim")}</Text>
          </View>
          <TouchableOpacity onPress={() => loadMessages(selectedChatUser.id, true)}>
            <RefreshCw size={18} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Tab 1: AI Chat Bot */}
        {activeTab === "ai" && !selectedChatUser && (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={aiMessages}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderAiHeader}
              renderItem={({ item }) => {
                const isUser = item.sender === "user";
                return (
                  <View style={[styles.bubbleContainer, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
                    {!isUser && (
                      <Image 
                        source={require("../../../assets/dr-perio.png")} 
                        style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, alignSelf: "flex-end", marginBottom: 2 }} 
                      />
                    )}
                    {isUser ? (
                      <View style={[styles.bubble, styles.bubbleUserBg]}>
                        {item.image && (
                          <Image 
                            source={{ uri: item.image }} 
                            style={styles.chatBubbleImage} 
                          />
                        )}
                        {item.text ? renderMessageText(item.text, styles.bubbleUserText) : null}
                      </View>
                    ) : (
                      <View style={styles.aiBubbleWrapper}>
                        <View style={styles.aiAccentBar} />
                        <LinearGradient
                          colors={["rgba(0, 206, 209, 0.14)", "rgba(13, 148, 136, 0.04)"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.bubble, styles.aiBubbleBg]}
                        >
                          {item.image && (
                            <Image 
                              source={{ uri: item.image.startsWith("http") ? item.image : `${getApiUrl()}${item.image}` }} 
                              style={styles.chatBubbleImage} 
                            />
                          )}
                          {item.text ? renderMessageText(item.text, styles.bubbleOtherText) : null}
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                );
              }}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {aiLoading && (
              <View style={[styles.typingIndicator, { flexDirection: "row", alignItems: "center" }]}>
                <Image 
                  source={require("../../../assets/dr-perio.png")} 
                  style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6 }} 
                />
                <Text style={styles.typingText}>Dr. Perio yazıyor...</Text>
              </View>
            )}

            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
                  <X size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputBar}>
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={handlePickImage} 
                disabled={aiLoading}
              >
                <Camera size={20} color={COLORS.primary} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                placeholder="Diş ağrısı için ne yapmalıyım?..."
                placeholderTextColor={COLORS.textMuted}
                value={aiInput}
                onChangeText={setAiInput}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendAiMessage} disabled={aiLoading}>
                <Send size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 2: Hekim List / Chat List */}
        {activeTab === "doctors" && !selectedChatUser && (
          <View style={{ flex: 1 }}>
            {loadingChats ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
              <ScrollView contentContainerStyle={styles.doctorsListScroll}>
                {userRole === "DOCTOR" ? (
                  // Display Patients list
                  activeChats.map(patient => (
                    <TouchableOpacity 
                      key={patient.id} 
                      style={styles.userChatRow}
                      onPress={() => startChat(patient)}
                    >
                      <View style={styles.chatAvatar}>
                        <User size={20} color={COLORS.primary} />
                      </View>
                      <View style={styles.userChatTextContainer}>
                        <Text style={styles.userChatName}>{patient.name}</Text>
                        <Text style={styles.userChatRole}>Hasta</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  // Display Doctors list
                  doctorsList.map(doc => (
                    <TouchableOpacity 
                      key={doc.id} 
                      style={styles.userChatRow}
                      onPress={() => startChat(doc)}
                    >
                      <View style={styles.chatAvatar}>
                        {doc.image && !imageErrors[doc.id] ? (
                          <Image 
                            source={{ uri: doc.image.startsWith("http") ? doc.image : `${getApiUrl()}${doc.image}` }} 
                            style={styles.avatarImage} 
                            onError={() => {
                              setImageErrors(prev => ({ ...prev, [doc.id]: true }));
                            }}
                          />
                        ) : (
                          <User size={20} color={COLORS.primary} />
                        )}
                      </View>
                      <View style={styles.userChatTextContainer}>
                        <Text style={styles.userChatName}>{doc.name}</Text>
                        <Text style={styles.userChatRole}>{doc.specialty || "Uzman Hekim"}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                {((userRole === "DOCTOR" && activeChats.length === 0) || (userRole !== "DOCTOR" && doctorsList.length === 0)) && (
                  <Text style={styles.emptyChatsText}>Aktif sohbet bulunmuyor.</Text>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Selected Chat User Room */}
        {selectedChatUser && (
          <View style={{ flex: 1 }}>
            {loadingMessages ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                ref={directFlatRef}
                data={directMessages}
                keyExtractor={(item) => item.id}
                renderItem={renderBubble}
                contentContainerStyle={styles.chatList}
                onContentSizeChange={() => directFlatRef.current?.scrollToEnd({ animated: true })}
              />
            )}

            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Mesajınızı yazın..."
                placeholderTextColor={COLORS.textMuted}
                value={directInput}
                onChangeText={setDirectInput}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendDirectMessage}>
                <Send size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Image Zoom Overlay for Dr. Perio */}
      {isImageZoomed && (
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
              source={require("../../../assets/dr-perio.png")} 
              style={styles.zoomedImage} 
            />
            <Text style={styles.zoomedDoctorName}>Dr. Perio</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsHeader: {
    flexDirection: "row",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    justifyContent: "space-between",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  chatWindowHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  chatHeaderUserInfo: {
    flex: 1,
  },
  chatHeaderName: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "700",
  },
  chatHeaderSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  keyboardView: {
    flex: 1,
  },
  chatList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  bubbleContainer: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
    width: "100%",
  },
  bubbleLeft: {
    justifyContent: "flex-start",
  },
  bubbleRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    padding: SPACING.md - 4,
    borderRadius: 20,
    maxWidth: "75%",
  },
  bubbleUserBg: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOtherBg: {
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 2,
  },
  aiBubbleWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    maxWidth: "88%",
  },
  aiAccentBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginRight: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  aiBubbleBg: {
    borderBottomLeftRadius: 2,
    borderColor: "rgba(0, 206, 209, 0.12)",
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: "100%",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleUserText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  bubbleOtherText: {
    color: COLORS.text,
  },
  chatBubbleImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: "cover",
  },
  imagePreviewContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    flexDirection: "row",
    alignItems: "center",
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    left: 46,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  bubbleTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "right",
  },
  typingIndicator: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  typingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 25,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: 8,
    marginRight: SPACING.sm,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorsListScroll: {
    padding: SPACING.md,
  },
  userChatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  userChatTextContainer: {
    flex: 1,
  },
  userChatName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  userChatRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyChatsText: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
  introCard: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.glass,
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  introAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  introSubtitle: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "600",
    marginTop: 2,
  },
  introDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingTop: SPACING.md,
  },
  featureItem: {
    alignItems: "center",
    width: "30%",
  },
  featureIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  linkTextInline: {
    color: COLORS.primary,
    textDecorationLine: "underline",
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

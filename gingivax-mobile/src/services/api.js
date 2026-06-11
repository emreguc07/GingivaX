// src/services/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Default configuration:
// - Android Emulator: http://10.0.2.2:3000
// - iOS Simulator: http://localhost:3000
// - Physical device: Use your computer's local IP (e.g. http://192.168.1.100:3000)
let API_BASE_URL = "http://172.20.10.2:3000";

let currentUserId = null;

// Load user from AsyncStorage on startup
export const initApiSession = async () => {
  try {
    const userJson = await AsyncStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      currentUserId = user.id;
      return user;
    }
  } catch (error) {
    console.error("Failed to load session", error);
  }
  return null;
};

export const setApiUrl = (url) => {
  API_BASE_URL = url;
};

export const getApiUrl = () => {
  return API_BASE_URL;
};

export const setUserId = (id) => {
  currentUserId = id;
};

const request = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (currentUserId) {
    headers["x-user-id"] = currentUserId;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Bir hata oluştu.");
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${path}:`, error);
    throw error;
  }
};

export const authApi = {
  login: async (email, password) => {
    const data = await request("/api/mobile/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.user) {
      currentUserId = data.user.id;
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },

  register: async (name, email, password) => {
    return request("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  verify: async (email, token) => {
    return request("/api/mobile/verify", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    });
  },

  resendCode: async (email) => {
    return request("/api/mobile/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  logout: async () => {
    currentUserId = null;
    await AsyncStorage.removeItem("user");
  }
};

export const doctorsApi = {
  getDoctors: async () => {
    return request("/api/mobile/doctors");
  }
};

export const appointmentsApi = {
  getBookedSlots: async (doctorId, date) => {
    return request(`/api/mobile/appointments?doctorId=${doctorId}&date=${date}`);
  },

  bookAppointment: async (appointmentData) => {
    return request("/api/mobile/appointments", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });
  },

  getAppointments: async () => {
    return request("/api/mobile/appointments");
  },

  updateAppointmentStatus: async (appointmentId, status, clinicalNote = null) => {
    return request("/api/mobile/appointments", {
      method: "PUT",
      body: JSON.stringify({ appointmentId, status, clinicalNote }),
    });
  }
};

export const chatApi = {
  getChatList: async () => {
    return request("/api/mobile/chat-list");
  },

  getMessages: async (otherUserId) => {
    return request(`/api/mobile/messages?otherUserId=${otherUserId}`);
  },

  sendMessage: async (receiverId, content) => {
    return request("/api/mobile/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId, content }),
    });
  },

  sendAiMessage: async (message, imageBase64 = null, mimeType = null) => {
    return request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, image: imageBase64, mimeType }),
    });
  }
};

export const profileApi = {
  getProfile: async () => {
    return request("/api/mobile/profile");
  },

  updateProfile: async (name, phone) => {
    const data = await request("/api/mobile/profile", {
      method: "PUT",
      body: JSON.stringify({ name, phone }),
    });
    if (data.success && data.user) {
      // Update local storage
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        const updatedUser = { ...user, name: data.user.name, phone: data.user.phone };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }
    }
    return data;
  }
};

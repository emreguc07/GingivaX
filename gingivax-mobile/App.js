// App.js
import React from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "./src/styles/theme";

// Auth Screens
import SplashScreen from "./src/screens/auth/SplashScreen";
import WelcomeScreen from "./src/screens/auth/WelcomeScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import VerifyScreen from "./src/screens/auth/VerifyScreen";

// Main Screens
import HomeScreen from "./src/screens/main/HomeScreen";
import BookScreen from "./src/screens/main/BookScreen";
import DoctorsScreen from "./src/screens/main/DoctorsScreen";
import ChatScreen from "./src/screens/main/ChatScreen";
import ProfileScreen from "./src/screens/main/ProfileScreen";

// Lucide Icons
import { Home, Calendar, Users, MessageSquare, User } from "lucide-react-native";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs Navigation
function MainTabNavigator() {
  const [role, setRole] = React.useState("USER");

  React.useEffect(() => {
    const checkRole = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          setRole(user.role || "USER");
        }
      } catch (err) {
        console.error("Failed to fetch user role in navigation", err);
      }
    };
    checkRole();
  }, []);

  const tabStyle = {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.glassBorder,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 22 : 8,
    height: Platform.OS === "ios" ? 82 : 62,
  };

  if (role === "DOCTOR") {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: tabStyle,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: Platform.OS === "ios" ? 0 : 4,
          }
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarLabel: "Ana Sayfa",
            tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />
          }}
        />
        <Tab.Screen 
          name="ChatTab" 
          component={ChatScreen} 
          options={{
            tabBarLabel: "Mesajlar",
            tabBarIcon: ({ color, size }) => <MessageSquare size={size - 2} color={color} />
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            tabBarLabel: "Hekim Paneli",
            tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />
          }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyle,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />
        }}
      />
      <Tab.Screen 
        name="Book" 
        component={BookScreen} 
        options={{
          tabBarLabel: "Randevu Al",
          tabBarIcon: ({ color, size }) => <Calendar size={size - 2} color={color} />
        }}
      />
      <Tab.Screen 
        name="Doctors" 
        component={DoctorsScreen} 
        options={{
          tabBarLabel: "Hekimler",
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />
        }}
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatScreen} 
        options={{
          tabBarLabel: "Sohbet",
          tabBarIcon: ({ color, size }) => <MessageSquare size={size - 2} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: "Profilim",
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        {/* Splash Intro Screen */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Auth Screens Stack */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verify" component={VerifyScreen} />
        
        {/* Main Tab Screen */}
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


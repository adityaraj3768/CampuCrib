import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  User,
  LogOut,
  Home,
  Heart,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../src/context/AppContext";
import { FloatingNav } from "../components";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userIdStored, setUserIdStored] = useState("");

  // Load user data from AsyncStorage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setUserName(userInfo.name || "");
          setUserRole(userInfo.role || "");
          setUserIdStored(userInfo.userId || "");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('tokenType');
      
      // Clear async storage
      await AsyncStorage.removeItem('userInfo');
      
      // Clear state
      setUser(null);
      setUserName("");
      setUserRole("");
      setUserIdStored("");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Menu items based on user role
  const menuItems = userRole === "ADMIN" 
    ? [{ icon: Home, label: "Pending Cribs", onPress: () => router.push('/admin/pending-cribs' as any) }]
    : userRole === "OWNER"
    ? [{ icon: Home, label: "My Listings", onPress: () => router.push('/owner/my-listings' as any) }]
    : userRole === "STUDENT"
    ? [{ icon: Heart, label: "My Favourites", onPress: () => router.push('/student/my-favorites' as any) }]
    : [];

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="font-grotesk text-gray-900 text-xl font-semibold ml-4">
            Profile
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-8">
          {/* Login/Signup Prompt Card */}
          <View
            className="bg-white border border-gray-200 rounded-2xl p-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <View className="items-center mb-6">
              <View className="bg-blue-500 w-20 h-20 rounded-full items-center justify-center mb-4">
                <User size={40} color="#FFFFFF" />
              </View>
              <Text className="font-grotesk text-gray-900 text-2xl font-bold">
                Login to CampusCrib
              </Text>
              <Text className="font-grotesk text-gray-500 text-center mt-2">
                Save your favorite cribs,{"\n"}post listings & more
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={() => router.push("/login")}
              className="bg-blue-500 rounded-xl py-4 items-center mb-3"
            >
              <Text className="font-grotesk text-white text-base font-semibold">
                Login
              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={() => router.push("/signup")}
              className="bg-white border border-gray-300 rounded-xl py-4 items-center"
            >
              <Text className="font-grotesk text-gray-900 text-base font-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <View className="items-center mt-6">
            <Text className="font-grotesk text-gray-400 text-xs">
              🔒 Your data is safe with us
            </Text>
          </View>
        </ScrollView>

        <FloatingNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text className="font-grotesk text-gray-900 text-xl font-semibold ml-4">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* User Card */}
        <View
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <View className="bg-blue-500 w-16 h-16 rounded-full items-center justify-center mr-4">
              <Text className="text-3xl">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="font-grotesk text-gray-900 text-xl font-semibold">
                {userName ? `Hey ${userName}! 👋` : "Hey there! 👋"}
              </Text>
              <Text className="font-grotesk text-gray-600 text-sm">{userIdStored || user.phone}</Text>
              <View className="bg-blue-500 px-3 py-1 rounded-lg mt-2 self-start">
                <Text className="font-grotesk text-white text-xs font-semibold uppercase">
                  {userRole || user.role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items - Show for all authenticated users */}
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                <Icon size={22} color="#3B82F6" />
              </View>
              <Text className="font-grotesk text-gray-900 text-base flex-1">
                {item.label}
              </Text>
              <Text className="font-grotesk text-gray-400">→</Text>
            </TouchableOpacity>
          );
        })}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 rounded-xl p-4 mt-4 flex-row items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <LogOut size={20} color="#FFFFFF" />
          <Text className="font-grotesk text-white text-base font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <FloatingNav />
    </SafeAreaView>
  );
}

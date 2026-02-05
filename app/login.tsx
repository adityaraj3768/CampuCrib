import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Eye, EyeOff, Phone, Lock } from "lucide-react-native";
import { useApp } from "../src/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  // Using physical device with computer's IP address
  return "http://192.168.1.48:8080";
};

const API_BASE_URL = getApiBaseUrl();

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
  }>({});

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the login API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: phone,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('Login response status:', response.status);
      console.log('Login response data:', data);

      if (!response.ok) {
        // Extract error message from backend response
        const errorMessage = data.message || data.error || 'Login failed';
        throw new Error(errorMessage);
      }

      console.log('Login successful! User data:', data.user);

      // Save token to SecureStore (encrypted)
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('tokenType', data.tokenType);

      // Save user info to AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
      console.log('Saved user info to storage:', data.user);

      // Update app context
      setUser(data.user);
      
      Alert.alert(
        "Welcome Back!",
        `You've successfully logged in as ${data.user.role}.`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Show the actual error message from backend or a fallback
      const errorMessage = error.message || "Invalid phone number or password. Please try again.";
      
      Alert.alert(
        "Login Failed",
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          bounces={false}
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <ChevronLeft size={24} color="#1F2937" />
            </TouchableOpacity>

            <View className="mt-4">
              <Text className="font-grotesk text-gray-900 text-3xl font-bold mb-2">
                Welcome Back
              </Text>
              <Text className="font-grotesk text-gray-600 text-base">
                Log in to continue finding cribs
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="px-5 flex-1">
            {/* Phone Number */}
            <View className="mb-4">
              <Text className="font-grotesk text-gray-700 text-sm mb-2 font-medium">
                Phone Number
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 border ${
                  errors.phone ? "border-red-400" : "border-gray-200"
                } rounded-xl px-4 h-14`}
              >
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 font-grotesk text-gray-900 text-base"
                  placeholder="+91 9876543210"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) {
                      setErrors({ ...errors, phone: undefined });
                    }
                  }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="next"
                />
              </View>
              {errors.phone && (
                <Text className="font-grotesk text-red-500 text-xs mt-1 ml-1">
                  {errors.phone}
                </Text>
              )}
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text className="font-grotesk text-gray-700 text-sm mb-2 font-medium">
                Password
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 border ${
                  errors.password ? "border-red-400" : "border-gray-200"
                } rounded-xl px-4 h-14`}
              >
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 font-grotesk text-gray-900 text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="ml-2"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="font-grotesk text-red-500 text-xs mt-1 ml-1">
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="font-grotesk text-blue-500 text-sm font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-blue-500 rounded-xl py-4 items-center ${
                isLoading ? "opacity-70" : ""
              }`}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-grotesk text-white text-base font-semibold">
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            {/* Signup Link */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="font-grotesk text-gray-600 text-sm">
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/signup")}>
                <Text className="font-grotesk text-blue-500 text-sm font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

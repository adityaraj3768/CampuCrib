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
import { ChevronLeft, Eye, EyeOff, User, Phone, Lock } from "lucide-react-native";
import { useApp } from "../src/context/AppContext";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  // Using physical device with computer's IP address
  return "http://192.168.1.48:8080";
  
  // For Android emulator, use 10.0.2.2 instead of localhost
  // if (Platform.OS === "android") {
  //   return "http://10.0.2.2:8080";
  // }
  // For iOS simulator and web, localhost works fine
  // return "http://localhost:8080";
};

const API_BASE_URL = getApiBaseUrl();

export default function SignupScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "OWNER">("STUDENT");
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
  }>({});

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    return password.length >= 8;
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the signup API
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: fullName,
          userId: phone,
          password: password,
          role: role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Save token to SecureStore (encrypted)
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('tokenType', data.tokenType);

      // Save user info to AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

      // Update app context
      setUser(data.user);
      
      Alert.alert(
        "Success!",
        data.message || "Your account has been created successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Signup Failed",
        error.message || "Something went wrong. Please try again."
      );
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                Create Account
              </Text>
              <Text className="font-grotesk text-gray-600 text-base">
                Sign up to find your perfect crib
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="px-5 pb-8">
            {/* Role Selection */}
            <View className="mb-4">
              <Text className="font-grotesk text-gray-700 text-sm mb-2 font-medium">
                I am a
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className={`flex-1 items-center py-3 rounded-xl mr-2 ${role === "STUDENT" ? "bg-blue-500" : "bg-gray-200"}`}
                  onPress={() => setRole("STUDENT")}
                  activeOpacity={0.8}
                >
                  <Text className={`font-grotesk text-base font-semibold ${role === "STUDENT" ? "text-white" : "text-gray-700"}`}>
                    Student
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 items-center py-3 rounded-xl ml-2 ${role === "OWNER" ? "bg-blue-500" : "bg-gray-200"}`}
                  onPress={() => setRole("OWNER")}
                  activeOpacity={0.8}
                >
                  <Text className={`font-grotesk text-base font-semibold ${role === "OWNER" ? "text-white" : "text-gray-700"}`}>
                    Owner
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Name */}
            <View className="mb-4">
              <Text className="font-grotesk text-gray-700 text-sm mb-2 font-medium">
                Full Name
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 border ${
                  errors.fullName ? "border-red-400" : "border-gray-200"
                } rounded-xl px-4 h-14`}
              >
                <User size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 font-grotesk text-gray-900 text-base"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: undefined });
                    }
                  }}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.fullName && (
                <Text className="font-grotesk text-red-500 text-xs mt-1 ml-1">
                  {errors.fullName}
                </Text>
              )}
            </View>

            {/* Phone */}
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
            <View className="mb-4">
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
                  placeholder="Create a password"
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
                  autoComplete="password-new"
                  returnKeyType="next"
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
              {!errors.password && password.length > 0 && password.length < 8 && (
                <Text className="font-grotesk text-gray-500 text-xs mt-1 ml-1">
                  Password must be at least 8 characters
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="font-grotesk text-gray-700 text-sm mb-2 font-medium">
                Confirm Password
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 border ${
                  errors.confirmPassword ? "border-red-400" : "border-gray-200"
                } rounded-xl px-4 h-14`}
              >
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 font-grotesk text-gray-900 text-base"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined });
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="font-grotesk text-red-500 text-xs mt-1 ml-1">
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className={`bg-blue-500 rounded-xl py-3 items-center ${
                isLoading ? "opacity-70" : ""
              }`}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-grotesk text-white text-base font-semibold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Terms & Privacy */}
            <Text className="font-grotesk text-gray-500 text-xs text-center mt-4 leading-5">
              By signing up, you agree to our{" "}
              <Text className="text-blue-500 font-semibold">Terms of Service</Text> and{" "}
              <Text className="text-blue-500 font-semibold">Privacy Policy</Text>
            </Text>

            {/* Login Link */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="font-grotesk text-gray-600 text-sm">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="font-grotesk text-blue-500 text-sm font-semibold">
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  User,
  Phone,
  LogOut,
  Home,
  Heart,
  Settings,
  HelpCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../src/context/AppContext";
import { BrutalButton, FloatingNav } from "../components";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      setShowOtp(true);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 4) {
      setIsLoading(true);
      // Mock verification - any 4 digit code works
      setTimeout(() => {
        setUser({
          id: "user_" + Date.now(),
          phone: "+91" + phone,
          role: "student",
        });
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPhone("");
    setOtp("");
    setShowOtp(false);
  };

  const menuItems = [
    { icon: Home, label: "My Listings", onPress: () => {} },
    { icon: Heart, label: "Saved Cribs", onPress: () => {} },
    { icon: Settings, label: "Settings", onPress: () => {} },
    { icon: HelpCircle, label: "Help & Support", onPress: () => {} },
  ];

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-cosmic">
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b-2 border-brutal">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-brutal w-10 h-10 rounded-xl items-center justify-center"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <ChevronLeft size={24} color="#FFF8E7" />
          </TouchableOpacity>

          <Text className="font-grotesk text-brutal text-xl ml-4">
            Profile
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-8">
          {/* Login Card */}
          <View
            className="bg-cosmic border-3 border-brutal rounded-2xl p-6"
            style={{
              borderWidth: 3,
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <View className="items-center mb-6">
              <View className="bg-lime w-20 h-20 rounded-full border-2 border-brutal items-center justify-center mb-4">
                <User size={40} color="#1A1A1A" />
              </View>
              <Text className="font-grotesk text-brutal text-2xl">
                Login to CampusCrib
              </Text>
              <Text className="font-mono text-brutal/60 text-center mt-2">
                Save your favorite cribs,{"\n"}post listings & more
              </Text>
            </View>

            {!showOtp ? (
              <>
                <Text className="font-mono text-brutal text-sm uppercase mb-2">
                  Phone Number
                </Text>
                <View
                  className="bg-cosmic border-2 border-brutal rounded-xl flex-row items-center px-4 mb-4"
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 3, height: 3 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text className="font-grotesk text-brutal text-lg">+91</Text>
                  <TextInput
                    className="flex-1 font-grotesk text-brutal text-lg py-4 px-2"
                    placeholder="9876543210"
                    placeholderTextColor="#1A1A1A40"
                    value={phone}
                    onChangeText={(text) =>
                      setPhone(text.replace(/[^0-9]/g, "").slice(0, 10))
                    }
                    keyboardType="phone-pad"
                  />
                  <Phone size={20} color="#1A1A1A" />
                </View>

                <BrutalButton
                  title="SEND OTP →"
                  variant={phone.length >= 10 ? "primary" : "secondary"}
                  size="lg"
                  onPress={handleSendOtp}
                  disabled={phone.length < 10}
                  className="w-full"
                />
              </>
            ) : (
              <>
                <Text className="font-mono text-brutal text-sm uppercase mb-2">
                  Enter OTP
                </Text>
                <Text className="font-mono text-brutal/60 text-xs mb-3">
                  Sent to +91 {phone} (mock: enter any 4 digits)
                </Text>
                <View
                  className="bg-cosmic border-2 border-brutal rounded-xl mb-4"
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 3, height: 3 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <TextInput
                    className="font-grotesk text-brutal text-3xl py-4 text-center tracking-widest"
                    placeholder="• • • •"
                    placeholderTextColor="#1A1A1A40"
                    value={otp}
                    onChangeText={(text) =>
                      setOtp(text.replace(/[^0-9]/g, "").slice(0, 4))
                    }
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>

                <BrutalButton
                  title={isLoading ? "VERIFYING..." : "VERIFY OTP ✓"}
                  variant={otp.length === 4 ? "primary" : "secondary"}
                  size="lg"
                  onPress={handleVerifyOtp}
                  disabled={otp.length < 4 || isLoading}
                  className="w-full"
                />

                <TouchableOpacity
                  onPress={() => {
                    setShowOtp(false);
                    setOtp("");
                  }}
                  className="mt-4 items-center"
                >
                  <Text className="font-mono text-brutal/60 underline">
                    Change number
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Decorative Elements */}
          <View className="items-center mt-8">
            <View className="flex-row">
              <View className="bg-orange w-4 h-4 rounded-full mr-2" />
              <View className="bg-lime w-4 h-4 rounded-full mr-2" />
              <View className="bg-violet w-4 h-4 rounded-full" />
            </View>
            <Text className="font-mono text-brutal/40 text-xs mt-4">
              🔒 Your data is safe with us
            </Text>
          </View>
        </ScrollView>

        <FloatingNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cosmic">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center border-b-2 border-brutal">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-brutal w-10 h-10 rounded-xl items-center justify-center"
          style={{
            shadowColor: "#1A1A1A",
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <ChevronLeft size={24} color="#FFF8E7" />
        </TouchableOpacity>

        <Text className="font-grotesk text-brutal text-xl ml-4">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* User Card */}
        <View
          className="bg-lime border-3 border-brutal rounded-2xl p-6 mb-6"
          style={{
            borderWidth: 3,
            shadowColor: "#1A1A1A",
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <View className="flex-row items-center">
            <View className="bg-brutal w-16 h-16 rounded-full items-center justify-center mr-4">
              <Text className="text-3xl">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="font-grotesk text-brutal text-xl">
                Hey there! 👋
              </Text>
              <Text className="font-mono text-brutal/70">{user.phone}</Text>
              <View className="bg-violet px-2 py-1 rounded mt-1 self-start">
                <Text className="font-mono text-brutal text-xs uppercase">
                  {user.role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="bg-cosmic border-2 border-brutal rounded-xl p-4 mb-3 flex-row items-center"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <View className="bg-violet/30 w-12 h-12 rounded-xl items-center justify-center mr-4">
                <Icon size={24} color="#1A1A1A" />
              </View>
              <Text className="font-grotesk text-brutal text-lg flex-1">
                {item.label}
              </Text>
              <Text className="font-mono text-brutal">→</Text>
            </TouchableOpacity>
          );
        })}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-orange border-2 border-brutal rounded-xl p-4 mt-4 flex-row items-center justify-center"
          style={{
            shadowColor: "#1A1A1A",
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <LogOut size={20} color="#FFF8E7" />
          <Text className="font-grotesk text-cosmic text-lg ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <FloatingNav />
    </SafeAreaView>
  );
}

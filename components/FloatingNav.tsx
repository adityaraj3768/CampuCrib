import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Home, Search, PlusCircle, User } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../src/context/AppContext";

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();
  const [userRole, setUserRole] = useState<string>("");

  // Load user role from AsyncStorage whenever user state changes
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setUserRole(userInfo.role || "");
        } else {
          // Clear role if no user info in storage
          setUserRole("");
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole("");
      }
    };

    loadUserRole();
  }, [user]); // Re-run when user state changes

  const tabs = [
    { icon: Home, route: "/search", label: "home" },
    { icon: Search, route: "/search", label: "search" },
    { icon: PlusCircle, route: "/owner/post", label: "post", ownerOnly: true },
    { icon: User, route: "/profile", label: "profile" },
  ].filter(tab => {
    // Hide post button only for STUDENT role (show for OWNER and ADMIN)
    if (tab.ownerOnly && userRole === "STUDENT") {
      return false;
    }
    return true;
  });

  return (
    <View className="absolute bottom-6 left-6 right-6">
      <View
        className="bg-white rounded-full flex-row items-center justify-around py-3 px-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: "#F3F4F6",
        }}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.route;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                // Don't navigate if already on the same route
                if (pathname !== tab.route) {
                  router.push(tab.route as any);
                }
              }}
              className={`p-3 rounded-full ${isActive ? "bg-blue-500" : "bg-transparent"}`}
            >
              <Icon 
                size={22} 
                color={isActive ? "#FFFFFF" : "#9CA3AF"} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Home, Search, PlusCircle, User } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { icon: Home, route: "/search", label: "home" },
    { icon: Search, route: "/search", label: "search" },
    { icon: PlusCircle, route: "/owner/post", label: "post" },
    { icon: User, route: "/profile", label: "profile" },
  ];

  return (
    <View className="absolute bottom-6 left-6 right-6">
      <View
        className="bg-brutal rounded-full flex-row items-center justify-around py-4 px-6"
        style={{
          shadowColor: "#1A1A1A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.route;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(tab.route as any)}
              className={`p-2 rounded-full ${isActive ? "bg-lime" : ""}`}
            >
              <Icon size={24} color={isActive ? "#1A1A1A" : "#FFF8E7"} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

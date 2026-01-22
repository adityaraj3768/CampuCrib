import React from "react";
import { View, Text } from "react-native";
import {
  Wifi,
  Wind,
  Utensils,
  WashingMachine,
  Car,
  Dumbbell,
  Tv,
  Flame,
  LucideIcon,
} from "lucide-react-native";

interface AmenityBadgeProps {
  type: "wifi" | "ac" | "food" | "laundry" | "parking" | "gym" | "tv" | "geyser";
}

const amenityConfig: Record<
  string,
  { icon: LucideIcon; label: string; color: string }
> = {
  wifi: { icon: Wifi, label: "WiFi", color: "bg-lime" },
  ac: { icon: Wind, label: "AC", color: "bg-blue-300" },
  food: { icon: Utensils, label: "Food", color: "bg-orange" },
  laundry: { icon: WashingMachine, label: "Laundry", color: "bg-violet" },
  parking: { icon: Car, label: "Parking", color: "bg-gray-300" },
  gym: { icon: Dumbbell, label: "Gym", color: "bg-red-300" },
  tv: { icon: Tv, label: "TV", color: "bg-purple-300" },
  geyser: { icon: Flame, label: "Geyser", color: "bg-yellow-300" },
};

export function AmenityBadge({ type }: AmenityBadgeProps) {
  const config = amenityConfig[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <View
      className={`${config.color} border-2 border-brutal px-3 py-2 rounded-xl flex-row items-center mr-2 mb-2`}
      style={{
        shadowColor: "#1A1A1A",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
      }}
    >
      <Icon size={16} color="#1A1A1A" />
      <Text className="font-mono text-brutal text-sm ml-2 font-bold">
        {config.label}
      </Text>
    </View>
  );
}

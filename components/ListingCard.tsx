import React from "react";
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { MapPin } from "lucide-react-native";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  genderType: "boys" | "girls" | "co-ed";
  housingType: "pg" | "flat";
  image: string;
  distance?: number;
  onPress: () => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;

export function ListingCard({
  title,
  price,
  genderType,
  housingType,
  image,
  distance,
  onPress,
}: ListingCardProps) {
  const genderColors = {
    boys: "bg-blue-400",
    girls: "bg-pink-400",
    "co-ed": "bg-violet",
  };

  const genderEmoji = {
    boys: "👦",
    girls: "👧",
    "co-ed": "👥",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="mr-4"
      style={{ width: CARD_WIDTH }}
    >
      <View
        className="bg-cosmic border-2 border-brutal rounded-squircle overflow-hidden"
        style={{
          shadowColor: "#1A1A1A",
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 5,
        }}
      >
        {/* Image Container - 80% */}
        <View className="relative" style={{ height: CARD_WIDTH * 0.9 }}>
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Price Sticker */}
          <View
            className="absolute top-3 right-3 bg-lime border-2 border-brutal px-3 py-1 rounded-lg"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Text className="font-grotesk text-brutal text-lg">
              ₹{price.toLocaleString()}
            </Text>
            <Text className="font-mono text-brutal text-xs">/month</Text>
          </View>

          {/* Gender Tag */}
          <View
            className={`absolute top-3 left-3 ${genderColors[genderType]} border-2 border-brutal px-2 py-1 rounded-lg flex-row items-center`}
          >
            <Text className="mr-1">{genderEmoji[genderType]}</Text>
            <Text className="font-mono text-brutal text-xs uppercase font-bold">
              {genderType}
            </Text>
          </View>

          {/* Housing Type */}
          <View className="absolute bottom-3 left-3 bg-brutal px-3 py-1 rounded-lg">
            <Text className="font-mono text-cosmic text-xs uppercase font-bold">
              {housingType}
            </Text>
          </View>
        </View>

        {/* Info Section - 20% */}
        <View className="p-3 border-t-2 border-brutal">
          <Text
            className="font-grotesk text-brutal text-base"
            numberOfLines={1}
          >
            {title}
          </Text>
          {distance !== undefined && (
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#FF4D00" />
              <Text className="font-mono text-brutal text-xs ml-1">
                {distance < 1
                  ? `${(distance * 1000).toFixed(0)}m away`
                  : `${distance.toFixed(1)}km away`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

import React, { useRef } from "react";
import { View, Text, Image, TouchableOpacity, Dimensions, Animated } from "react-native";
import { MapPin, Star, Heart } from "lucide-react-native";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  genderType: "boys" | "girls" | "co-ed";
  housingType: "pg" | "flat";
  image: string; // Can be Cloudinary URL or any image URL
  distance?: number;
  rating?: number;
  liked?: boolean;
  onPress: () => void;
  onLikePress?: () => void;
  isVertical?: boolean;
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
  rating,
  liked = false,
  onPress,
  onLikePress,
  isVertical = false,
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

  const cardWidth = isVertical ? width - 32 : CARD_WIDTH;
  const imageHeight = isVertical ? 200 : CARD_WIDTH * 0.9;

  // Animation for heart icon
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={isVertical ? "mb-3" : "mr-4"}
      style={{ width: cardWidth }}
    >
      <View
        className="bg-white rounded-xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Image Container */}
        <View className="relative" style={{ height: imageHeight }}>
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Price Badge */}
          <View
            className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-lg"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Text className="font-grotesk text-gray-900 text-base font-semibold">
              ₹{price.toLocaleString()}
            </Text>
            <Text className="font-grotesk text-gray-500 text-xs">/month</Text>
          </View>

          {/* Housing Type Badge */}
          <View className="absolute top-3 left-3 bg-blue-500 px-2.5 py-1 rounded-lg">
            <Text className="font-grotesk text-white text-xs font-medium uppercase">
              {housingType}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View className="p-3">
          <Text
            className="font-grotesk text-gray-900 text-base font-medium mb-1"
            numberOfLines={1}
          >
            {title}
          </Text>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text className="font-grotesk text-gray-600 text-sm capitalize mr-2">
                For {genderType}
              </Text>
              
              {distance !== undefined && (
                <View className="flex-row items-center">
                  <MapPin size={12} color="#EF4444" />
                  <Text className="font-grotesk text-red-500 text-xs ml-1 font-semibold">
                    {distance < 1
                      ? `${(distance * 1000).toFixed(0)}m`
                      : `${distance.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-center gap-2">
              {rating !== undefined && rating > 0 && (
                <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star size={14} color="#FBBF24" fill="#FBBF24" />
                  <Text className="font-grotesk text-gray-900 text-sm ml-1 font-bold">
                    {rating.toFixed(1)}
                  </Text>
                </View>
              )}
              
              {onLikePress && (
                <TouchableOpacity
                  onPress={(e) => {
                    console.log('❤️ Heart button tapped in ListingCard');
                    e.stopPropagation();
                    animateHeart();
                    onLikePress();
                  }}
                  className="bg-gray-50 p-2 rounded-lg active:bg-gray-100"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Heart
                      size={18}
                      color={liked ? "#EF4444" : "#9CA3AF"}
                      fill={liked ? "#EF4444" : "transparent"}
                      strokeWidth={2}
                    />
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

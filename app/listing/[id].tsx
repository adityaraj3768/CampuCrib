import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  ScrollView,
  Animated,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  MapPin,
  Home,
  Users,
} from "lucide-react-native";
import { useApp } from "../../src/context/AppContext";
import { AmenityBadge, BrutalButton } from "../../components";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const { width, height } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getListingById, getAmenitiesByListing, selectedCollege } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const imageOpacity = useRef(new Animated.Value(1)).current;

  const listing = getListingById(id || "");
  const amenities = listing ? getAmenitiesByListing(listing.id) : [];

  if (!listing) {
    return (
      <SafeAreaView className="flex-1 bg-cosmic items-center justify-center">
        <Text className="font-grotesk text-brutal text-2xl">
          Listing not found
        </Text>
        <BrutalButton
          title="Go Back"
          variant="dark"
          onPress={() => router.back()}
          className="mt-4"
        />
      </SafeAreaView>
    );
  }

  const handleImageTap = (event: any) => {
    const tapX = event.nativeEvent.locationX;
    const isRightSide = tapX > width / 2;

    if (isRightSide && currentImageIndex < listing.images.length - 1) {
      animateImageTransition(() => setCurrentImageIndex((prev) => prev + 1));
    } else if (!isRightSide && currentImageIndex > 0) {
      animateImageTransition(() => setCurrentImageIndex((prev) => prev - 1));
    }
  };

  const animateImageTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(imageOpacity, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hey, saw your listing "${listing.title}" near ${selectedCollege?.nickname || "your college"} on CampusCrib. Is it still available?`
    );
    const url = `whatsapp://send?phone=${listing.owner_phone}&text=${message}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://wa.me/${listing.owner_phone.replace("+", "")}?text=${message}`
      );
    });
  };

  const handleCall = () => {
    Linking.openURL(`tel:${listing.owner_phone}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${listing.housing_type.toUpperCase()} near ${selectedCollege?.nickname} - ₹${listing.rent_price}/month on CampusCrib!`,
        title: listing.title,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const genderColors = {
    boys: "bg-blue-400",
    girls: "bg-pink-400",
    "co-ed": "bg-violet",
  };

  return (
    <View className="flex-1 bg-cosmic">
      {/* Image Gallery - Instagram Story Style */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleImageTap}
        style={{ height: height * 0.55 }}
      >
        <Animated.Image
          source={{ uri: listing.images[currentImageIndex] }}
          style={{ width, height: height * 0.55, opacity: imageOpacity }}
          resizeMode="cover"
        />

        {/* Image Progress Indicators */}
        <View className="absolute top-14 left-4 right-4 flex-row">
          {listing.images.map((_, index) => (
            <View
              key={index}
              className={`flex-1 h-1 rounded-full mx-0.5 ${
                index === currentImageIndex ? "bg-cosmic" : "bg-cosmic/40"
              }`}
            />
          ))}
        </View>

        {/* Top Navigation */}
        <SafeAreaView className="absolute top-0 left-0 right-0">
          <View className="flex-row items-center justify-between px-4 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-cosmic/90 w-12 h-12 rounded-xl items-center justify-center border-2 border-brutal"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <ChevronLeft size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setIsLiked(!isLiked)}
                className={`${
                  isLiked ? "bg-orange" : "bg-cosmic/90"
                } w-12 h-12 rounded-xl items-center justify-center border-2 border-brutal mr-2`}
                style={{
                  shadowColor: "#1A1A1A",
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Heart
                  size={22}
                  color={isLiked ? "#FFF8E7" : "#1A1A1A"}
                  fill={isLiked ? "#FFF8E7" : "transparent"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                className="bg-cosmic/90 w-12 h-12 rounded-xl items-center justify-center border-2 border-brutal"
                style={{
                  shadowColor: "#1A1A1A",
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Share2 size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Price Tag Overlay */}
        <View
          className="absolute bottom-4 right-4 bg-lime border-3 border-brutal px-4 py-2 rounded-xl"
          style={{
            borderWidth: 3,
            shadowColor: "#1A1A1A",
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <Text className="font-grotesk text-brutal text-2xl">
            ₹{listing.rent_price.toLocaleString()}
          </Text>
          <Text className="font-mono text-brutal text-xs">/month</Text>
        </View>

        {/* Tap Hint */}
        <View className="absolute bottom-4 left-4 flex-row items-center">
          <Text className="font-mono text-cosmic text-xs bg-brutal/60 px-2 py-1 rounded">
            tap sides to navigate
          </Text>
        </View>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={["45%", "85%"]}
        backgroundStyle={{
          backgroundColor: "#FFF8E7",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderWidth: 3,
          borderColor: "#1A1A1A",
        }}
        handleIndicatorStyle={{
          backgroundColor: "#1A1A1A",
          width: 60,
          height: 5,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        >
          {/* Title & Tags */}
          <View className="mb-4">
            <Text className="font-grotesk text-brutal text-2xl mb-3">
              {listing.title}
            </Text>

            <View className="flex-row flex-wrap">
              <View
                className={`${genderColors[listing.gender_type]} border-2 border-brutal px-3 py-1 rounded-lg mr-2 mb-2`}
              >
                <Text className="font-mono text-brutal text-sm uppercase font-bold">
                  {listing.gender_type}
                </Text>
              </View>

              <View className="bg-brutal border-2 border-brutal px-3 py-1 rounded-lg mr-2 mb-2">
                <Text className="font-mono text-cosmic text-sm uppercase font-bold">
                  {listing.housing_type}
                </Text>
              </View>

              {listing.distance && (
                <View className="bg-orange border-2 border-brutal px-3 py-1 rounded-lg flex-row items-center mb-2">
                  <MapPin size={14} color="#FFF8E7" />
                  <Text className="font-mono text-cosmic text-sm ml-1">
                    {listing.distance < 1
                      ? `${(listing.distance * 1000).toFixed(0)}m`
                      : `${listing.distance.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          <View
            className="bg-violet/30 border-2 border-brutal rounded-xl p-4 mb-6"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <View className="flex-row items-center">
              <MapPin size={20} color="#1A1A1A" />
              <Text className="font-mono text-brutal text-sm ml-2">
                Near {selectedCollege?.name || "Selected College"}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          <View className="mb-6">
            <Text className="font-grotesk text-brutal text-lg mb-3">
              What's Included ✨
            </Text>
            <View className="flex-row flex-wrap">
              {amenities.map((amenity) => (
                <AmenityBadge key={amenity.id} type={amenity.type} />
              ))}
              {amenities.length === 0 && (
                <Text className="font-mono text-brutal/60">
                  No amenities listed
                </Text>
              )}
            </View>
          </View>

          {/* Owner Info */}
          <View
            className="bg-cosmic border-2 border-brutal rounded-xl p-4 mb-6"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Text className="font-grotesk text-brutal text-lg mb-2">
              Owner Details
            </Text>
            <View className="flex-row items-center">
              <View className="bg-lime w-12 h-12 rounded-full border-2 border-brutal items-center justify-center mr-3">
                <Text className="text-xl">👤</Text>
              </View>
              <View className="flex-1">
                <Text className="font-grotesk text-brutal text-base">
                  {listing.owner_name}
                </Text>
                <Text className="font-mono text-brutal/60 text-sm">
                  Property Owner
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Info */}
          <View className="flex-row mb-6">
            <View
              className="flex-1 bg-lime border-2 border-brutal rounded-xl p-4 mr-2 items-center"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <Home size={24} color="#1A1A1A" />
              <Text className="font-mono text-brutal text-xs mt-2 uppercase">
                {listing.housing_type}
              </Text>
            </View>
            <View
              className="flex-1 bg-violet border-2 border-brutal rounded-xl p-4 ml-2 items-center"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <Users size={24} color="#1A1A1A" />
              <Text className="font-mono text-brutal text-xs mt-2 uppercase">
                {listing.gender_type}
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Sticky CTA Buttons */}
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-cosmic border-t-3 border-brutal px-4 pt-4 pb-2"
        style={{ borderTopWidth: 3 }}
      >
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-1 bg-whatsapp border-2 border-brutal rounded-xl py-4 flex-row items-center justify-center mr-2"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <MessageCircle size={24} color="#1A1A1A" />
            <Text className="font-grotesk text-brutal text-lg ml-2">
              WhatsApp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            className="flex-1 bg-brutal border-2 border-brutal rounded-xl py-4 flex-row items-center justify-center ml-2"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Phone size={24} color="#FFF8E7" />
            <Text className="font-grotesk text-cosmic text-lg ml-2">Call</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

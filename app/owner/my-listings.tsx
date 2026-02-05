import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MapPin, IndianRupee, Star } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

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

interface Listing {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  gender: string;
  buildingType: string;
  status: string;
  electricityMode: string;
  electricityFee: number;
  price: number;
  rating: number;
  mediaUrls: string[];
  reviews: Array<{
    id: number;
    userId: string;
    userName: string;
    reviewText: string;
    rating: number;
    createdAt: string;
  }>;
  distanceInKm: number | null;
  ownerName: string;
  ownerPhoneNumber: string;
}

export default function MyListingsScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyListings = async () => {
    try {
      // Get auth token from SecureStore
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        Alert.alert("Error", "Please login to view your listings");
        router.push('/profile');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cribs/owner/my-listings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setListings(data);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      Alert.alert(
        "Error",
        "Failed to fetch your listings. Please try again."
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyListings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'REJECTED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 py-3 flex-row items-center border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="font-grotesk text-gray-900 text-xl font-semibold ml-4">
            My Listings
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="font-grotesk text-gray-500 text-base mt-4">
            Loading your listings...
          </Text>
        </View>
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
        <Text className="font-grotesk text-gray-900 text-xl font-semibold ml-4">
          My Listings
        </Text>
        <View className="flex-1" />
        <View className="bg-blue-100 px-3 py-1 rounded-lg">
          <Text className="font-grotesk text-blue-700 text-sm font-semibold">
            {listings.length} {listings.length === 1 ? 'Property' : 'Properties'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {listings.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text className="text-6xl mb-4">🏠</Text>
            <Text className="font-grotesk text-gray-900 text-xl font-bold text-center mb-2">
              No Listings Yet
            </Text>
            <Text className="font-grotesk text-gray-500 text-center mb-6">
              You haven't posted any properties yet.{"\n"}Start by posting your first listing!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/owner/post')}
              className="bg-blue-500 px-6 py-3 rounded-xl"
            >
              <Text className="font-grotesk text-white text-base font-semibold">
                Post a Property
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4 py-4">
            {listings.map((listing) => (
              <View
                key={listing.id}
                className="bg-white border border-gray-200 rounded-2xl mb-4 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                {/* Image */}
                {listing.mediaUrls && listing.mediaUrls.length > 0 && (
                  <Image
                    source={{ uri: listing.mediaUrls[0] }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                )}

                {/* Content */}
                <View className="p-4">
                  {/* Title and Status */}
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="font-grotesk text-gray-900 text-lg font-bold flex-1">
                      {listing.name}
                    </Text>
                    <View className={`${getStatusColor(listing.status)} px-3 py-1 rounded-lg ml-2`}>
                      <Text className="font-grotesk text-white text-xs font-semibold uppercase">
                        {listing.status}
                      </Text>
                    </View>
                  </View>

                  {/* Type and Gender */}
                  <View className="flex-row items-center mb-3">
                    <View className="bg-gray-100 px-2 py-1 rounded mr-2">
                      <Text className="font-grotesk text-gray-700 text-xs">
                        {listing.buildingType}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-2 py-1 rounded">
                      <Text className="font-grotesk text-gray-700 text-xs">
                        {listing.gender}
                      </Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View className="flex-row items-center mb-2">
                    <IndianRupee size={18} color="#3B82F6" />
                    <Text className="font-grotesk text-blue-600 text-xl font-bold ml-1">
                      {listing.price.toLocaleString()}
                    </Text>
                    <Text className="font-grotesk text-gray-500 text-sm ml-1">
                      /month
                    </Text>
                  </View>

                  {/* Electricity */}
                  <Text className="font-grotesk text-gray-600 text-sm mb-3">
                    Electricity: {listing.electricityMode}
                    {listing.electricityMode === 'METERED' && ` (₹${listing.electricityFee}/unit)`}
                  </Text>

                  {/* Rating and Reviews */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                    <View className="flex-row items-center">
                      <Star size={16} color="#FBBF24" fill="#FBBF24" />
                      <Text className="font-grotesk text-gray-700 text-sm font-semibold ml-1">
                        {listing.rating > 0 ? listing.rating.toFixed(1) : 'No ratings'}
                      </Text>
                      <Text className="font-grotesk text-gray-500 text-sm ml-1">
                        ({listing.reviews.length} {listing.reviews.length === 1 ? 'review' : 'reviews'})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push(`/listing/${listing.id}` as any)}
                      className="bg-blue-500 px-4 py-2 rounded-lg"
                    >
                      <Text className="font-grotesk text-white text-sm font-semibold">
                        View Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

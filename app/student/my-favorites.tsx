import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Heart } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { useApp, Listing } from "../../src/context/AppContext";
import { ListingCard } from "../../components";

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  // Using physical device with computer's IP address
  return "http://192.168.1.48:8080";
};

const API_BASE_URL = getApiBaseUrl();

export default function MyFavoritesScreen() {
  const router = useRouter();
  const { addToFetchedCribs } = useApp();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const likeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const token = await SecureStore.getItemAsync('authToken');
      const tokenType = await SecureStore.getItemAsync('tokenType');
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        router.back();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      
      // Map backend response to our Listing interface
      const mappedFavorites: Listing[] = data.map((crib: any) => ({
        id: crib.id.toString(),
        title: crib.name,
        lat: crib.latitude,
        lng: crib.longitude,
        gender_type: crib.gender.toLowerCase() as "boys" | "girls" | "co-ed",
        housing_type: crib.buildingType.toLowerCase() as "pg" | "flat",
        status: crib.status.toLowerCase() as "active" | "inactive" | "approved",
        rent_price: crib.price,
        images: crib.mediaUrls || [],
        distance: crib.distanceInKm,
        electricityMode: crib.electricityMode,
        electricityFee: crib.electricityFee,
        rating: crib.rating,
        reviews: crib.reviews,
        owner_name: crib.ownerName,
        owner_phone: crib.ownerPhoneNumber,
        liked: true, // Always true for favorites
      }));

      setFavorites(mappedFavorites);
      
      // Add favorites to global context so detail page can access them
      addToFetchedCribs(mappedFavorites);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorites. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFavorites(true);
  };

  const handleLikePress = async (listingId: string, currentLikedState: boolean) => {
    console.log('🔥 Unlike button pressed in favorites:', { listingId, currentLikedState });
    
    // Store the removed item in case we need to revert
    const removedItem = favorites.find(listing => listing.id === listingId);
    
    // Optimistically remove from UI immediately
    setFavorites(prevFavorites => 
      prevFavorites.filter(listing => listing.id !== listingId)
    );

    // Clear any existing timeout
    if (likeTimeoutRef.current) {
      clearTimeout(likeTimeoutRef.current);
    }

    // Set new timeout for API call (500ms debounce)
    likeTimeoutRef.current = setTimeout(async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const tokenType = await SecureStore.getItemAsync('tokenType');
        
        if (!token) {
          Alert.alert('Authentication Error', 'Please log in again.');
          // Add the item back if token is missing
          if (removedItem) {
            setFavorites(prevFavorites => [...prevFavorites, removedItem]);
          }
          return;
        }

        // Always use DELETE method since we're removing from favorites
        console.log(`DELETE request to ${API_BASE_URL}/favorites/${listingId}`);

        const response = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `${tokenType} ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`DELETE failed with status: ${response.status}`);
          throw new Error(`Failed to remove from favorites: ${response.status}`);
        }

        // Try to parse response, but don't fail if it's not JSON
        try {
          const data = await response.json();
          console.log('✅ Successfully removed from favorites:', data.message || data);
        } catch (parseError) {
          console.log('✅ Successfully removed from favorites (no JSON response)');
        }
      } catch (error: any) {
        console.error('❌ Error removing from favorites:', error);
        Alert.alert('Error', 'Failed to remove from favorites. Please try again.');
        // Add the item back on error instead of reloading entire list
        if (removedItem) {
          setFavorites(prevFavorites => [...prevFavorites, removedItem].sort((a, b) => 
            parseInt(a.id) - parseInt(b.id)
          ));
        }
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
          <Text className="font-grotesk text-gray-900 text-xl font-semibold">
            ❤️ My Favourites
          </Text>
          {!isLoading && (
            <Text className="font-grotesk text-gray-500 text-sm">
              {favorites.length} {favorites.length === 1 ? 'crib' : 'cribs'}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="font-grotesk text-gray-500 text-base mt-4">
            Loading your favourites...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
        >
          {favorites.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">💔</Text>
              <Text className="font-grotesk text-gray-900 text-xl font-semibold mb-2">
                No Favourites Yet
              </Text>
              <Text className="font-grotesk text-gray-500 text-center text-base px-8">
                Start exploring cribs and add them to your favourites to see them here
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/')}
                className="bg-blue-500 px-6 py-3 rounded-xl mt-6"
              >
                <Text className="font-grotesk text-white text-base font-semibold">
                  Explore Cribs
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            favorites.map((listing) => (
              <View key={listing.id} className="mb-3">
                <ListingCard
                  id={listing.id}
                  title={listing.title}
                  price={listing.rent_price}
                  genderType={listing.gender_type}
                  housingType={listing.housing_type}
                  image={listing.images[0]}
                  distance={listing.distance}
                  rating={listing.rating}
                  liked={listing.liked}
                  onPress={() => router.push(`/listing/${listing.id}` as any)}
                  onLikePress={() => handleLikePress(listing.id, listing.liked || false)}
                  isVertical
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

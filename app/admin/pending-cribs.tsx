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
import { ChevronLeft, MapPin, IndianRupee, CheckCircle, XCircle } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  // Using physical device with computer's IP address
  return "http://192.168.1.48:8080";
};

const API_BASE_URL = getApiBaseUrl();

interface PendingCrib {
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

export default function PendingCribsScreen() {
  const router = useRouter();
  const [cribs, setCribs] = useState<PendingCrib[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchPendingCribs = async () => {
    try {
      // Get auth token from SecureStore
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        Alert.alert("Error", "Please login to view pending cribs");
        router.push('/profile');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cribs/admin/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          Alert.alert("Access Denied", "You don't have permission to view this page");
          router.back();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCribs(data);
    } catch (error: any) {
      console.error('Error fetching pending cribs:', error);
      Alert.alert(
        "Error",
        "Failed to fetch pending cribs. Please try again."
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingCribs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingCribs();
  };

  const handleApprove = async (cribId: number) => {
    Alert.alert(
      "Approve Crib",
      "Are you sure you want to approve this crib?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setProcessingId(cribId);
            try {
              const token = await SecureStore.getItemAsync('authToken');
              
              const response = await fetch(`${API_BASE_URL}/cribs/admin/${cribId}/status?status=APPROVED`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              Alert.alert("Success", "Crib approved successfully!");
              // Remove from list
              setCribs(cribs.filter(crib => crib.id !== cribId));
            } catch (error: any) {
              console.error('Error approving crib:', error);
              Alert.alert("Error", "Failed to approve crib. Please try again.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (cribId: number) => {
    Alert.alert(
      "Reject Crib",
      "Are you sure you want to reject this crib?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setProcessingId(cribId);
            try {
              const token = await SecureStore.getItemAsync('authToken');
              
              const response = await fetch(`${API_BASE_URL}/cribs/admin/${cribId}/status?status=REJECTED`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              Alert.alert("Success", "Crib rejected successfully!");
              // Remove from list
              setCribs(cribs.filter(crib => crib.id !== cribId));
            } catch (error: any) {
              console.error('Error rejecting crib:', error);
              Alert.alert("Error", "Failed to reject crib. Please try again.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'BOYS':
        return 'bg-blue-500';
      case 'GIRLS':
        return 'bg-pink-500';
      case 'CO_ED':
        return 'bg-purple-500';
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
            Pending Cribs
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="font-grotesk text-gray-500 text-base mt-4">
            Loading pending cribs...
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
          Pending Cribs
        </Text>
        <View className="flex-1" />
        <View className="bg-orange-100 px-3 py-1 rounded-lg">
          <Text className="font-grotesk text-orange-700 text-sm font-semibold">
            {cribs.length} Pending
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {cribs.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text className="text-6xl mb-4">✅</Text>
            <Text className="font-grotesk text-gray-900 text-xl font-bold text-center mb-2">
              All Caught Up!
            </Text>
            <Text className="font-grotesk text-gray-500 text-center">
              No pending cribs to review at the moment
            </Text>
          </View>
        ) : (
          <View className="px-4 py-4">
            {cribs.map((crib) => (
              <View
                key={crib.id}
                className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                {/* Image */}
                <Image
                  source={{ uri: crib.mediaUrls[0] || 'https://placehold.co/600x400/jpg' }}
                  className="w-full h-48"
                  resizeMode="cover"
                />

                {/* Status Badge */}
                <View className="absolute top-3 right-3 bg-orange-500 px-3 py-1 rounded-lg">
                  <Text className="font-grotesk text-white text-xs font-semibold uppercase">
                    {crib.status}
                  </Text>
                </View>

                {/* Content */}
                <View className="p-4">
                  {/* Title and Price */}
                  <Text className="font-grotesk text-gray-900 text-lg font-semibold mb-2">
                    {crib.name}
                  </Text>
                  
                  <View className="flex-row items-center mb-3">
                    <IndianRupee size={18} color="#3B82F6" />
                    <Text className="font-grotesk text-blue-500 text-xl font-bold ml-1">
                      {crib.price.toLocaleString()}
                    </Text>
                    <Text className="font-grotesk text-gray-500 text-sm">/month</Text>
                  </View>

                  {/* Details */}
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    <View className={`${getGenderColor(crib.gender)} px-3 py-1 rounded-lg`}>
                      <Text className="font-grotesk text-white text-xs font-semibold">
                        {crib.gender}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-3 py-1 rounded-lg">
                      <Text className="font-grotesk text-gray-700 text-xs font-semibold">
                        {crib.buildingType}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-3 py-1 rounded-lg">
                      <Text className="font-grotesk text-green-700 text-xs font-semibold">
                        {crib.electricityMode}
                      </Text>
                    </View>
                  </View>

                  {/* Owner Info */}
                  <View className="bg-gray-50 rounded-lg p-3 mb-3">
                    <Text className="font-grotesk text-gray-600 text-xs mb-1">Owner Details</Text>
                    <Text className="font-grotesk text-gray-900 text-sm font-semibold">
                      {crib.ownerName}
                    </Text>
                    <Text className="font-grotesk text-gray-600 text-sm">
                      📞 {crib.ownerPhoneNumber}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleReject(crib.id)}
                      disabled={processingId === crib.id}
                      className="flex-1 bg-red-500 rounded-xl py-3 flex-row items-center justify-center"
                      style={{
                        opacity: processingId === crib.id ? 0.5 : 1,
                      }}
                    >
                      {processingId === crib.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <XCircle size={20} color="#FFFFFF" />
                          <Text className="font-grotesk text-white text-base font-semibold ml-2">
                            Reject
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleApprove(crib.id)}
                      disabled={processingId === crib.id}
                      className="flex-1 bg-green-500 rounded-xl py-3 flex-row items-center justify-center"
                      style={{
                        opacity: processingId === crib.id ? 0.5 : 1,
                      }}
                    >
                      {processingId === crib.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle size={20} color="#FFFFFF" />
                          <Text className="font-grotesk text-white text-base font-semibold ml-2">
                            Approve
                          </Text>
                        </>
                      )}
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

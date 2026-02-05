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
  Modal,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  MapPin,
  Home,
  Users,
  Star,
  Map,
  X,
  Maximize2,
  Send,
} from "lucide-react-native";
import { useApp } from "../../src/context/AppContext";
import { BrutalButton } from "../../components";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  // Using physical device with computer's IP address
  return "http://192.168.1.48:8080";
};

const API_BASE_URL = getApiBaseUrl();

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getListingById, selectedCollege, user, updateListingReviews } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [expandedReviewImage, setExpandedReviewImage] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [reviewInputY, setReviewInputY] = useState(0);
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [fetchedListing, setFetchedListing] = useState<any>(null);
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);
  const expandedFlatListRef = useRef<FlatList>(null);

  const listing = getListingById(id || "") || fetchedListing;

  // Fetch listing from backend if not found in context (e.g., pending cribs for admin)
  useEffect(() => {
    const fetchListingFromBackend = async () => {
      if (!getListingById(id || "") && id) {
        setIsLoadingListing(true);
        try {
          const token = await SecureStore.getItemAsync('authToken');
          const response = await fetch(`${API_BASE_URL}/cribs/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          
          if (response.ok) {
            const data = await response.json();
            // Transform backend data to match Listing interface
            setFetchedListing({
              id: data.id.toString(),
              title: data.name,
              rent_price: data.price,
              housing_type: data.buildingType,
              gender_type: data.gender,
              images: data.mediaUrls || [],
              lat: data.latitude,
              lng: data.longitude,
              owner_phone: data.ownerPhoneNumber,
              owner_name: data.ownerName,
              rating: data.rating || 0,
              reviews: data.reviews || [],
              distance: data.distanceInKm,
              status: data.status,
              electricity_mode: data.electricityMode,
              electricity_fee: data.electricityFee,
            });
          }
        } catch (error) {
          console.error('Error fetching listing:', error);
        } finally {
          setIsLoadingListing(false);
        }
      }
    };

    fetchListingFromBackend();
  }, [id]);

  // Scroll to current image when expanded modal opens
  useEffect(() => {
    if (expandedImageIndex !== null && expandedFlatListRef.current) {
      setTimeout(() => {
        expandedFlatListRef.current?.scrollToIndex({
          index: expandedImageIndex,
          animated: false,
        });
      }, 100);
    }
  }, [expandedImageIndex]);

  // Initialize local reviews with listing reviews
  useEffect(() => {
    if (listing?.reviews) {
      setLocalReviews(listing.reviews);
    }
  }, [listing]);

  // Check if the current user is the owner of this listing
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr && listing) {
          const userInfo = JSON.parse(userInfoStr);
          console.log('User Info:', userInfo); // Debug log
          console.log('User from context:', user); // Debug log
          // Compare user's phone/userId with listing's owner_phone
          const userPhone = userInfo.userId || userInfo.phone;
          if (userPhone && listing.owner_phone) {
            // Remove any formatting and compare
            const normalizedUserPhone = userPhone.replace(/[^0-9]/g, '');
            const normalizedOwnerPhone = listing.owner_phone.replace(/[^0-9]/g, '');
            setIsOwner(normalizedUserPhone === normalizedOwnerPhone);
          }
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
      }
    };

    checkOwnership();
  }, [listing, user]);

  // Check if the current user has already reviewed this listing
  useEffect(() => {
    const checkIfUserReviewed = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr && localReviews.length > 0) {
          const userInfo = JSON.parse(userInfoStr);
          const currentUserId = userInfo.userId || userInfo.phone || userInfo.id;
          
          // Check if user's ID exists in any of the reviews
          const userHasReviewed = localReviews.some(
            review => review.userId === currentUserId
          );
          
          setHasUserReviewed(userHasReviewed);
          console.log('User has reviewed:', userHasReviewed); // Debug log
        } else {
          setHasUserReviewed(false);
        }
      } catch (error) {
        console.error('Error checking user reviews:', error);
        setHasUserReviewed(false);
      }
    };

    checkIfUserReviewed();
  }, [localReviews, user]);

  if (isLoadingListing) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="font-grotesk text-gray-600 text-base mt-4">
          Loading listing details...
        </Text>
      </SafeAreaView>
    );
  }

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentImageIndex(index);
  };

  const handleExpandedScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setExpandedImageIndex(index);
  };

  const renderExpandedImageItem = ({ item }: { item: string }) => (
    <View style={{ width, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={{ uri: item }}
        style={{ width: width - 32, height: height * 0.7 }}
        resizeMode="contain"
      />
    </View>
  );

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setExpandedImageIndex(index)}
      style={{ width, height: height * 0.4 }}
    >
      <Image
        source={{ uri: item }}
        style={{ width, height: height * 0.4 }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const handleWhatsApp = () => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }
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
    if (!user) {
      setShowSignupModal(true);
      return;
    }
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

  const handleSubmitReview = async () => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }

    const userRole = user.role?.toUpperCase();
    if (userRole !== 'STUDENT') {
      Alert.alert('Access Denied', 'Only students can write reviews.');
      return;
    }

    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write a review before submitting.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('authToken');
      const tokenType = await SecureStore.getItemAsync('tokenType');
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return;
      }

      // Get user info
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

      // Submit review to API
      const response = await fetch(`${API_BASE_URL}/cribs/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          cribId: parseInt(id || '0'),
          userId: userInfo?.userId || userInfo?.phone,
          userName: userInfo?.name || 'Anonymous',
          reviewText: reviewText.trim(),
          rating: reviewRating,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      // Add the new review to local reviews
      const newReview = {
        id: data.id,
        userId: data.userId,
        userName: data.userName,
        reviewText: data.reviewText,
        rating: data.rating,
        createdAt: data.createdAt,
      };

      // Update local state
      setLocalReviews(prevReviews => [newReview, ...prevReviews]);
      setHasUserReviewed(true);

      // Update global context so review persists across navigation
      updateListingReviews(id || '', newReview);
      
      Alert.alert(
        'Review Submitted!',
        data.message || 'Thank you for your review. It will help other students make informed decisions.',
        [
          {
            text: 'OK',
            onPress: () => {
              setReviewText('');
              setReviewRating(0);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
      console.error('Review submission error:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const genderColors = {
    boys: "bg-blue-400",
    girls: "bg-pink-400",
    "co-ed": "bg-violet",
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isOwner ? 20 : 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Image Gallery Carousel - Swipeable with Pagination Dots */}
        <View style={{ height: height * 0.4 }}>
          <FlatList
            ref={flatListRef}
            data={listing.images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="center"
          />

          {/* Pagination Dots at Bottom */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center">
            {listing.images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === currentImageIndex ? 8 : 6,
                  height: index === currentImageIndex ? 8 : 6,
                  borderRadius: 4,
                  backgroundColor: index === currentImageIndex ? '#FFFFFF' : '#FFFFFF60',
                  marginHorizontal: 4,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                }}
              />
            ))}
          </View>

          {/* Top Navigation */}
          <View className="absolute top-0 left-0 right-0">
            <View className="flex-row items-center justify-between px-4 pt-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-white/95 w-10 h-10 rounded-full items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <ChevronLeft size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Expand Image Button */}
          <TouchableOpacity
            onPress={() => setExpandedImageIndex(currentImageIndex)}
            className="absolute bottom-3 right-3 bg-white/95 w-9 h-9 rounded-lg items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Maximize2 size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View className="bg-white px-5 pt-6">
          {/* Title & Price */}
          <View className="mb-5 pb-5 border-b border-gray-200">
            <Text className="font-grotesk text-gray-900 text-2xl mb-2 leading-tight">
              {listing.title}
            </Text>
            
            <View className="flex-row items-center flex-wrap mb-3">
              <Text className="font-grotesk text-gray-600 text-sm mr-3">
                {listing.housing_type.toUpperCase()} for {listing.gender_type}
              </Text>
              {listing.distance && (
                <>
                  <Text className="text-gray-400 mx-1">•</Text>
                  <MapPin size={12} color="#EF4444" style={{ marginRight: 2 }} />
                  <Text className="font-grotesk text-red-500 text-sm font-semibold">
                    {listing.distance < 1
                      ? `${(listing.distance * 1000).toFixed(0)}m away`
                      : `${listing.distance.toFixed(1)}km away`}
                  </Text>
                </>
              )}
              {listing.rating !== undefined && listing.rating > 0 && (
                <>
                  <Text className="text-gray-400 mx-1">•</Text>
                  <View className="flex-row items-center bg-yellow-50 px-2.5 py-1 rounded-lg">
                    <Star size={16} color="#FBBF24" fill="#FBBF24" />
                    <Text className="font-grotesk text-gray-900 text-base ml-1 font-bold">
                      {listing.rating.toFixed(1)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View className="flex-row items-baseline">
              <Text className="font-grotesk text-gray-900 text-3xl font-bold">
                ₹{listing.rent_price.toLocaleString()}
              </Text>
              <Text className="font-grotesk text-gray-500 text-base ml-1">/month</Text>
            </View>
          </View>

          {/* Property Details */}
          <View className="mb-5 pb-5 border-b border-gray-200">
            <Text className="font-grotesk text-gray-900 text-lg mb-4">Property Details</Text>
            <View className="flex-row">
              <View className="flex-1 bg-gray-50 rounded-xl p-4 mr-2">
                <Home size={20} color="#3B82F6" style={{ marginBottom: 8 }} />
                <Text className="font-grotesk text-gray-500 text-xs mb-1">Type</Text>
                <Text className="font-grotesk text-gray-900 text-sm capitalize">
                  {listing.housing_type}
                </Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2">
                <Users size={20} color="#3B82F6" style={{ marginBottom: 8 }} />
                <Text className="font-grotesk text-gray-500 text-xs mb-1">Suitable For</Text>
                <Text className="font-grotesk text-gray-900 text-sm capitalize">
                  {listing.gender_type}
                </Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <View className="mb-5 pb-5 border-b border-gray-200">
            <Text className="font-grotesk text-gray-900 text-lg mb-3">Location</Text>
            <View className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <MapPin size={18} color="#3B82F6" />
                <Text className="font-grotesk text-gray-700 text-sm ml-2 flex-1">
                  Near {selectedCollege?.nickname || selectedCollege?.name || "Selected College"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsMapVisible(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center ml-3"
              >
                <Map size={14} color="#FFF" />
                <Text className="font-grotesk text-white text-xs ml-1">View Map</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Owner Info */}
          <View className="mb-5 pb-5 border-b border-gray-200">
            <Text className="font-grotesk text-gray-900 text-lg mb-3">Hosted by</Text>
            <View className="flex-row items-center">
              <View className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center mr-3">
                <Text className="text-xl">👤</Text>
              </View>
              <View className="flex-1">
                <Text className="font-grotesk text-gray-900 text-base">
                  {listing.owner_name || "Property Owner"}
                </Text>
                <Text className="font-grotesk text-gray-500 text-sm">
                  Property Owner
                </Text>
                {user && listing.owner_phone && (
                  <Text className="font-grotesk text-gray-600 text-sm mt-1">
                    📞 {listing.owner_phone}
                  </Text>
                )}
                {!user && (
                  <TouchableOpacity 
                    onPress={() => setShowSignupModal(true)}
                    className="mt-2"
                  >
                    <Text className="font-grotesk text-blue-500 text-sm font-semibold">
                      Sign up to view contact details
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Write a Review Section - Only for logged-in students who haven't reviewed yet */}
          {user && user.role?.toUpperCase() === 'STUDENT' && !isOwner && !hasUserReviewed && (
            <View className="mb-5 pb-5 border-b border-gray-200">
              <Text className="font-grotesk text-gray-900 text-lg mb-3">Write a Review</Text>
              
              {/* Star Rating */}
              <View className="mb-4">
                <Text className="font-grotesk text-gray-700 text-sm mb-2">Your Rating</Text>
                <View className="flex-row items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      className="mr-2"
                      hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    >
                      <Star
                        size={32}
                        color="#FBBF24"
                        fill={star <= reviewRating ? "#FBBF24" : "transparent"}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  ))}
                  {reviewRating > 0 && (
                    <Text className="font-grotesk text-gray-600 text-sm ml-2">
                      {reviewRating === 1 && "Poor"}
                      {reviewRating === 2 && "Fair"}
                      {reviewRating === 3 && "Good"}
                      {reviewRating === 4 && "Very Good"}
                      {reviewRating === 5 && "Excellent"}
                    </Text>
                  )}
                </View>
              </View>

              {/* Review Text Input */}
              <View 
                className="mb-4"
                onLayout={(event) => {
                  const { y } = event.nativeEvent.layout;
                  setReviewInputY(y);
                }}
              >
                <Text className="font-grotesk text-gray-700 text-sm mb-2">Your Review</Text>
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Share your experience with this property... (e.g., location, amenities, owner behavior)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  onFocus={() => {
                    // Scroll to make the input and submit button visible above keyboard
                    setTimeout(() => {
                      if (scrollViewRef.current) {
                        scrollViewRef.current.scrollToEnd({ animated: true });
                      }
                    }, 300);
                  }}
                  className="bg-gray-50 rounded-xl p-4 font-grotesk text-gray-900 text-sm border border-gray-200"
                  style={{ 
                    minHeight: 100, 
                    textAlignVertical: 'top',
                  }}
                />
                <Text className="font-grotesk text-gray-400 text-xs mt-1 text-right">
                  {reviewText.length}/500
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0 || !reviewText.trim()}
                className={`rounded-xl py-3 flex-row items-center justify-center ${
                  isSubmittingReview || reviewRating === 0 || !reviewText.trim()
                    ? 'bg-gray-300'
                    : 'bg-blue-500 active:bg-blue-600'
                }`}
              >
                <Send size={18} color={isSubmittingReview || reviewRating === 0 || !reviewText.trim() ? "#9CA3AF" : "#FFFFFF"} />
                <Text className={`font-grotesk text-base ml-2 font-semibold ${
                  isSubmittingReview || reviewRating === 0 || !reviewText.trim()
                    ? 'text-gray-500'
                    : 'text-white'
                }`}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reviews Section - Only show if reviews exist */}
          {localReviews.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-grotesk text-gray-900 text-lg">
                  Reviews
                </Text>
                {localReviews.length > 0 && (
                  <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Star size={14} color="#FBBF24" fill="#FBBF24" />
                    <Text className="font-grotesk text-gray-900 text-sm ml-1">
                      {(localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length).toFixed(1)}
                    </Text>
                    <Text className="font-grotesk text-gray-500 text-sm ml-1">({localReviews.length} {localReviews.length === 1 ? 'review' : 'reviews'})</Text>
                  </View>
                )}
              </View>

              {/* Map through actual backend reviews */}
              {localReviews.map((review, index) => {
                const avatarColors = ['bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];
                const avatarColor = avatarColors[index % avatarColors.length];
                const avatarEmojis = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '👤', '🙋'];
                const avatarEmoji = avatarEmojis[index % avatarEmojis.length];
                
                // Format date
                const reviewDate = new Date(review.createdAt);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = Math.floor(diffDays / 30);
                
                let timeAgo = '';
                if (diffMonths > 0) {
                  timeAgo = `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
                } else if (diffDays > 0) {
                  timeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                } else {
                  timeAgo = 'Today';
                }
                
                return (
                  <View key={review.id} className="bg-gray-50 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center mb-3">
                      <View className={`${avatarColor} w-10 h-10 rounded-full items-center justify-center mr-3`}>
                        <Text className="text-base">{avatarEmoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-grotesk text-gray-900 text-sm">{review.userName}</Text>
                        <Text className="font-grotesk text-gray-500 text-xs">{timeAgo}</Text>
                      </View>
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            color="#FBBF24"
                            fill={star <= review.rating ? "#FBBF24" : "transparent"}
                          />
                        ))}
                      </View>
                    </View>
                    <Text className="font-grotesk text-gray-700 text-sm leading-5">
                      {review.reviewText}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky CTA Buttons - Hidden for owners viewing their own listings */}
      {!isOwner && (
        <SafeAreaView
          edges={["bottom"]}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-4 pb-2"
        >
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleWhatsApp}
              className="flex-1 bg-white border border-gray-300 rounded-xl py-3.5 flex-row items-center justify-center active:bg-gray-50"
            >
              <MessageCircle size={20} color="#25D366" strokeWidth={2} />
              <Text className="font-grotesk text-gray-900 text-base ml-2">WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-blue-500 rounded-xl py-3.5 flex-row items-center justify-center active:bg-blue-600"
            >
              <Phone size={20} color="#FFFFFF" strokeWidth={2} />
              <Text className="font-grotesk text-white text-base ml-2">Call Now</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Map Modal */}
      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-cosmic">
          {/* Modal Header */}
          <View className="px-4 py-3 flex-row items-center justify-between border-b-2 border-brutal bg-cosmic" style={{ zIndex: 100 }}>
            <TouchableOpacity
              onPress={() => setIsMapVisible(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="bg-brutal w-10 h-10 rounded-xl items-center justify-center"
              style={{
                zIndex: 101,
                elevation: 10,
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <X size={24} color="#FFF8E7" />
            </TouchableOpacity>

            <View className="flex-1 mx-4">
              <Text className="font-mono text-brutal/60 text-xs uppercase">
                Location
              </Text>
              <Text className="font-grotesk text-brutal text-lg" numberOfLines={1}>
                {listing.title}
              </Text>
            </View>
          </View>

          {/* Full Screen Map */}
          <View className="flex-1" >
            <MapView
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: listing.lat,
                longitude: listing.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              showsMyLocationButton
              showsCompass={true}
              showsScale={Platform.OS === "android"}
              loadingEnabled={true}
              loadingIndicatorColor="#3B82F6"
              loadingBackgroundColor="#FFFFFF"
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={false}
            >
              {/* Listing Marker */}
              <Marker
                coordinate={{
                  latitude: listing.lat,
                  longitude: listing.lng,
                }}
                title={listing.title}
              >
                <View
                  className="bg-lime border-2 border-brutal rounded-lg px-3 py-2"
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text className="font-grotesk text-brutal text-sm">
                    ₹{listing.rent_price.toLocaleString()}
                  </Text>
                </View>
              </Marker>

              {/* College Marker */}
              {selectedCollege && (
                <Marker
                  coordinate={{
                    latitude: selectedCollege.lat,
                    longitude: selectedCollege.lng,
                  }}
                  title={selectedCollege.nickname}
                >
                  <View
                    className="bg-orange border-3 border-brutal rounded-full p-2"
                    style={{ borderWidth: 3 }}
                  >
                    <Text className="text-xl">🎓</Text>
                  </View>
                </Marker>
              )}
            </MapView>

            {/* Map Legend */}
            <View className="absolute bottom-6 left-4 bg-cosmic border-2 border-brutal rounded-xl px-3 py-2">
              <View className="flex-row items-center mb-2">
                <View className="bg-lime w-4 h-4 rounded border border-brutal mr-2" />
                <Text className="font-mono text-brutal text-xs">This Crib</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-orange w-4 h-4 rounded-full border border-brutal mr-2" />
                <Text className="font-mono text-brutal text-xs">Your College</Text>
              </View>
            </View>

            {/* Get Directions Button */}
            <TouchableOpacity
              onPress={() => {
                const url = Platform.select({
                  ios: `maps:0,0?q=${listing.lat},${listing.lng}`,
                  android: `geo:0,0?q=${listing.lat},${listing.lng}(${listing.title})`,
                });
                if (url) Linking.openURL(url);
              }}
              className="absolute bottom-6 right-4 bg-brutal px-4 py-3 rounded-xl border-2 border-brutal flex-row items-center"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <MapPin size={18} color="#FFF8E7" />
              <Text className="font-mono text-cosmic text-sm font-bold ml-2">
                Get Directions
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Expanded Gallery Image Modal with Carousel */}
      <Modal
        visible={expandedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedImageIndex(null)}
      >
        <View className="flex-1 bg-brutal/95">
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setExpandedImageIndex(null)}
            activeOpacity={0.8}
            className="absolute top-14 right-4 bg-cosmic w-12 h-12 rounded-full items-center justify-center border-2 border-brutal"
            style={{
              zIndex: 100,
              elevation: 100,
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <X size={24} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Image Counter */}
          <View className="absolute top-16 left-0 right-0 items-center" style={{ zIndex: 50 }}>
            <View className="bg-cosmic/90 px-4 py-2 rounded-full border-2 border-brutal">
              <Text className="font-mono text-brutal text-sm font-bold">
                {(expandedImageIndex ?? 0) + 1} / {listing.images.length}
              </Text>
            </View>
          </View>

          {/* Swipeable Image Carousel */}
          <View className="flex-1 justify-center">
            {expandedImageIndex !== null && (
              <FlatList
                ref={expandedFlatListRef}
                data={listing.images}
                renderItem={renderExpandedImageItem}
                keyExtractor={(item, index) => `expanded-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleExpandedScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={width}
                snapToAlignment="center"
                initialScrollIndex={expandedImageIndex}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
              />
            )}
          </View>

          {/* Pagination Dots */}
          <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center">
            {listing.images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === expandedImageIndex ? 10 : 8,
                  height: index === expandedImageIndex ? 10 : 8,
                  borderRadius: 5,
                  backgroundColor: index === expandedImageIndex ? '#FFFFFF' : '#FFFFFF60',
                  marginHorizontal: 4,
                  borderWidth: 2,
                  borderColor: '#1A1A1A',
                }}
              />
            ))}
          </View>
        </View>
      </Modal>

      {/* Expanded Review Image Modal */}
      <Modal
        visible={expandedReviewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedReviewImage(null)}
      >
        <View className="flex-1 bg-brutal/95 items-center justify-center">
          <TouchableOpacity
            onPress={() => setExpandedReviewImage(null)}
            className="absolute top-14 right-4 bg-cosmic w-12 h-12 rounded-full items-center justify-center border-2 border-brutal z-10"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <X size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          {expandedReviewImage && (
            <Image
              source={{ uri: expandedReviewImage }}
              style={{ width: width - 32, height: height * 0.7 }}
              resizeMode="contain"
              className="rounded-xl border-4 border-cosmic"
            />
          )}
        </View>
      </Modal>

      {/* Sign Up Modal */}
      <Modal
        visible={showSignupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignupModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 py-8">
            <TouchableOpacity
              onPress={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 w-10 h-10 items-center justify-center"
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>

            <View className="items-center mb-6">
              <View className="bg-blue-100 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Phone size={32} color="#3B82F6" />
              </View>
              <Text className="font-grotesk text-gray-900 text-2xl font-bold text-center mb-2">
                Sign up to contact owner
              </Text>
              <Text className="font-grotesk text-gray-600 text-center text-sm">
                Create an account to view contact details and reach out to property owners
              </Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => {
                  setShowSignupModal(false);
                  router.push('/signup');
                }}
                className="bg-blue-500 rounded-xl py-4 items-center"
              >
                <Text className="font-grotesk text-white text-base font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowSignupModal(false);
                  router.push('/login');
                }}
                className="bg-white border border-gray-300 rounded-xl py-4 items-center"
              >
                <Text className="font-grotesk text-gray-900 text-base font-semibold">
                  Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowSignupModal(false)}
                className="py-3 items-center"
              >
                <Text className="font-grotesk text-gray-500 text-sm">
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

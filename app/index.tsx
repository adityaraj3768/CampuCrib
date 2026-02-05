import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, MapPin, Sparkles, Key, Home } from "lucide-react-native";
import { useApp } from "../src/context/AppContext";
import { BrutalButton } from "../components";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';

const { height } = Dimensions.get("window");
const FOOTER_HEIGHT = 64;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colleges, setSelectedCollege, isLoadingColleges, collegesError, fetchCribsByLocation } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [filteredColleges, setFilteredColleges] = useState(colleges);
  const [isExploring, setIsExploring] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  const descOpacity = useRef(new Animated.Value(0)).current;
  const descTranslateY = useRef(new Animated.Value(30)).current;
  const inputScale = useRef(new Animated.Value(0.95)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const decorOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // 3D Key Float Animation
  const keyFloat = useRef(new Animated.Value(0)).current;
  const keyRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered fade-up animation
    Animated.sequence([
      // Badge and subtitle first
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Then main title
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Then description
      Animated.parallel([
        Animated.timing(descOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(descTranslateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Finally search input with spring
      Animated.parallel([
        Animated.spring(inputScale, {
          toValue: 1,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(decorOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation for the key
    Animated.loop(
      Animated.sequence([
        Animated.timing(keyFloat, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(keyFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle rotation for depth
    Animated.loop(
      Animated.sequence([
        Animated.timing(keyRotate, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(keyRotate, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Sync dropdown visibility with keyboard
  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(keyboardShowEvent, () => {
      setIsFocused(true);
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      setIsFocused(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = colleges.filter(
        (college) =>
          college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (college.nickname && college.nickname.toLowerCase().includes(searchQuery.toLowerCase())),
      );
      setFilteredColleges(filtered);
    } else {
      setFilteredColleges(colleges);
    }
  }, [searchQuery, colleges]);

  const handleCollegeSelect = (college: (typeof colleges)[0]) => {
    setSelectedCollege(college);
    Keyboard.dismiss();
    router.push("/search");
  };

  const handleExplorePress = async () => {
    setIsExploring(true);
    
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to explore nearby cribs. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        setIsExploring(false);
        return;
      }

      // Get current location
      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      console.log(`✅ Location obtained: ${latitude}, ${longitude}`);

      // Fetch cribs near current location
      await fetchCribsByLocation(latitude, longitude);
      
      // Clear selected college and navigate to search screen
      setSelectedCollege(null);
      router.push('/search');
    } catch (error) {
      console.error('❌ Error exploring nearby cribs:', error);
      Alert.alert(
        'Error',
        'Failed to get your location or fetch nearby cribs. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExploring(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* MAIN CONTENT */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View
          className="flex-1 justify-center px-6"
          style={{ paddingBottom: FOOTER_HEIGHT }}
        >
          {/* Floating 3D Key Illustration */}
          {!isFocused && (
            <Animated.View
              style={{
                position: 'absolute',
                top: '15%',
                right: 30,
                opacity: decorOpacity,
                transform: [
                  {
                    translateY: keyFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                  {
                    rotate: keyRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-5deg', '5deg'],
                    }),
                  },
                ],
              }}
            >
              {/* 3D Isometric Key */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 8,
                  transform: [{ rotateX: '45deg' }, { rotateZ: '45deg' }],
                }}
              >
                <Key size={36} color="#3B82F6" strokeWidth={2} />
              </View>
            </Animated.View>
          )}

          {/* Title Section with Staggered Animation */}
          <View className="mb-8">
            {/* Subtitle - animates first */}
            <Animated.View
              style={{
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              }}
              className="flex-row items-center mb-4"
            >
              <View className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center mr-3">
                <Sparkles size={20} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text className="font-grotesk text-gray-600 text-sm">
                Find Your Perfect Stay
              </Text>
            </Animated.View>

            {/* Main Title - animates second */}
            <Animated.View
              style={{
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              }}
            >
              <Text className="font-grotesk text-gray-900 text-4xl font-bold leading-tight mb-4">
                Where do you{"\n"}study?
              </Text>
            </Animated.View>

            {/* Description - animates third */}
            <Animated.View
              style={{
                opacity: descOpacity,
                transform: [{ translateY: descTranslateY }],
              }}
            >
              <Text className="font-grotesk text-gray-500 text-base leading-relaxed">
                Find your perfect crib near campus.
              </Text>
            </Animated.View>
          </View>

          {/* Search Input */}
          <Animated.View
            style={{
              opacity: inputOpacity,
              transform: [{ scale: inputScale }],
            }}
          >
            <View
              className={`bg-white border ${
                isFocused ? "border-blue-500" : "border-gray-300"
              } rounded-xl flex-row items-center px-4`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isFocused ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: isFocused ? 4 : 2,
              }}
            >
              <Search size={20} color={isFocused ? "#3B82F6" : "#9CA3AF"} strokeWidth={2} />
              <TextInput
                className="flex-1 font-grotesk text-gray-900 text-base py-4 px-3"
                placeholder="IIT Delhi, VIT, BITS..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <View className="bg-gray-200 w-6 h-6 rounded-full items-center justify-center">
                    <Text className="text-gray-600 font-medium text-lg">×</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Results */}
          {isFocused && (
            <View
              className="bg-white border border-gray-200 rounded-xl mt-4 max-h-64 overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {isLoadingColleges ? (
                <View className="py-8 items-center">
                  <Text className="font-grotesk text-gray-600">Loading colleges...</Text>
                </View>
              ) : collegesError ? (
                <View className="py-8 px-4 items-center">
                  <Text className="font-grotesk text-red-500 text-center mb-2">Failed to load colleges</Text>
                  <Text className="font-grotesk text-gray-500 text-xs text-center">{collegesError}</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredColleges}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handleCollegeSelect(item)}
                    className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 ${
                      index !== filteredColleges.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <View className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center mr-3">
                      <MapPin size={18} color="#FFFFFF" strokeWidth={2} />
                    </View>

                    <View className="flex-1">
                      <Text className="font-grotesk text-gray-900 text-base font-medium">
                        {item.nickname || item.name}
                      </Text>
                      <Text
                        className="font-grotesk text-gray-500 text-sm"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <View className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center">
                      <Text className="text-gray-600 text-base">→</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View className="p-6 items-center">
                    <Text className="font-grotesk text-gray-500 text-center">
                      No colleges found.{"\n"}Try a different search.
                    </Text>
                  </View>
                }
              />
              )}
            </View>
          )}

          {/* Explore Button with Hover Effect */}
          {!isFocused && (
            <Animated.View style={{ opacity: decorOpacity }} className="mt-8">
              <Animated.View
                style={{
                  transform: [{ scale: buttonScale }],
                }}
              >
                <TouchableOpacity
                  onPress={handleExplorePress}
                  disabled={isExploring}
                  onPressIn={() => {
                    Animated.spring(buttonScale, {
                      toValue: 1.05,
                      friction: 5,
                      tension: 40,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.spring(buttonScale, {
                      toValue: 1,
                      friction: 5,
                      tension: 40,
                      useNativeDriver: true,
                    }).start();
                  }}
                  className="bg-blue-500 rounded-xl py-4 items-center justify-center"
                  style={{
                    shadowColor: "#3B82F6",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 8,
                    opacity: isExploring ? 0.6 : 1,
                  }}
                >
                  <Text className="font-grotesk text-white text-base font-semibold">
                    {isExploring ? "Getting your location..." : "Explore nearby properties"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* FOOTER (FIXED) */}
      <Animated.View
        style={{ opacity: decorOpacity, height: FOOTER_HEIGHT }}
        className="items-center justify-center"
      >
        <View className="flex-row items-center">
          <Text className="font-grotesk text-gray-400 text-xs text-center">
            CampusCrib
          </Text>
          <Text className="text-gray-400 mx-1">•</Text>
          <Home size={14} color="#3B82F6" strokeWidth={2} />
          <Text className="font-grotesk text-gray-400 text-xs text-center ml-1">
            Find your place
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

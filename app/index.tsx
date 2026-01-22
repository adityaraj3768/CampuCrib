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
} from "react-native";
import { useRouter } from "expo-router";
import { Search, MapPin, Sparkles } from "lucide-react-native";
import { useApp } from "../src/context/AppContext";
import { BrutalButton } from "../components";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const { colleges, setSelectedCollege } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [filteredColleges, setFilteredColleges] = useState(colleges);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const inputScale = useRef(new Animated.Value(0.9)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const decorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(inputScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(decorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = colleges.filter(
        (college) =>
          college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          college.nickname.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <SafeAreaView className="flex-1 bg-cosmic">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Decorative Elements */}
        <Animated.View
          style={{ opacity: decorOpacity }}
          className="absolute top-20 left-6"
        >
          <View className="bg-lime w-16 h-16 rounded-full border-2 border-brutal" />
        </Animated.View>
        <Animated.View
          style={{ opacity: decorOpacity }}
          className="absolute top-32 right-10"
        >
          <View className="bg-violet w-12 h-12 rounded-lg border-2 border-brutal rotate-12" />
        </Animated.View>
        <Animated.View
          style={{ opacity: decorOpacity }}
          className="absolute bottom-40 left-10"
        >
          <View className="bg-orange w-20 h-8 rounded-full border-2 border-brutal -rotate-6" />
        </Animated.View>

        <View className="flex-1 justify-center px-6">
          {/* Title */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
            className="mb-8"
          >
            <View className="flex-row items-center mb-2">
              <Sparkles size={28} color="#FF4D00" />
              <Text className="font-mono text-orange text-sm ml-2 uppercase tracking-widest">
                find your crib
              </Text>
            </View>
            <Text className="font-grotesk text-brutal text-5xl leading-tight">
              WHERE DO{"\n"}YOU STUDY?
            </Text>
            <Text className="font-mono text-brutal/60 text-base mt-4">
              Search by college, not city.{"\n"}Because you're not a tourist.
            </Text>
          </Animated.View>

          {/* Search Input */}
          <Animated.View
            style={{
              opacity: inputOpacity,
              transform: [{ scale: inputScale }],
            }}
          >
            <View
              className={`bg-cosmic border-3 ${
                isFocused ? "border-orange" : "border-brutal"
              } rounded-2xl flex-row items-center px-4`}
              style={{
                borderWidth: 3,
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 6, height: 6 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 6,
              }}
            >
              <Search size={24} color={isFocused ? "#FF4D00" : "#1A1A1A"} />
              <TextInput
                className="flex-1 font-groteskMedium text-brutal text-lg py-5 px-3"
                placeholder="IIT Delhi, VIT, BITS..."
                placeholderTextColor="#1A1A1A80"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <View className="bg-brutal w-6 h-6 rounded-full items-center justify-center">
                    <Text className="text-cosmic font-bold">×</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Results List */}
          {isFocused && (
            <View
              className="bg-cosmic border-2 border-brutal rounded-2xl mt-4 max-h-64 overflow-hidden"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <FlatList
                data={filteredColleges}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handleCollegeSelect(item)}
                    className={`flex-row items-center px-4 py-4 ${
                      index !== filteredColleges.length - 1
                        ? "border-b-2 border-brutal/20"
                        : ""
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="bg-lime w-10 h-10 rounded-lg border-2 border-brutal items-center justify-center mr-3">
                      <MapPin size={18} color="#1A1A1A" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-grotesk text-brutal text-base">
                        {item.nickname}
                      </Text>
                      <Text
                        className="font-mono text-brutal/60 text-xs"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View className="bg-orange px-2 py-1 rounded">
                      <Text className="font-mono text-cosmic text-xs">→</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View className="p-6 items-center">
                    <Text className="font-mono text-brutal/60 text-center">
                      No colleges found.{"\n"}Try a different search.
                    </Text>
                  </View>
                }
              />
            </View>
          )}

          {/* Skip Button */}
          {!isFocused && (
            <Animated.View style={{ opacity: decorOpacity }} className="mt-8">
              <BrutalButton
                title="EXPLORE ALL CRIBS →"
                variant="dark"
                size="lg"
                onPress={() => {
                  setSelectedCollege(colleges[0]);
                  router.push("/search");
                }}
              />
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <Animated.View
          style={{ opacity: decorOpacity }}
          className="px-6 pb-8 items-center"
        >
          <Text className="font-mono text-brutal/40 text-xs text-center">
            🏠 CampusCrib • Made for students, by students
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

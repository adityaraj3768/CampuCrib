import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  MapPin,
  IndianRupee,
  Users,
  Home,
  Check,
  Camera,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import { BrutalButton } from "../../components";

type Step = 1 | 2 | 3 | 4;

export default function PostListingScreen() {
  const router = useRouter();
  const { colleges, user } = useApp();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    collegeId: "",
    rent: "",
    housingType: "" as "pg" | "flat" | "",
    genderType: "" as "boys" | "girls" | "co-ed" | "",
    title: "",
    amenities: [] as string[],
  });

  const steps = [
    { num: 1, title: "Location", icon: MapPin, emoji: "📍" },
    { num: 2, title: "Price", icon: IndianRupee, emoji: "💰" },
    { num: 3, title: "Type", icon: Home, emoji: "🏠" },
    { num: 4, title: "Details", icon: Camera, emoji: "📸" },
  ];

  const amenityOptions = [
    { id: "wifi", label: "WiFi", emoji: "📶" },
    { id: "ac", label: "AC", emoji: "❄️" },
    { id: "food", label: "Food", emoji: "🍽️" },
    { id: "laundry", label: "Laundry", emoji: "🧺" },
    { id: "parking", label: "Parking", emoji: "🚗" },
    { id: "gym", label: "Gym", emoji: "💪" },
    { id: "tv", label: "TV", emoji: "📺" },
    { id: "geyser", label: "Geyser", emoji: "🚿" },
  ];

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.collegeId !== "";
      case 2:
        return formData.rent !== "" && parseInt(formData.rent) > 0;
      case 3:
        return formData.housingType !== "" && formData.genderType !== "";
      case 4:
        return formData.title !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      // Submit
      console.log("Form submitted:", formData);
      router.push("/search");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text className="font-grotesk text-brutal text-3xl mb-2">
              Where is your crib? 📍
            </Text>
            <Text className="font-mono text-brutal/60 text-base mb-6">
              Select the college it's near
            </Text>

            <ScrollView className="max-h-96">
              {colleges.map((college) => (
                <TouchableOpacity
                  key={college.id}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, collegeId: college.id }))
                  }
                  className={`border-2 border-brutal rounded-xl p-4 mb-3 flex-row items-center ${
                    formData.collegeId === college.id ? "bg-lime" : "bg-cosmic"
                  }`}
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 3, height: 3 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <View className="bg-orange w-12 h-12 rounded-xl items-center justify-center border-2 border-brutal mr-3">
                    <Text className="text-xl">🎓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-grotesk text-brutal text-lg">
                      {college.nickname}
                    </Text>
                    <Text className="font-mono text-brutal/60 text-xs">
                      {college.name}
                    </Text>
                  </View>
                  {formData.collegeId === college.id && (
                    <View className="bg-brutal w-8 h-8 rounded-full items-center justify-center">
                      <Check size={18} color="#CCFF00" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View>
            <Text className="font-grotesk text-brutal text-3xl mb-2">
              How much rent? 💰
            </Text>
            <Text className="font-mono text-brutal/60 text-base mb-6">
              Monthly rent in rupees
            </Text>

            <View
              className="bg-cosmic border-3 border-brutal rounded-2xl flex-row items-center px-4"
              style={{
                borderWidth: 3,
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 6, height: 6 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <Text className="font-grotesk text-brutal text-3xl">₹</Text>
              <TextInput
                className="flex-1 font-grotesk text-brutal text-4xl py-6 px-3"
                placeholder="8500"
                placeholderTextColor="#1A1A1A40"
                value={formData.rent}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    rent: text.replace(/[^0-9]/g, ""),
                  }))
                }
                keyboardType="numeric"
              />
              <Text className="font-mono text-brutal/60 text-base">/month</Text>
            </View>

            <View className="flex-row flex-wrap mt-6">
              {[5000, 7500, 10000, 15000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, rent: amount.toString() }))
                  }
                  className="bg-violet border-2 border-brutal rounded-xl px-4 py-2 mr-2 mb-2"
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text className="font-mono text-brutal">
                    ₹{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View>
            <Text className="font-grotesk text-brutal text-3xl mb-2">
              What type? 🏠
            </Text>
            <Text className="font-mono text-brutal/60 text-base mb-6">
              Help students find the right fit
            </Text>

            <Text className="font-mono text-brutal text-sm uppercase mb-3">
              Housing Type
            </Text>
            <View className="flex-row mb-6">
              {[
                { id: "pg", label: "PG", emoji: "🏢" },
                { id: "flat", label: "Flat", emoji: "🏠" },
              ].map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      housingType: type.id as "pg" | "flat",
                    }))
                  }
                  className={`flex-1 border-2 border-brutal rounded-xl p-4 items-center ${
                    formData.housingType === type.id ? "bg-orange" : "bg-cosmic"
                  } ${type.id === "pg" ? "mr-2" : "ml-2"}`}
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 3, height: 3 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text className="text-3xl mb-2">{type.emoji}</Text>
                  <Text
                    className={`font-grotesk text-lg ${
                      formData.housingType === type.id
                        ? "text-cosmic"
                        : "text-brutal"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-mono text-brutal text-sm uppercase mb-3">
              Who can stay?
            </Text>
            <View className="flex-row">
              {[
                { id: "boys", label: "Boys", emoji: "👦", color: "bg-blue-400" },
                { id: "girls", label: "Girls", emoji: "👧", color: "bg-pink-400" },
                { id: "co-ed", label: "Co-ed", emoji: "👥", color: "bg-violet" },
              ].map((type, index) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      genderType: type.id as "boys" | "girls" | "co-ed",
                    }))
                  }
                  className={`flex-1 border-2 border-brutal rounded-xl p-3 items-center ${
                    formData.genderType === type.id ? type.color : "bg-cosmic"
                  } ${index === 0 ? "mr-1" : index === 2 ? "ml-1" : "mx-1"}`}
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text className="text-2xl mb-1">{type.emoji}</Text>
                  <Text className="font-mono text-brutal text-sm">
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View>
            <Text className="font-grotesk text-brutal text-3xl mb-2">
              Final touches 📸
            </Text>
            <Text className="font-mono text-brutal/60 text-base mb-6">
              Add a catchy title & amenities
            </Text>

            <Text className="font-mono text-brutal text-sm uppercase mb-2">
              Listing Title
            </Text>
            <View
              className="bg-cosmic border-2 border-brutal rounded-xl mb-6"
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <TextInput
                className="font-grotesk text-brutal text-lg p-4"
                placeholder="Cozy PG near IIT Gate..."
                placeholderTextColor="#1A1A1A40"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, title: text }))
                }
              />
            </View>

            <Text className="font-mono text-brutal text-sm uppercase mb-3">
              Amenities
            </Text>
            <View className="flex-row flex-wrap">
              {amenityOptions.map((amenity) => (
                <TouchableOpacity
                  key={amenity.id}
                  onPress={() => toggleAmenity(amenity.id)}
                  className={`border-2 border-brutal rounded-xl px-3 py-2 mr-2 mb-2 flex-row items-center ${
                    formData.amenities.includes(amenity.id)
                      ? "bg-lime"
                      : "bg-cosmic"
                  }`}
                  style={{
                    shadowColor: "#1A1A1A",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text className="mr-1">{amenity.emoji}</Text>
                  <Text className="font-mono text-brutal text-sm">
                    {amenity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="bg-violet/30 border-2 border-brutal border-dashed rounded-xl p-8 items-center mt-4"
            >
              <Camera size={32} color="#1A1A1A" />
              <Text className="font-grotesk text-brutal text-lg mt-2">
                Add Photos
              </Text>
              <Text className="font-mono text-brutal/60 text-xs mt-1">
                Tap to upload (coming soon)
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cosmic">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b-2 border-brutal">
          <TouchableOpacity
            onPress={() => {
              if (currentStep > 1) {
                setCurrentStep((prev) => (prev - 1) as Step);
              } else {
                router.back();
              }
            }}
            className="bg-brutal w-10 h-10 rounded-xl items-center justify-center"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <ChevronLeft size={24} color="#FFF8E7" />
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text className="font-grotesk text-brutal text-xl">
              Post a Crib 🏠
            </Text>
          </View>
        </View>

        {/* Progress Steps */}
        <View className="px-4 py-4 flex-row items-center justify-between border-b-2 border-brutal">
          {steps.map((step, index) => (
            <View key={step.num} className="items-center">
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center border-2 border-brutal ${
                  currentStep >= step.num ? "bg-lime" : "bg-cosmic"
                }`}
                style={{
                  shadowColor: "#1A1A1A",
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                {currentStep > step.num ? (
                  <Check size={20} color="#1A1A1A" />
                ) : (
                  <Text className="text-xl">{step.emoji}</Text>
                )}
              </View>
              <Text className="font-mono text-brutal text-xs mt-1">
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Step Content */}
        <ScrollView className="flex-1 px-4 py-6">{renderStep()}</ScrollView>

        {/* Next Button */}
        <View className="px-4 py-4 border-t-2 border-brutal">
          <BrutalButton
            title={currentStep === 4 ? "POST CRIB 🚀" : "NEXT →"}
            variant={canProceed() ? "primary" : "secondary"}
            size="lg"
            onPress={handleNext}
            disabled={!canProceed()}
            className="w-full"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

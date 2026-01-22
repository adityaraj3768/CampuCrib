import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ChevronLeft, Filter, SlidersHorizontal } from "lucide-react-native";
import { useApp, Listing } from "../src/context/AppContext";
import { ListingCard, FloatingNav } from "../components";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const MAP_HEIGHT = height * 0.45;

export default function SearchScreen() {
  const router = useRouter();
  const { selectedCollege, getListingsByCollege, colleges, setSelectedCollege } = useApp();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!selectedCollege) {
      setSelectedCollege(colleges[0]);
    }
  }, [selectedCollege, colleges, setSelectedCollege]);

  useEffect(() => {
    if (selectedCollege) {
      const collegeListings = getListingsByCollege(selectedCollege.id);
      setListings(collegeListings);

      mapRef.current?.animateToRegion({
        latitude: selectedCollege.lat,
        longitude: selectedCollege.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [selectedCollege]);

  const filters = [
    { id: "all", label: "All" },
    { id: "pg", label: "PG" },
    { id: "flat", label: "Flat" },
    { id: "boys", label: "👦 Boys" },
    { id: "girls", label: "👧 Girls" },
    { id: "co-ed", label: "👥 Co-ed" },
  ];

  const filteredListings = listings.filter((listing) => {
    if (!activeFilter || activeFilter === "all") return true;
    if (activeFilter === "pg" || activeFilter === "flat") {
      return listing.housing_type === activeFilter;
    }
    return listing.gender_type === activeFilter;
  });

  const handleListingPress = (listing: Listing) => {
    router.push(`/listing/${listing.id}`);
  };

  const handleMarkerPress = (listing: Listing) => {
    router.push(`/listing/${listing.id}`);
  };

  const customMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#FFF8E7" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#1A1A1A" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#E8E0D0" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#D4B3FF" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#CCFF00" }, { lightness: 60 }],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-cosmic" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b-2 border-brutal bg-cosmic z-10">
        <TouchableOpacity
          onPress={() => router.back()}
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
          <Text className="font-mono text-brutal/60 text-xs uppercase">
            Cribs near
          </Text>
          <Text className="font-grotesk text-brutal text-xl" numberOfLines={1}>
            {selectedCollege?.nickname || "Select College"}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-lime w-10 h-10 rounded-xl items-center justify-center border-2 border-brutal"
          style={{
            shadowColor: "#1A1A1A",
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <SlidersHorizontal size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="py-3 border-b-2 border-brutal bg-cosmic">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl mr-2 border-2 border-brutal ${
                activeFilter === filter.id || (!activeFilter && filter.id === "all")
                  ? "bg-orange"
                  : "bg-cosmic"
              }`}
              style={{
                shadowColor: "#1A1A1A",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <Text
                className={`font-mono text-sm font-bold ${
                  activeFilter === filter.id || (!activeFilter && filter.id === "all")
                    ? "text-cosmic"
                    : "text-brutal"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={{ height: MAP_HEIGHT }} className="border-b-4 border-brutal">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          customMapStyle={customMapStyle}
          initialRegion={{
            latitude: selectedCollege?.lat || 28.5459,
            longitude: selectedCollege?.lng || 77.1926,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
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

          {/* Listing Markers */}
          {filteredListings.map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{
                latitude: listing.lat,
                longitude: listing.lng,
              }}
              onPress={() => handleMarkerPress(listing)}
            >
              <View
                className="bg-lime border-2 border-brutal rounded-lg px-2 py-1"
                style={{
                  shadowColor: "#1A1A1A",
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Text className="font-grotesk text-brutal text-sm">
                  ₹{(listing.rent_price / 1000).toFixed(0)}k
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Map Legend */}
        <View className="absolute bottom-4 left-4 bg-cosmic border-2 border-brutal rounded-xl px-3 py-2 flex-row items-center">
          <View className="bg-orange w-4 h-4 rounded-full border border-brutal mr-2" />
          <Text className="font-mono text-brutal text-xs">Your College</Text>
        </View>
      </View>

      {/* Listings Count */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="font-grotesk text-brutal text-lg">
          {filteredListings.length} Cribs Found
        </Text>
        <View className="bg-violet px-3 py-1 rounded-lg border-2 border-brutal">
          <Text className="font-mono text-brutal text-xs">
            swipe →
          </Text>
        </View>
      </View>

      {/* Horizontal Scroll Cards */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 80 }}
        snapToInterval={width * 0.75 + 16}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            price={listing.rent_price}
            genderType={listing.gender_type}
            housingType={listing.housing_type}
            image={listing.images[0]}
            distance={listing.distance}
            onPress={() => handleListingPress(listing)}
          />
        ))}

        {filteredListings.length === 0 && (
          <View className="w-full items-center justify-center py-12">
            <Text className="font-grotesk text-brutal text-xl text-center">
              No cribs found 😢
            </Text>
            <Text className="font-mono text-brutal/60 text-center mt-2">
              Try changing filters
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      <FloatingNav />
    </SafeAreaView>
  );
}

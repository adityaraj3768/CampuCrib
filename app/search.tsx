import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  ChevronLeft,
  SlidersHorizontal,
  Maximize2,
  X,
  Map,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { useApp, Listing } from "../src/context/AppContext";
import { ListingCard, FloatingNav } from "../components";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const MAP_HEIGHT = height * 0.45;

const getApiBaseUrl = () => {
  return "http://192.168.1.48:8080";
};

const API_BASE_URL = getApiBaseUrl();

// --- Enhanced Price Callout Marker Component ---
const CustomMarker = ({
  coordinate,
  price,
  onPress,
}: {
  coordinate: { latitude: number; longitude: number };
  price: string;
  onPress: () => void;
}) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    if (Platform.OS === "android") {
      // 200ms delay allows the view to fully render before "snapping" the image
      const timer = setTimeout(() => {
        setTracksViewChanges(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }} // Bottom center anchor so tail points to exact location
      tracksViewChanges={tracksViewChanges}
    >
      <View 
        style={{ 
          padding: 6, 
          backgroundColor: 'transparent',
          alignItems: 'center',
        }} 
        collapsable={false}
      >
        {/* Price Callout Box */}
        <View
          className="bg-blue-500 rounded-lg px-2.5 py-1.5"
          style={{
            borderWidth: 1,
            borderColor: "#3B82F6",
            elevation: 4,
            shadowColor: "#3B82F6",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            minWidth: 50,
            alignItems: 'center',
          }}
        >
          <Text className="font-grotesk text-white text-xs font-semibold">{price}</Text>
        </View>
        
        {/* Tail/Pointer */}
        <View style={{ 
          width: 0, 
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: '#3B82F6',
          marginTop: -1,
        }} />
        
        {/* Location Pin Dot */}
        <View style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: '#1E40AF',
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
          marginTop: -1,
        }} />
      </View>
    </Marker>
  );
};
// ----------------------------------------------------------

export default function SearchScreen() {
  const router = useRouter();
  const {
    selectedCollege,
    getListingsByCollege,
    colleges,
    setSelectedCollege,
    fetchCribsByCollege,
    fetchedCribs,
    userLocation,
  } = useApp();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [showMapButton, setShowMapButton] = useState(false);
  const [isLoadingCribs, setIsLoadingCribs] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  const mapRef = useRef<MapView>(null);
  const fullScreenMapRef = useRef<MapView>(null);
  const likeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowMapButton(scrollY > MAP_HEIGHT - 50);
  };

  useEffect(() => {
    if (!selectedCollege && fetchedCribs.length === 0) {
      // If no college selected and no fetched cribs, set first college
      setSelectedCollege(colleges[0]);
    }
  }, [selectedCollege, colleges, setSelectedCollege, fetchedCribs]);

  // --- Auto-Zoom Logic ---
  useEffect(() => {
    const loadCribs = async () => {
      // Check if we have cribs from explore mode (user location)
      if (fetchedCribs.length > 0 && !selectedCollege) {
        console.log('📍 Using cribs from explore mode');
        console.log(`📍 User location: ${userLocation?.latitude}, ${userLocation?.longitude}`);
        setListings(fetchedCribs);
        setIsLoadingCribs(false);
        return;
      }
      
      if (selectedCollege) {
        setIsLoadingCribs(true);
        
        try {
          // Fetch cribs from backend using college name
          const fetchedCribs = await fetchCribsByCollege(selectedCollege.name);
          
          if (fetchedCribs.length > 0) {
            console.log(`✅ Loaded ${fetchedCribs.length} cribs from backend`);
            setListings(fetchedCribs);
          } else {
            // Fallback to local data if no cribs found
            console.log('📋 No cribs found from backend, using local data');
            const collegeListings = getListingsByCollege(selectedCollege.id);
            setListings(collegeListings);
          }
        } catch (error) {
          console.error('❌ Error loading cribs:', error);
          // Fallback to local data on error
          const collegeListings = getListingsByCollege(selectedCollege.id);
          setListings(collegeListings);
        } finally {
          setIsLoadingCribs(false);
        }
      }
    };

    loadCribs();
  }, [selectedCollege?.id]); // Only re-run when college ID changes

  // Update listings when fetchedCribs changes (e.g., when reviews are added)
  useEffect(() => {
    if (fetchedCribs.length > 0) {
      setListings(fetchedCribs);
    }
  }, [fetchedCribs]);

  // Auto-zoom map to show all cribs
  useEffect(() => {
    if (listings.length > 0) {
      const allCoordinates = [
        ...(selectedCollege 
          ? [{ latitude: selectedCollege.lat, longitude: selectedCollege.lng }]
          : userLocation 
            ? [userLocation]
            : []
        ),
        ...listings.map((l) => ({ latitude: l.lat, longitude: l.lng })),
      ];

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(allCoordinates, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      }, 500);
    }
  }, [listings, selectedCollege, userLocation]);

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

  const handleLikePress = async (listingId: string, currentLikedState: boolean) => {
    console.log('🔥 Like button pressed:', { listingId, currentLikedState });
    
    // Optimistically update UI immediately
    setListings(prevListings => 
      prevListings.map(listing => 
        listing.id === listingId 
          ? { ...listing, liked: !currentLikedState }
          : listing
      )
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
          Alert.alert('Authentication Required', 'Please log in to add favorites.');
          // Revert optimistic update
          setListings(prevListings => 
            prevListings.map(listing => 
              listing.id === listingId 
                ? { ...listing, liked: currentLikedState }
                : listing
            )
          );
          return;
        }

        // Use DELETE method when removing from favorites (currentLikedState = true)
        // Use POST method when adding to favorites (currentLikedState = false)
        const method = currentLikedState ? 'DELETE' : 'POST';
        console.log(`${method} request to ${API_BASE_URL}/favorites/${listingId}`);

        const response = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
          method: method,
          headers: {
            'Authorization': `${tokenType} ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to update favorite');
        }

        const data = await response.json();
        console.log('Favorite updated:', data.message);
      } catch (error: any) {
        console.error('Error updating favorite:', error);
        Alert.alert('Error', 'Failed to update favorite. Please try again.');
        // Revert optimistic update on error
        setListings(prevListings => 
          prevListings.map(listing => 
            listing.id === listingId 
              ? { ...listing, liked: currentLikedState }
              : listing
          )
        );
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

  const customMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#F9FAFB" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E5E7EB" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#DBEAFE" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#D1FAE5" }] },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200 bg-white z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white w-10 h-10 rounded-full items-center justify-center"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
        >
          <ChevronLeft size={20} color="#000" />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
          <Text className="font-grotesk text-gray-500 text-xs">
            {selectedCollege ? "Cribs near" : "Nearby Cribs"}
          </Text>
          <Text className="font-grotesk text-gray-900 text-lg font-medium" numberOfLines={1}>
            {selectedCollege?.nickname || "Your Location"}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-white w-10 h-10 rounded-full items-center justify-center"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
        >
          <SlidersHorizontal size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="py-3 border-b border-gray-200 bg-white">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeFilter === filter.id || (!activeFilter && filter.id === "all") ? "bg-blue-500" : "bg-gray-100"
              }`}
            >
              <Text className={`font-grotesk text-sm ${activeFilter === filter.id || (!activeFilter && filter.id === "all") ? "text-white" : "text-gray-700"}`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List & Map Header */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={isScrollEnabled}
        ListHeaderComponent={
          <>
            <View 
              style={{ height: MAP_HEIGHT }} 
              className="border-b border-gray-200"
              onStartShouldSetResponder={() => {
                setIsScrollEnabled(false);
                return false;
              }}
              onResponderRelease={() => {
                setTimeout(() => setIsScrollEnabled(true), 100);
              }}
            >
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                customMapStyle={customMapStyle}
                initialRegion={{
                  latitude: selectedCollege?.lat || 28.5459,
                  longitude: selectedCollege?.lng || 77.1926,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={Platform.OS === "android"}
                loadingEnabled={true}
                loadingIndicatorColor="#3B82F6"
                loadingBackgroundColor="#FFFFFF"
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={true}
                pitchEnabled={true}
                onTouchStart={() => setIsScrollEnabled(false)}
                onTouchEnd={() => setTimeout(() => setIsScrollEnabled(true), 100)}
              >
                {selectedCollege ? (
                  <Marker
                    coordinate={{ latitude: selectedCollege.lat, longitude: selectedCollege.lng }}
                    title={selectedCollege.nickname}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={Platform.OS === "android"}
                  >
                    <View style={{ padding: 4 }} collapsable={false}>
                      <View className="bg-blue-500 rounded-full p-2" style={{ borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                        <Text style={{ fontSize: 18 }}>🎓</Text>
                      </View>
                    </View>
                  </Marker>
                ) : userLocation && (
                  <Marker
                    coordinate={userLocation}
                    title="Your Location"
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={Platform.OS === "android"}
                  >
                    <View style={{ padding: 2 }} collapsable={false}>
                      <View className="bg-blue-500 rounded-full p-1" style={{ borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                        <Text style={{ fontSize: 12 }}>📍</Text>
                      </View>
                    </View>
                  </Marker>
                )}

                {/* Listing Markers using Custom Component */}
                {filteredListings.map((listing) => (
                  <CustomMarker
                    key={listing.id}
                    coordinate={{ latitude: listing.lat, longitude: listing.lng }}
                    price={`₹${listing.rent_price.toLocaleString()}`}
                    onPress={() => handleMarkerPress(listing)}
                  />
                ))}
              </MapView>

              <View className="absolute bottom-4 left-4 bg-white/95 rounded-lg px-3 py-2 flex-row items-center"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              >
                <View className="bg-blue-500 w-3 h-3 rounded-full mr-2" />
                <Text className="font-grotesk text-gray-700 text-xs">{selectedCollege ? 'College' : 'You'}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsMapFullScreen(true)}
                className="absolute bottom-4 right-4 bg-white/95 w-10 h-10 rounded-lg items-center justify-center"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              >
                <Maximize2 size={18} color="#000" />
              </TouchableOpacity>
            </View>

            <View className="px-4 py-4 flex-row items-center justify-between bg-white">
              <Text className="font-grotesk text-gray-900 text-lg font-medium">{filteredListings.length} properties</Text>
              <View className="bg-gray-100 px-3 py-1.5 rounded-lg">
                <Text className="font-grotesk text-gray-600 text-xs">Scroll to view</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item: listing }) => (
          <View style={{ paddingHorizontal: 16 }}>
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
              onPress={() => handleListingPress(listing)}
              onLikePress={() => handleLikePress(listing.id, listing.liked || false)}
              isVertical
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="w-full items-center justify-center py-12">
            {isLoadingCribs ? (
              <>
                <Text className="font-grotesk text-gray-900 text-lg text-center">Loading properties...</Text>
                <Text className="font-grotesk text-gray-500 text-center mt-2">Finding the best places near you</Text>
              </>
            ) : (
              <>
                <Text className="font-grotesk text-gray-900 text-lg text-center">No properties found</Text>
                <Text className="font-grotesk text-gray-500 text-center mt-2">Try changing filters</Text>
              </>
            )}
          </View>
        }
      />

      {/* Full Screen Modal */}
      <Modal visible={isMapFullScreen} animationType="slide" onRequestClose={() => setIsMapFullScreen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200 bg-white" style={{ zIndex: 100 }}>
            <TouchableOpacity
              onPress={() => setIsMapFullScreen(false)}
              className="bg-white w-10 h-10 rounded-full items-center justify-center"
              style={{ zIndex: 101, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
            >
              <X size={20} color="#000" />
            </TouchableOpacity>
            <View className="flex-1 mx-4">
              <Text className="font-grotesk text-gray-500 text-xs">Map View</Text>
              <Text className="font-grotesk text-gray-900 text-lg font-medium" numberOfLines={1}>{selectedCollege?.nickname || "Nearby Properties"}</Text>
            </View>
          </View>

          <View className="flex-1">
            <MapView
              ref={fullScreenMapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              customMapStyle={customMapStyle}
              initialRegion={{
                latitude: selectedCollege?.lat || 28.5459,
                longitude: selectedCollege?.lng || 77.1926,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={Platform.OS === "android"}
              loadingEnabled={true}
              loadingIndicatorColor="#3B82F6"
              loadingBackgroundColor="#FFFFFF"
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={true}
              onMapReady={() => {
                 if (selectedCollege && listings.length > 0) {
                    const allCoords = [
                        { latitude: selectedCollege.lat, longitude: selectedCollege.lng },
                        ...listings.map(l => ({ latitude: l.lat, longitude: l.lng }))
                    ];
                    fullScreenMapRef.current?.fitToCoordinates(allCoords, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true
                    });
                 }
              }}
            >
              {selectedCollege && (
                <Marker
                  coordinate={{ latitude: selectedCollege.lat, longitude: selectedCollege.lng }}
                  title={selectedCollege.nickname}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={Platform.OS === "android"}
                >
                  <View style={{ padding: 4 }} collapsable={false}>
                    <View className="bg-blue-500 rounded-full p-2" style={{ borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                      <Text style={{ fontSize: 18 }}>🎓</Text>
                    </View>
                  </View>
                </Marker>
              )}
              {filteredListings.map((listing) => (
                <CustomMarker
                  key={listing.id}
                  coordinate={{ latitude: listing.lat, longitude: listing.lng }}
                  price={`₹${listing.rent_price.toLocaleString()}`}
                  onPress={() => { setIsMapFullScreen(false); handleMarkerPress(listing); }}
                />
              ))}
            </MapView>
            
            <View className="absolute bottom-6 left-4 bg-white/95 rounded-lg px-3 py-2 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              <View className="bg-blue-500 w-3 h-3 rounded-full mr-2" />
              <Text className="font-grotesk text-gray-700 text-xs">{selectedCollege ? 'College' : 'You'}</Text>
            </View>
            <View className="absolute bottom-6 right-4 bg-white/95 rounded-lg px-3 py-2"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              <Text className="font-grotesk text-gray-900 text-sm font-medium">{filteredListings.length} properties</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {showMapButton && (
        <TouchableOpacity
          onPress={() => setIsMapFullScreen(true)}
          className="absolute bg-blue-500 flex-row items-center px-4 py-3 rounded-full z-20"
          style={{ bottom: 100, left: width / 2 - 60, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 }}
        >
          <Map size={16} color="#FFFFFF" />
          <Text className="font-grotesk text-white text-sm ml-2">View Map</Text>
        </TouchableOpacity>
      )}

      <FloatingNav />
    </SafeAreaView>
  );
}
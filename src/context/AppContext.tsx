import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export interface College {
  id: string;
  name: string;
  nickname?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Listing {
  id: string;
  owner_id?: string;
  college_id?: string;
  rent_price: number;
  gender_type: "boys" | "girls" | "co-ed";
  housing_type: "pg" | "flat";
  lat: number;
  lng: number;
  status: "active" | "inactive" | "approved";
  title: string;
  images: string[];
  owner_phone?: string;
  owner_name?: string;
  distance?: number;
  electricityMode?: string;
  electricityFee?: number;
  rating?: number;
  reviews?: Array<{
    id: number;
    userId: string;
    userName: string;
    reviewText: string;
    rating: number;
    createdAt: string;
  }>;
  liked?: boolean;
}

export interface Amenity {
  id: string;
  listing_id: string;
  type: "wifi" | "ac" | "food" | "laundry" | "parking" | "gym" | "tv" | "geyser";
}

interface AppContextType {
  selectedCollege: College | null;
  setSelectedCollege: (college: College | null) => void;
  colleges: College[];
  listings: Listing[];
  fetchedCribs: Listing[];
  userLocation: { latitude: number; longitude: number } | null;
  amenities: Amenity[];
  user: { id: string; phone: string; role: string } | null;
  setUser: (user: { id: string; phone: string; role: string } | null) => void;
  getListingsByCollege: (collegeId: string) => Listing[];
  fetchCribsByCollege: (collegeName: string) => Promise<Listing[]>;
  fetchCribsByLocation: (latitude: number, longitude: number) => Promise<Listing[]>;
  getAmenitiesByListing: (listingId: string) => Amenity[];
  getListingById: (id: string) => Listing | undefined;
  updateListingReviews: (listingId: string, newReview: any) => void;
  addToFetchedCribs: (newListings: Listing[]) => void;
  isLoadingColleges: boolean;
  collegesError: string | null;
}

const mockColleges: College[] = [
  { id: "1", name: "Indian Institute of Technology Delhi", nickname: "IIT Delhi", lat: 28.5459, lng: 77.1926 },
  { id: "2", name: "Delhi University North Campus", nickname: "DU North", lat: 28.6856, lng: 77.2096 },
  { id: "3", name: "Jawaharlal Nehru University", nickname: "JNU", lat: 28.5406, lng: 77.1675 },
  { id: "4", name: "BITS Pilani", nickname: "BITS", lat: 28.3643, lng: 75.5870 },
  { id: "5", name: "VIT Vellore", nickname: "VIT", lat: 12.9692, lng: 79.1559 },
  { id: "6", name: "IIT Bombay", nickname: "IITB", lat: 19.1334, lng: 72.9133 },
  { id: "7", name: "IIIT Hyderabad", nickname: "IIITH", lat: 17.4455, lng: 78.3489 },
  { id: "8", name: "NIT Trichy", nickname: "NITT", lat: 10.7591, lng: 78.8140 },
];

const mockListings: Listing[] = [
  {
    id: "1",
    owner_id: "o1",
    college_id: "1",
    rent_price: 8500,
    gender_type: "boys",
    housing_type: "pg",
    lat: 28.5479,
    lng: 77.1946,
    status: "active",
    title: "Cozy PG near IIT Gate",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    ],
    owner_phone: "+919876543210",
    owner_name: "Rajesh Kumar",
  },
  {
    id: "2",
    owner_id: "o2",
    college_id: "1",
    rent_price: 12000,
    gender_type: "co-ed",
    housing_type: "flat",
    lat: 28.5439,
    lng: 77.1906,
    status: "active",
    title: "Modern 2BHK Flat Share",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=400",
    ],
    owner_phone: "+919876543211",
    owner_name: "Priya Sharma",
  },
  {
    id: "3",
    owner_id: "o3",
    college_id: "2",
    rent_price: 6500,
    gender_type: "girls",
    housing_type: "pg",
    lat: 28.6876,
    lng: 77.2116,
    status: "active",
    title: "Girls PG with Homely Food",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    ],
    owner_phone: "+919876543212",
    owner_name: "Sunita Verma",
  },
  {
    id: "4",
    owner_id: "o4",
    college_id: "2",
    rent_price: 9000,
    gender_type: "boys",
    housing_type: "pg",
    lat: 28.6836,
    lng: 77.2076,
    status: "active",
    title: "Premium Boys PG - AC Rooms",
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400",
    ],
    owner_phone: "+919876543213",
    owner_name: "Amit Singh",
  },
  {
    id: "5",
    owner_id: "o5",
    college_id: "3",
    rent_price: 7500,
    gender_type: "co-ed",
    housing_type: "flat",
    lat: 28.5426,
    lng: 77.1695,
    status: "active",
    title: "Peaceful Flat near JNU",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    ],
    owner_phone: "+919876543214",
    owner_name: "Neha Gupta",
  },
];

const mockAmenities: Amenity[] = [
  { id: "a1", listing_id: "1", type: "wifi" },
  { id: "a2", listing_id: "1", type: "food" },
  { id: "a3", listing_id: "1", type: "laundry" },
  { id: "a4", listing_id: "2", type: "wifi" },
  { id: "a5", listing_id: "2", type: "ac" },
  { id: "a6", listing_id: "2", type: "parking" },
  { id: "a7", listing_id: "2", type: "gym" },
  { id: "a8", listing_id: "3", type: "wifi" },
  { id: "a9", listing_id: "3", type: "food" },
  { id: "a10", listing_id: "3", type: "geyser" },
  { id: "a11", listing_id: "4", type: "wifi" },
  { id: "a12", listing_id: "4", type: "ac" },
  { id: "a13", listing_id: "4", type: "food" },
  { id: "a14", listing_id: "4", type: "tv" },
  { id: "a15", listing_id: "5", type: "wifi" },
  { id: "a16", listing_id: "5", type: "parking" },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [user, setUser] = useState<{ id: string; phone: string; role: string } | null>(null);
  const [colleges, setColleges] = useState<College[]>(mockColleges);
  const [isLoadingColleges, setIsLoadingColleges] = useState<boolean>(false);
  const [collegesError, setCollegesError] = useState<string | null>(null);
  const [fetchedCribs, setFetchedCribs] = useState<Listing[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Load user data from AsyncStorage on app initialization
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setUser({
            id: userInfo.userId || userInfo.id,
            phone: userInfo.userId || userInfo.phone,
            role: userInfo.role,
          });
          console.log('✅ User loaded from storage:', userInfo.name, userInfo.role);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      }
    };

    loadUserFromStorage();
  }, []);

  // Fetch colleges from backend
  useEffect(() => {
    const fetchColleges = async () => {
      setIsLoadingColleges(true);
      setCollegesError(null);
      
      const apiUrl = `${API_BASE_URL}/colleges`;
      console.log(`🔍 Attempting to fetch colleges from: ${apiUrl}`);
      console.log(`📱 Platform: ${Platform.OS}`);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Successfully fetched ${data.length} colleges`);
        
        // Map backend response to our College interface
        const mappedColleges: College[] = data.map((college: any) => ({
          id: college.id.toString(),
          name: college.name,
          nickname: college.name, // Use name as nickname if not provided
          lat: college.latitude,
          lng: college.longitude,
          address: college.address,
        }));
        
        setColleges(mappedColleges);
      } catch (error) {
        console.error('❌ Error fetching colleges:', error);
        console.log('💡 Troubleshooting tips:');
        console.log('  1. Make sure your backend server is running on port 8080');
        console.log('  2. If using a physical device, update API_BASE_URL with your computer\'s IP address');
        console.log(`  3. Current API URL: ${apiUrl}`);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch colleges';
        setCollegesError(errorMessage);
        // Keep using mock data if fetch fails
        setColleges(mockColleges);
        console.log('📋 Using mock data as fallback');
      } finally {
        setIsLoadingColleges(false);
      }
    };

    fetchColleges();
  }, []);

  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getListingsByCollege = (collegeId: string): Listing[] => {
    const college = colleges.find((c) => c.id === collegeId);
    if (!college) return [];

    return mockListings
      .filter((l) => l.college_id === collegeId && l.status === "active")
      .map((listing) => ({
        ...listing,
        distance: haversineDistance(college.lat, college.lng, listing.lat, listing.lng),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const fetchCribsByCollege = async (collegeName: string): Promise<Listing[]> => {
    const apiUrl = `${API_BASE_URL}/cribs/search/nearby?collegeName=${encodeURIComponent(collegeName)}`;
    console.log(`🔍 Fetching cribs for college: ${collegeName}`);
    console.log(`📍 API URL: ${apiUrl}`);

    try {
      // Get auth token (even if user is not logged in - can be null)
      const token = await SecureStore.getItemAsync('authToken');
      const tokenType = await SecureStore.getItemAsync('tokenType');
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header even if token is null
      if (token && tokenType) {
        headers['Authorization'] = `${tokenType} ${token}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length} cribs`);

      // Map backend response to our Listing interface
      const mappedListings: Listing[] = data.map((crib: any) => ({
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
        liked: crib.liked || false,
      }));

      // Store fetched cribs in context state
      setFetchedCribs(mappedListings);
      return mappedListings;
    } catch (error) {
      console.error('❌ Error fetching cribs:', error);
      console.log('📋 Using mock data as fallback');
      // Return empty array on error
      return [];
    }
  };

  const fetchCribsByLocation = async (latitude: number, longitude: number): Promise<Listing[]> => {
    const apiUrl = `${API_BASE_URL}/cribs/search/explore?latitude=${latitude}&longitude=${longitude}`;
    console.log(`🔍 Fetching cribs near location: ${latitude}, ${longitude}`);
    console.log(`📍 API URL: ${apiUrl}`);

    try {
      // Get auth token (even if user is not logged in - can be null)
      const token = await SecureStore.getItemAsync('authToken');
      const tokenType = await SecureStore.getItemAsync('tokenType');
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header even if token is null
      if (token && tokenType) {
        headers['Authorization'] = `${tokenType} ${token}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length} cribs near your location`);

      // Map backend response to our Listing interface
      const mappedListings: Listing[] = data.map((crib: any) => ({
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
        liked: crib.liked || false,
      }));

      // Store the actual user location and fetched cribs
      setUserLocation({ latitude, longitude });
      setFetchedCribs(mappedListings);
      return mappedListings;
    } catch (error) {
      console.error('❌ Error fetching cribs by location:', error);
      throw error; // Re-throw to handle in UI
    }
  };

  const getAmenitiesByListing = (listingId: string): Amenity[] => {
    return mockAmenities.filter((a) => a.listing_id === listingId);
  };

  const getListingById = (id: string): Listing | undefined => {
    // First check in fetched cribs from backend
    const fetchedListing = fetchedCribs.find((l) => l.id === id);
    if (fetchedListing) return fetchedListing;
    
    // Fallback to mock listings
    return mockListings.find((l) => l.id === id);
  };

  const updateListingReviews = (listingId: string, newReview: any) => {
    setFetchedCribs((prevCribs) => 
      prevCribs.map((listing) => {
        if (listing.id === listingId) {
          const updatedReviews = listing.reviews ? [newReview, ...listing.reviews] : [newReview];
          const avgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
          return {
            ...listing,
            reviews: updatedReviews,
            rating: avgRating,
          };
        }
        return listing;
      })
    );
  };

  const addToFetchedCribs = (newListings: Listing[]) => {
    setFetchedCribs((prevCribs) => {
      // Create a map of existing cribs by ID for quick lookup
      const existingIds = new Set(prevCribs.map(c => c.id));
      // Add only new listings that don't already exist
      const uniqueNewListings = newListings.filter(l => !existingIds.has(l.id));
      // Merge with existing cribs
      return [...prevCribs, ...uniqueNewListings];
    });
  };

  return (
    <AppContext.Provider
      value={{
        selectedCollege,
        setSelectedCollege,
        colleges,
        listings: mockListings,
        fetchedCribs,
        userLocation,
        amenities: mockAmenities,
        user,
        setUser,
        getListingsByCollege,
        fetchCribsByCollege,
        fetchCribsByLocation,
        getAmenitiesByListing,
        getListingById,
        updateListingReviews,
        addToFetchedCribs,
        isLoadingColleges,
        collegesError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

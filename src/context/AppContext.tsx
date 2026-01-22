import React, { createContext, useContext, useState, ReactNode } from "react";

export interface College {
  id: string;
  name: string;
  nickname: string;
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  owner_id: string;
  college_id: string;
  rent_price: number;
  gender_type: "boys" | "girls" | "co-ed";
  housing_type: "pg" | "flat";
  lat: number;
  lng: number;
  status: "active" | "inactive";
  title: string;
  images: string[];
  owner_phone: string;
  owner_name: string;
  distance?: number;
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
  amenities: Amenity[];
  user: { id: string; phone: string; role: string } | null;
  setUser: (user: { id: string; phone: string; role: string } | null) => void;
  getListingsByCollege: (collegeId: string) => Listing[];
  getAmenitiesByListing: (listingId: string) => Amenity[];
  getListingById: (id: string) => Listing | undefined;
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
    const college = mockColleges.find((c) => c.id === collegeId);
    if (!college) return [];

    return mockListings
      .filter((l) => l.college_id === collegeId && l.status === "active")
      .map((listing) => ({
        ...listing,
        distance: haversineDistance(college.lat, college.lng, listing.lat, listing.lng),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const getAmenitiesByListing = (listingId: string): Amenity[] => {
    return mockAmenities.filter((a) => a.listing_id === listingId);
  };

  const getListingById = (id: string): Listing | undefined => {
    return mockListings.find((l) => l.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        selectedCollege,
        setSelectedCollege,
        colleges: mockColleges,
        listings: mockListings,
        amenities: mockAmenities,
        user,
        setUser,
        getListingsByCollege,
        getAmenitiesByListing,
        getListingById,
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

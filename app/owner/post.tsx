import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Image,
  Alert,
  Linking,
  InteractionManager,
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
  ImageIcon,
  X,
  Navigation,
  Map,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import { BrutalButton } from "../../components";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  return "http://192.168.1.48:8080";
};

const API_BASE_URL = getApiBaseUrl();

type Step = 1 | 2 | 3 | 4;

export default function PostListingScreen() {
  const router = useRouter();
  const { colleges, user } = useApp();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Cloudinary URLs
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [formData, setFormData] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    rent: "",
    electricityRate: "",
    electricityMode: "INCLUDED" as "INCLUDED" | "NOT_INCLUDED",
    housingType: "" as "pg" | "flat" | "",
    genderType: "" as "boys" | "girls" | "co-ed" | "",
    title: "",
    imageUrls: [] as string[], // Cloudinary URLs
  });

  const steps = [
    { num: 1, title: "Type", icon: Home, emoji: "🏠" },
    { num: 2, title: "Location", icon: MapPin, emoji: "📍" },
    { num: 3, title: "Details", icon: Camera, emoji: "📸" },
    { num: 4, title: "Price", icon: IndianRupee, emoji: "💰" },
  ];

  // Pulse animation for active step
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, [currentStep]);

  // Cloudinary Configuration
  // TODO: Replace with your actual Cloudinary cloud name and upload preset
  const CLOUDINARY_CLOUD_NAME = "dt2eki9jf"; // e.g., "dmxyz123"
  const CLOUDINARY_UPLOAD_PRESET = "campuscrib_unsigned"; // e.g., "campuscrib_unsigned"

  // Helper function to upload a single image to Cloudinary
  const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
    try {
      // Create FormData for the upload
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Append the image file
      formData.append('file', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);
      
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'campuscrib'); // Optional: organize in folders

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload success:', data.secure_url);
      return data.secure_url; // Return the Cloudinary URL
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  // Upload all images to Cloudinary
  const uploadAllImagesToCloudinary = async (): Promise<string[]> => {
    if (images.length === 0) {
      return [];
    }

    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        console.log(`Uploading image ${i + 1}/${images.length}...`);
        
        const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
        uploadedUrls.push(cloudinaryUrl);
        
        // Update progress
        const progress = ((i + 1) / images.length) * 100;
        setUploadProgress(Math.round(progress));
      }

      console.log('All images uploaded:', uploadedUrls);
      setImageUrls(uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      console.error('Failed to upload images:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload images. Please check your internet connection and try again.'
      );
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Location functions
  const requestLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Access Needed",
        "We need location access to pinpoint your property. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(coords);
      setFormData((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));

      Alert.alert("Success", "Current location captured successfully!");
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSelectOnMap = async () => {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    try {
      const location = await Location.getCurrentPositionAsync({});
      setTempLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch {
      // Default to a fallback location if current location fails
      setTempLocation({
        latitude: 28.6139,
        longitude: 77.209,
      });
    }
    setShowMapModal(true);
  };

  const confirmMapLocation = () => {
    if (tempLocation) {
      setSelectedLocation(tempLocation);
      setFormData((prev) => ({
        ...prev,
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      }));
      setShowMapModal(false);
      Alert.alert("Success", "Location selected successfully!");
    }
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access Needed",
        "We need camera access to let you capture your room. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery Access Needed",
        "We need gallery access to let you select photos. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

const handleTakePhoto = async () => {
    console.log('=== Take Photo clicked ===');
    
    // Check if max limit reached
    if (images.length >= 12) {
      Alert.alert('Maximum Photos Reached', 'You can upload a maximum of 12 photos.');
      setShowImageOptions(false);
      return;
    }

    // 1. Close the modal immediately
    setShowImageOptions(false);

    // 2. Use InteractionManager to wait until the modal closing animation is 100% done
    InteractionManager.runAfterInteractions(async () => {
      try {
        // 3. Check permissions
        const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
        
        let finalStatus = existingStatus;
        
        // Only ask if not already determined
        if (existingStatus !== 'granted') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(
            "Permission Required",
            "Please allow camera access in Settings to take photos.",
            [{ text: "OK", onPress: () => Linking.openSettings() }]
          );
          return;
        }

        // 4. Launch Camera (No editing, show full preview)
        setTimeout(async () => {
            try {
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // No auto-crop, show full preview
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    // Show preview with confirm button
                    setPreviewImage(result.assets[0].uri);
                }
            } catch (cameraError) {
                console.error("Camera Launch Error: ", cameraError);
                Alert.alert("Error", "Could not open camera.");
            }
        }, 200);

      } catch (error) {
        console.error('Permission/System Error:', error);
      }
    });
  };

  const handleChooseFromGallery = async () => {
    // Check if max limit reached
    if (images.length >= 12) {
      Alert.alert('Maximum Photos Reached', 'You can upload a maximum of 12 photos.');
      setShowImageOptions(false);
      return;
    }

    setShowImageOptions(false);

    InteractionManager.runAfterInteractions(async () => {
        try {
            const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                Alert.alert("Permission Required", "Please allow photo access.");
                return;
            }

            setTimeout(async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // No auto-crop, show full preview
                    quality: 0.8,
                });

                if (!result.canceled && result.assets) {
                    // Show preview with confirm button
                    setPreviewImage(result.assets[0].uri);
                }
            }, 200);
        } catch (error) {
            console.error('Gallery Error:', error);
        }
    });
  };

  const confirmImage = () => {
    if (previewImage) {
      setImages((prev) => [...prev, previewImage]);
      setPreviewImage(null);
      // Immediately allow adding another photo
      if (images.length + 1 < 12) {
        // Auto-open image options after a short delay
        setTimeout(() => setShowImageOptions(true), 300);
      }
    }
  };

  const cancelPreview = () => {
    setPreviewImage(null);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const viewImageInQueue = (index: number) => {
    setSelectedImageIndex(index);
  };

  const deleteSelectedImage = () => {
    if (selectedImageIndex !== null) {
      removeImage(selectedImageIndex);
      setSelectedImageIndex(null);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Type: Must select housing and gender type
        return formData.housingType !== "" && formData.genderType !== "";
      case 2:
        // Location: Must set location
        return formData.latitude !== null && formData.longitude !== null;
      case 3:
        // Details: Must have title and minimum 5 photos
        return formData.title !== "" && images.length >= 5;
      case 4:
        // Price: Must set rent
        return formData.rent !== "" && parseInt(formData.rent) > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      // Step 4: Final submission
      try {
        // Upload images to Cloudinary first
        const uploadedUrls = await uploadAllImagesToCloudinary();
        
        if (uploadedUrls.length === 0) {
          Alert.alert('Error', 'Please add at least one photo of your property.');
          return;
        }

        // Get auth token
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) {
          Alert.alert('Error', 'Please login to post a property');
          router.push('/profile');
          return;
        }
        
        // Map form data to backend structure
        const backendData = {
          name: formData.title,
          latitude: formData.latitude,
          longitude: formData.longitude,
          gender: formData.genderType.toUpperCase().replace('-', '_'), // boys -> BOYS, co-ed -> CO_ED
          buildingType: formData.housingType.toUpperCase(), // pg -> PG, flat -> FLAT
          electricityMode: formData.electricityRate ? "METERED" : "INCLUDED",
          electricityFee: formData.electricityRate ? parseFloat(formData.electricityRate) : 0,
          price: parseInt(formData.rent),
          mediaUrls: uploadedUrls,
        };

        console.log('Submitting to backend:', backendData);
        
        // Submit to backend API
        const response = await fetch(`${API_BASE_URL}/cribs/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(backendData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Backend response:', result);
        
        Alert.alert(
          'Success! 🎉',
          result.message || 'Your property has been posted successfully and is pending approval!',
          [
            {
              text: 'View My Listings',
              onPress: () => router.push('/owner/my-listings'),
            },
          ]
        );
      } catch (error: any) {
        console.error('Submission error:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to post property. Please try again.'
        );
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // Type (Housing & Gender)
        return (
          <View>
            <Text className="font-grotesk text-gray-900 text-2xl font-bold mb-2">
              Property details
            </Text>
            <Text className="font-grotesk text-gray-500 text-base mb-6">
              Help students find the right fit
            </Text>

            <Text className="font-grotesk text-gray-700 text-sm font-medium mb-3">
              Property Type
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
                  className={`flex-1 border rounded-xl p-3 items-center ${
                    formData.housingType === type.id ? "bg-blue-500 border-blue-500" : "bg-white border-gray-200"
                  } ${type.id === "pg" ? "mr-2" : "ml-2"}`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-2xl mb-1.5">{type.emoji}</Text>
                  <Text
                    className={`font-grotesk text-sm font-medium ${
                      formData.housingType === type.id
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-grotesk text-gray-700 text-sm font-medium mb-3">
              Suitable For
            </Text>
            <View className="flex-row">
              {[
                { id: "boys", label: "Boys", emoji: "👦" },
                { id: "girls", label: "Girls", emoji: "👧" },
                { id: "co-ed", label: "Co-ed", emoji: "👥" },
              ].map((type, index) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      genderType: type.id as "boys" | "girls" | "co-ed",
                    }))
                  }
                  className={`flex-1 border rounded-xl p-2.5 items-center ${
                    formData.genderType === type.id ? "bg-blue-500 border-blue-500" : "bg-white border-gray-200"
                  } ${index === 0 ? "mr-1" : index === 2 ? "ml-1" : "mx-1"}`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-xl mb-0.5">{type.emoji}</Text>
                  <Text className={`font-grotesk text-xs font-medium ${
                    formData.genderType === type.id ? "text-white" : "text-gray-900"
                  }`}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        // Location
        return (
          <View>
            <Text className="font-grotesk text-gray-900 text-2xl font-bold mb-2">
              Where is your property?
            </Text>
            <Text className="font-grotesk text-gray-500 text-base mb-6">
              Choose how to set the location
            </Text>

            {/* Selected Location Display */}
            {selectedLocation && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex-row items-center">
                <View className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center mr-3">
                  <Check size={18} color="#FFFFFF" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="font-grotesk text-emerald-900 text-sm font-semibold mb-0.5">
                    Location Set
                  </Text>
                  <Text className="font-grotesk text-emerald-700 text-xs">
                    Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}

            {/* Use Current Location Button */}
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              disabled={locationLoading}
              className="bg-white border border-gray-200 rounded-xl p-5 mb-4 flex-row items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
                opacity: locationLoading ? 0.6 : 1,
              }}
            >
              <View className="bg-blue-500 w-14 h-14 rounded-full items-center justify-center mr-4">
                <Navigation size={26} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="font-grotesk text-gray-900 text-lg font-semibold mb-1">
                  {locationLoading ? "Getting Location..." : "Use Current Location"}
                </Text>
                <Text className="font-grotesk text-gray-500 text-sm">
                  Automatically detect your GPS position
                </Text>
              </View>
            </TouchableOpacity>

            {/* Select on Map Button */}
            <TouchableOpacity
              onPress={handleSelectOnMap}
              className="bg-white border border-gray-200 rounded-xl p-5 flex-row items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View className="bg-blue-500 w-14 h-14 rounded-full items-center justify-center mr-4">
                <Map size={26} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="font-grotesk text-gray-900 text-lg font-semibold mb-1">
                  Select on Map
                </Text>
                <Text className="font-grotesk text-gray-500 text-sm">
                  Pin exact location on the map
                </Text>
              </View>
            </TouchableOpacity>

            {/* Info Box */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <Text className="font-grotesk text-blue-900 text-xs">
                💡 <Text className="font-semibold">Tip:</Text> For best results, stand at the entrance of your property when using current location.
              </Text>
            </View>
          </View>
        );

      case 3:
        // Details (Title & Photos)
        return (
          <View>
            <Text className="font-grotesk text-gray-900 text-2xl font-bold mb-2">
              Final touches
            </Text>
            <Text className="font-grotesk text-gray-500 text-base mb-6">
              Add a title and photos (minimum 5, maximum 12)
            </Text>

            <Text className="font-grotesk text-gray-700 text-sm font-medium mb-2">
              Property Title
            </Text>
            <View
              className="bg-white border border-gray-300 rounded-xl mb-6"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <TextInput
                className="font-grotesk text-gray-900 text-base p-4"
                placeholder="Cozy PG near campus..."
                placeholderTextColor="#9CA3AF"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, title: text }))
                }
              />
            </View>

            {/* Photo Counter and Status */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-grotesk text-gray-700 text-sm font-medium">
                Photos ({images.length}/12)
              </Text>
              {images.length < 5 && (
                <Text className="font-grotesk text-orange-500 text-xs">
                  {5 - images.length} more required
                </Text>
              )}
              {images.length >= 5 && (
                <Text className="font-grotesk text-green-500 text-xs">
                  ✓ Minimum met
                </Text>
              )}
            </View>

            {/* Add Photo Button */}
            <TouchableOpacity
              onPress={() => setShowImageOptions(true)}
              disabled={images.length >= 12}
              className={`border border-dashed rounded-xl p-6 items-center mb-4 ${
                images.length >= 12 ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-300'
              }`}
            >
              <Camera size={32} color={images.length >= 12 ? "#9CA3AF" : "#3B82F6"} />
              <Text className={`font-grotesk text-base font-medium mt-2 ${
                images.length >= 12 ? 'text-gray-400' : 'text-blue-600'
              }`}>
                {images.length === 0 ? "Add Photos" : images.length >= 12 ? "Maximum Reached" : "Add More Photos"}
              </Text>
              <Text className="font-grotesk text-gray-500 text-xs mt-1">
                {images.length >= 12 ? 'You have reached the maximum limit' : 'Tap to choose or take a photo'}
              </Text>
            </TouchableOpacity>

            {/* Horizontal Thumbnail Queue */}
            {images.length > 0 && (
              <View className="mb-4">
                <Text className="font-grotesk text-gray-600 text-xs mb-2">
                  Tap any photo to preview or delete
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    {images.map((uri, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => viewImageInQueue(index)}
                        className="mr-3 relative"
                      >
                        <Image
                          source={{ uri }}
                          className="w-20 h-20 rounded-lg"
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#E5E7EB',
                          }}
                        />
                        <View className="absolute -top-1 -right-1 bg-blue-500 w-5 h-5 rounded-full items-center justify-center">
                          <Text className="font-grotesk text-white text-xs font-bold">
                            {index + 1}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        );

      case 4:
        // Price
        return (
          <View>
            <Text className="font-grotesk text-gray-900 text-2xl font-bold mb-2">
              What's the rent?
            </Text>
            <Text className="font-grotesk text-gray-500 text-base mb-6">
              Monthly rent amount
            </Text>

            <View
              className="bg-white border border-gray-300 rounded-xl flex-row items-center px-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="font-grotesk text-gray-900 text-2xl">₹</Text>
              <TextInput
                className="flex-1 font-grotesk text-gray-900 text-3xl py-5 px-3"
                placeholder="8500"
                placeholderTextColor="#9CA3AF"
                value={formData.rent}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    rent: text.replace(/[^0-9]/g, ""),
                  }))
                }
                keyboardType="numeric"
              />
              <Text className="font-grotesk text-gray-500 text-sm">/month</Text>
            </View>

            <View className="flex-row flex-wrap mt-6">
              {[5000, 7500, 10000, 15000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, rent: amount.toString() }))
                  }
                  className="bg-gray-100 rounded-lg px-4 py-2 mr-2 mb-2"
                >
                  <Text className="font-grotesk text-gray-700 font-medium">
                    ₹{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Electricity Rate */}
            <View className="mt-8">
              <Text className="font-grotesk text-gray-700 text-sm font-medium mb-2">
                Electricity Bill Rate
              </Text>
              <Text className="font-grotesk text-gray-500 text-xs mb-3">
                Per unit charge (optional)
              </Text>
              <View
                className="bg-white border border-gray-300 rounded-xl flex-row items-center px-4"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                }}
              >
                <Text className="font-grotesk text-gray-900 text-xl">₹</Text>
                <TextInput
                  className="flex-1 font-grotesk text-gray-900 text-2xl py-4 px-3"
                  placeholder="8"
                  placeholderTextColor="#9CA3AF"
                  value={formData.electricityRate}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      electricityRate: text.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  keyboardType="decimal-pad"
                />
                <Text className="font-grotesk text-gray-500 text-sm">/unit</Text>
              </View>

              <View className="flex-row flex-wrap mt-3">
                {[5, 7, 8, 10].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, electricityRate: rate.toString() }))
                    }
                    className="bg-gray-100 rounded-lg px-3 py-2 mr-2 mb-2"
                  >
                    <Text className="font-grotesk text-gray-700 font-medium text-sm">
                      ₹{rate}/unit
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-gray-200">
          <TouchableOpacity
            onPress={() => {
              if (currentStep > 1) {
                setCurrentStep((prev) => (prev - 1) as Step);
              } else {
                router.back();
              }
            }}
            className="bg-white w-10 h-10 rounded-full items-center justify-center"
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

          <View className="flex-1 mx-4">
            <Text className="font-grotesk text-gray-900 text-lg font-semibold">
              Post a Property
            </Text>
          </View>
        </View>

        {/* Progress Steps */}
        <View className="px-6 py-6 border-b border-gray-200 bg-white">
          <View className="flex-row items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.num;
              const isActive = currentStep === step.num;
              const isPending = currentStep < step.num;
              
              return (
                <React.Fragment key={step.num}>
                  {/* Step Circle */}
                  <View className="items-center" style={{ flex: 0 }}>
                    <View className="relative items-center justify-center">
                      {/* Pulse Animation Ring for Active State */}
                      {isActive && (
                        <Animated.View
                          className="absolute w-16 h-16 rounded-full bg-blue-500/20"
                          style={{
                            transform: [{ scale: pulseAnim }],
                          }}
                        />
                      )}
                      
                      {/* Main Circle */}
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isActive
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                        style={{
                          shadowColor: isCompleted ? "#10b981" : isActive ? "#3b82f6" : "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isCompleted || isActive ? 0.3 : 0.1,
                          shadowRadius: 4,
                          elevation: isCompleted || isActive ? 4 : 2,
                        }}
                      >
                        {isCompleted ? (
                          <Check size={20} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <Text className="text-base">{step.emoji}</Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Step Label */}
                    <Text
                      className={`font-grotesk text-xs mt-2 text-center ${
                        isCompleted || isActive
                          ? "text-gray-900 font-medium"
                          : "text-gray-400"
                      }`}
                      style={{ width: 60 }}
                    >
                      {step.title}
                    </Text>
                  </View>

                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <View className="flex-1 items-center" style={{ marginHorizontal: -10, marginTop: -16 }}>
                      <View className="relative w-full h-1">
                        {/* Background Line */}
                        <View className="absolute w-full h-1 bg-gray-300 rounded-full" />
                        
                        {/* Animated Green Fill Line */}
                        {currentStep > step.num && (
                          <View
                            className="absolute h-1 bg-emerald-500 rounded-full"
                            style={{
                              width: '100%',
                              shadowColor: "#10b981",
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.4,
                              shadowRadius: 4,
                            }}
                          />
                        )}
                      </View>
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Step Content */}
        <ScrollView className="flex-1 px-4 py-6">{renderStep()}</ScrollView>

        {/* Next Button */}
        <View className="px-4 py-4 border-t border-gray-200 bg-white">
          {/* Upload Progress Indicator */}
          {isUploading && (
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-grotesk text-gray-700 text-sm font-medium">
                  Uploading Images...
                </Text>
                <Text className="font-grotesk text-blue-500 text-sm font-semibold">
                  {uploadProgress}%
                </Text>
              </View>
              <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <View
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed() || isUploading}
            className={`rounded-xl py-4 items-center ${
              canProceed() && !isUploading ? "bg-blue-500" : "bg-gray-300"
            }`}
            style={{
              shadowColor: canProceed() && !isUploading ? "#3B82F6" : "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canProceed() && !isUploading ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
              opacity: canProceed() && !isUploading ? 1 : 0.5,
            }}
          >
            <Text className={`font-grotesk text-base font-semibold ${
              canProceed() && !isUploading ? "text-white" : "text-gray-500"
            }`}>
              {isUploading
                ? "Uploading..."
                : currentStep === 4
                ? "Post Property"
                : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Action Sheet Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white rounded-t-3xl">
              {/* Modal Header */}
              <View className="px-6 py-4 border-b border-gray-200">
                <Text className="font-grotesk text-gray-900 text-lg font-semibold text-center">
                  Add Photo
                </Text>
              </View>

              {/* Options */}
              <View className="p-4">
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <View className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center mr-4">
                    <Camera size={22} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-grotesk text-gray-900 text-base font-medium">
                      Take Photo
                    </Text>
                    <Text className="font-grotesk text-gray-500 text-sm">
                      Use your camera
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChooseFromGallery}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <View className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center mr-4">
                    <ImageIcon size={22} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-grotesk text-gray-900 text-base font-medium">
                      Choose from Gallery
                    </Text>
                    <Text className="font-grotesk text-gray-500 text-sm">
                      Select from your photos
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowImageOptions(false)}
                  className="bg-gray-100 rounded-xl p-4 items-center"
                >
                  <Text className="font-grotesk text-gray-700 text-base font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Safe area spacing for bottom */}
              <View style={{ height: Platform.OS === "ios" ? 20 : 10 }} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Map Selection Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Map Header */}
          <View className="px-4 py-3 flex-row items-center border-b border-gray-200 bg-white">
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center mr-4"
            >
              <X size={20} color="#000" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="font-grotesk text-gray-900 text-lg font-semibold">
                Select Location
              </Text>
              <Text className="font-grotesk text-gray-500 text-xs">
                Drag the map to position the pin
              </Text>
            </View>
          </View>

          {/* Map View */}
          {tempLocation && (
            <MapView
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: tempLocation.latitude,
                longitude: tempLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onRegionChangeComplete={(region) => {
                setTempLocation({
                  latitude: region.latitude,
                  longitude: region.longitude,
                });
              }}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={Platform.OS === "android"}
              loadingEnabled={true}
              loadingIndicatorColor="#3B82F6"
              loadingBackgroundColor="#FFFFFF"
            >
              {/* Fixed center pin */}
            </MapView>
          )}

          {/* Center Pin Indicator */}
          <View
            className="absolute items-center justify-center"
            style={{
              top: "50%",
              left: "50%",
              marginTop: -40,
              marginLeft: -20,
            }}
            pointerEvents="none"
          >
            <MapPin size={40} color="#3B82F6" fill="#3B82F6" />
            <View
              className="bg-blue-500 rounded-full mt-1"
              style={{ width: 8, height: 8 }}
            />
          </View>

          {/* Confirm Button */}
          <View className="px-4 py-4 border-t border-gray-200 bg-white">
            <TouchableOpacity
              onPress={confirmMapLocation}
              className="bg-blue-500 rounded-xl py-4 items-center"
              style={{
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="font-grotesk text-white text-base font-semibold">
                Confirm Location
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Image Preview Modal (After Capture/Select) */}
      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelPreview}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="px-4 py-3 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={cancelPreview}
                className="bg-white/20 w-10 h-10 rounded-full items-center justify-center"
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="font-grotesk text-white text-base font-medium">
                Preview Photo
              </Text>
              <View className="w-10" />
            </View>

            {/* Image Preview */}
            <View className="flex-1 items-center justify-center">
              {previewImage && (
                <Image
                  source={{ uri: previewImage }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Confirm Button */}
            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={confirmImage}
                className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center"
                style={{
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
                <Text className="font-grotesk text-white text-base font-semibold ml-2">
                  Confirm & Add Photo
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Queue Image Preview/Delete Modal */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="px-4 py-3 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setSelectedImageIndex(null)}
                className="bg-white/20 w-10 h-10 rounded-full items-center justify-center"
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="font-grotesk text-white text-base font-medium">
                Photo {selectedImageIndex !== null ? selectedImageIndex + 1 : ''} of {images.length}
              </Text>
              <View className="w-10" />
            </View>

            {/* Image Preview */}
            <View className="flex-1 items-center justify-center">
              {selectedImageIndex !== null && images[selectedImageIndex] && (
                <Image
                  source={{ uri: images[selectedImageIndex] }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Delete Button */}
            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={deleteSelectedImage}
                className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
                style={{
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <X size={20} color="#FFFFFF" strokeWidth={3} />
                <Text className="font-grotesk text-white text-base font-semibold ml-2">
                  Delete Photo
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

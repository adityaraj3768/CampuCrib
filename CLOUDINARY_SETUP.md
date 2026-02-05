# 📸 Cloudinary Image Upload Setup Guide

## Overview
Your app now uses Cloudinary for image storage - the same technology used by Instagram, Airbnb, and other major apps. This guide will help you complete the setup.

---

## Phase 1: Create Your Cloudinary Account

### Step 1: Sign Up
1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a **FREE account** (generous limits: 25GB storage, 25GB bandwidth/month)
3. Verify your email

### Step 2: Get Your Cloud Name
1. After logging in, you'll see your **Dashboard**
2. Find your **Cloud Name** (e.g., `dmxyz123`)
3. **Copy it** - you'll need this!

---

## Phase 2: Create an Upload Preset (Security)

### Why Unsigned Upload Preset?
- Allows your app to upload images WITHOUT exposing your secret API key
- Industry standard for mobile apps
- Users can only UPLOAD (not delete/modify existing images)

### Steps:
1. In Cloudinary Dashboard, click **Settings** (gear icon)
2. Go to **Upload** tab
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `campuscrib_unsigned`
   - **Signing Mode**: Select **Unsigned** ⚠️ (Very Important!)
   - **Folder**: `campuscrib` (optional - organizes images)
   - **Upload manipulations** (optional):
     - Max file size: `10MB`
     - Allowed formats: `jpg, png, heic`
     - Quality: `auto:good` (optimizes file size)
6. Click **Save**
7. **Copy the preset name** - you'll need this!

---

## Phase 3: Configure Your App

### Update the Configuration
Open `app/owner/post.tsx` and replace these lines (around line 95):

```typescript
// TODO: Replace with your actual Cloudinary cloud name and upload preset
const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME"; // e.g., "dmxyz123"
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET"; // e.g., "campuscrib_unsigned"
```

**Replace with YOUR actual values:**
```typescript
const CLOUDINARY_CLOUD_NAME = "dmxyz123"; // ← Your Cloud Name from Step 2
const CLOUDINARY_UPLOAD_PRESET = "campuscrib_unsigned"; // ← Your Preset Name
```

---

## Phase 4: Update Your Backend (Spring Boot)

### Update the Crib Entity

Add `imageUrls` field to store Cloudinary URLs:

```java
@Entity
@Table(name = "cribs")
public class Crib {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private Double latitude;
    private Double longitude;
    private Integer rent;
    private String electricityRate;
    private String housingType; // "pg" or "flat"
    private String genderType; // "boys", "girls", "co-ed"
    
    // NEW: Store Cloudinary URLs as JSON array
    @Column(columnDefinition = "TEXT")
    private String imageUrls; // Store as JSON: ["url1", "url2"]
    
    // Or use @ElementCollection for automatic JSON mapping
    @ElementCollection
    @CollectionTable(name = "crib_images")
    @Column(name = "image_url")
    private List<String> imageUrls;
    
    // ... getters and setters
}
```

### Update the Controller

```java
@RestController
@RequestMapping("/api/cribs")
public class CribController {
    
    @PostMapping
    public ResponseEntity<Crib> createCrib(@RequestBody CribDTO cribDTO) {
        // The imageUrls will come from frontend as an array of Cloudinary URLs
        Crib crib = new Crib();
        crib.setTitle(cribDTO.getTitle());
        crib.setLatitude(cribDTO.getLatitude());
        crib.setLongitude(cribDTO.getLongitude());
        crib.setRent(cribDTO.getRent());
        crib.setElectricityRate(cribDTO.getElectricityRate());
        crib.setHousingType(cribDTO.getHousingType());
        crib.setGenderType(cribDTO.getGenderType());
        crib.setImageUrls(cribDTO.getImageUrls()); // Array of Cloudinary URLs
        
        Crib savedCrib = cribRepository.save(crib);
        return ResponseEntity.ok(savedCrib);
    }
}
```

### Expected Request Body

Your backend will receive JSON like this:

```json
{
  "title": "Cozy PG near IIT",
  "latitude": 28.699,
  "longitude": 77.444,
  "rent": 8500,
  "electricityRate": "8",
  "housingType": "pg",
  "genderType": "boys",
  "imageUrls": [
    "https://res.cloudinary.com/dmxyz123/image/upload/v1234/campuscrib/img1.jpg",
    "https://res.cloudinary.com/dmxyz123/image/upload/v1234/campuscrib/img2.jpg"
  ]
}
```

---

## Phase 5: Update Frontend to Display Images

### In ListingCard Component

```tsx
// components/ListingCard.tsx
import { Image } from 'react-native';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <View>
      {/* Display first image from Cloudinary */}
      {listing.imageUrls && listing.imageUrls.length > 0 && (
        <Image
          source={{ uri: listing.imageUrls[0] }}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
      )}
      {/* ... rest of card */}
    </View>
  );
}
```

### In Listing Details Screen

```tsx
// app/listing/[id].tsx
import { ScrollView, Image } from 'react-native';

// Display all images in a carousel
{listing.imageUrls?.map((url, index) => (
  <Image
    key={index}
    source={{ uri: url }}
    style={{ width: screenWidth, height: 300 }}
    resizeMode="cover"
  />
))}
```

---

## 🎯 How It Works (The Full Flow)

### Step-by-Step Process:

1. **User selects photos** → Stored locally as `file://` URIs
2. **User clicks "Post Property"** → Upload process begins
3. **App uploads each image** → Direct to Cloudinary API
4. **Cloudinary responds** → Returns `secure_url` for each image
5. **App collects all URLs** → Stores in `formData.imageUrls`
6. **App sends JSON to backend** → With Cloudinary URLs (not raw images!)
7. **Backend saves** → URLs stored as text in database
8. **Display time** → `<Image source={{ uri: cloudinaryUrl }} />`

### Why This is Better:

✅ **Fast**: Images load directly from Cloudinary CDN (blazing fast)  
✅ **Cheap**: Your database stays small (URLs are just text)  
✅ **Scalable**: Cloudinary handles all image optimization  
✅ **Professional**: Auto-generates thumbnails, responsive images  
✅ **Reliable**: 99.99% uptime, global CDN  

---

## 🧪 Testing

### Test the Upload:

1. Run your app
2. Go to "Post a Crib"
3. Add some photos (Take photo or Gallery)
4. Fill in all details
5. Click "Post Property"
6. Watch the progress bar!
7. Check console logs for Cloudinary URLs

### Verify in Cloudinary:

1. Go to Cloudinary Dashboard
2. Click **Media Library**
3. You should see your uploaded images in `/campuscrib` folder
4. Click on an image to get its URL

---

## 🐛 Troubleshooting

### Issue: "Upload failed with status: 400"
**Solution**: Double-check your `CLOUDINARY_UPLOAD_PRESET` name. Make sure it's set to **Unsigned** mode.

### Issue: "Network request failed"
**Solution**: 
- Check internet connection
- Make sure Cloudinary Cloud Name is correct
- Try uploading from Cloudinary dashboard to verify account is active

### Issue: Images not displaying
**Solution**:
- Verify the URL in console logs starts with `https://res.cloudinary.com/`
- Check if backend is receiving and saving the URLs correctly
- Test the URL in a browser to ensure it loads

### Issue: "Upload too slow"
**Solution**:
- Cloudinary automatically compresses images
- You can reduce quality in the app (currently set to 0.8)
- Or add transformations in Upload Preset (e.g., resize to 1200px width)

---

## 📊 Free Tier Limits

Cloudinary Free Plan includes:
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **API Calls**: Unlimited

This is typically enough for:
- ~5,000 - 10,000 property images
- Thousands of monthly users

---

## 🚀 Next Steps

1. ✅ Complete Cloudinary signup
2. ✅ Create upload preset
3. ✅ Update app configuration
4. ✅ Update backend to receive imageUrls
5. ✅ Test end-to-end flow
6. ✅ Update display components

---

## 💡 Pro Tips

### Optimize Image Loading:
Cloudinary supports URL transformations:

```typescript
// Original URL:
"https://res.cloudinary.com/dmxyz123/image/upload/v1234/campuscrib/img.jpg"

// Thumbnail (200px wide):
"https://res.cloudinary.com/dmxyz123/image/upload/w_200,c_scale/v1234/campuscrib/img.jpg"

// Compressed for mobile:
"https://res.cloudinary.com/dmxyz123/image/upload/q_auto,f_auto/v1234/campuscrib/img.jpg"
```

You can add these transformations in your display code without re-uploading images!

---

## 📞 Support

- Cloudinary Docs: https://cloudinary.com/documentation
- Community Forum: https://community.cloudinary.com/
- Support: https://support.cloudinary.com/

---

**Happy Coding! 🎉**

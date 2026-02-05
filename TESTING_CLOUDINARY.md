# 🧪 Testing Cloudinary Integration

## Prerequisites Checklist

Before testing, ensure you have completed:

- [ ] Created Cloudinary account at cloudinary.com
- [ ] Copied your Cloud Name: `dt2eki9jf` ✅ (Already configured in app)
- [ ] Created unsigned upload preset: `campuscrib_unsigned`
- [ ] Updated backend to accept `imageUrls` field (Spring Boot)
- [ ] Backend is running at: http://192.168.1.48:8080

---

## Backend Update Required

### 1. Update Your Crib Entity (Java)

Add the `imageUrls` field to your existing `Crib` entity:

```java
@Entity
@Table(name = "cribs")
public class Crib {
    // ... existing fields ...
    
    // ADD THIS NEW FIELD:
    @ElementCollection
    @CollectionTable(name = "crib_images", joinColumns = @JoinColumn(name = "crib_id"))
    @Column(name = "image_url", length = 500)
    private List<String> imageUrls;  // Cloudinary URLs
    
    // ADD GETTER AND SETTER:
    public List<String> getImageUrls() {
        return imageUrls;
    }
    
    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}
```

### 2. Update Your Database Schema

Run this SQL to add the images table:

```sql
CREATE TABLE crib_images (
    crib_id BIGINT NOT NULL,
    image_url VARCHAR(500),
    FOREIGN KEY (crib_id) REFERENCES cribs(id)
);
```

### 3. Update Your Controller

Make sure your POST endpoint accepts `imageUrls`:

```java
@PostMapping("/api/cribs")
public ResponseEntity<Crib> createCrib(@RequestBody CribDTO dto) {
    Crib crib = new Crib();
    crib.setTitle(dto.getTitle());
    crib.setLatitude(dto.getLatitude());
    crib.setLongitude(dto.getLongitude());
    crib.setRent(dto.getRent());
    crib.setElectricityRate(dto.getElectricityRate());
    crib.setHousingType(dto.getHousingType());
    crib.setGenderType(dto.getGenderType());
    crib.setImageUrls(dto.getImageUrls()); // ADD THIS LINE
    
    Crib saved = cribRepository.save(crib);
    return ResponseEntity.ok(saved);
}
```

### 4. Update Your DTO

```java
public class CribDTO {
    private String title;
    private Double latitude;
    private Double longitude;
    private Integer rent;
    private String electricityRate;
    private String housingType;
    private String genderType;
    private List<String> imageUrls; // ADD THIS FIELD
    
    // Getters and setters...
    public List<String> getImageUrls() {
        return imageUrls;
    }
    
    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}
```

---

## Step-by-Step Testing

### Step 1: Verify Cloudinary Configuration

1. Open `app/owner/post.tsx` (around line 100)
2. Confirm these values are set:
   ```typescript
   const CLOUDINARY_CLOUD_NAME = "dt2eki9jf";
   const CLOUDINARY_UPLOAD_PRESET = "campuscrib_unsigned";
   ```

### Step 2: Test Image Upload Flow

1. **Start your app**:
   ```bash
   npm start
   ```

2. **Navigate to Post Property**:
   - Open the app on your device/emulator
   - Go to "Post a Crib" section

3. **Fill Step 1 (Location)**:
   - Click "Use Current Location" or "Select on Map"
   - Verify coordinates are captured

4. **Fill Step 2 (Price)**:
   - Enter rent amount (e.g., 8500)
   - Enter electricity rate (e.g., 8)

5. **Fill Step 3 (Type)**:
   - Select PG or Flat
   - Select gender type

6. **Fill Step 4 (Details)**:
   - Enter title (e.g., "Cozy PG near IIT")
   - Click "Add Photos"
   - Select 2-3 images from gallery or take photos
   - Verify thumbnails appear

7. **Submit**:
   - Click "Post Property"
   - **Watch for upload progress bar** (0-100%)
   - Wait for completion

### Step 3: Check Console Logs

After clicking "Post Property", you should see logs like:

```
Starting image upload to Cloudinary...
Uploading image 1/3...
✓ Image uploaded: https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/abc123.jpg
Uploading image 2/3...
✓ Image uploaded: https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/def456.jpg
All images uploaded successfully!
Submitting to backend...
```

### Step 4: Verify Cloudinary Dashboard

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Click **Media Library**
3. Look for folder: `/campuscrib`
4. You should see your uploaded images!

### Step 5: Verify Backend Received URLs

Check your backend logs or database:

```sql
SELECT * FROM cribs ORDER BY id DESC LIMIT 1;
SELECT * FROM crib_images WHERE crib_id = (SELECT MAX(id) FROM cribs);
```

Expected output:
```
crib_id | image_url
--------|----------
1       | https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/abc123.jpg
1       | https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/def456.jpg
```

### Step 6: Test Image Display

1. **Search Screen**:
   - Go to Search tab
   - Select your college
   - Verify properties show images from Cloudinary

2. **Property Details**:
   - Click on a property
   - Swipe through images
   - All images should load from Cloudinary URLs

---

## Troubleshooting

### Issue: "Upload failed with status: 400"

**Cause**: Upload preset not configured correctly

**Solution**:
1. Go to Cloudinary → Settings → Upload
2. Check preset name matches exactly: `campuscrib_unsigned`
3. Verify "Signing Mode" is set to **Unsigned**

### Issue: "Network request failed"

**Possible Causes**:
- No internet connection
- Cloud name is incorrect
- Cloudinary service is down

**Solutions**:
1. Verify internet connection
2. Double-check cloud name: `dt2eki9jf`
3. Try uploading manually in Cloudinary dashboard

### Issue: Images not displaying in app

**Possible Causes**:
- Backend not returning `imageUrls` field
- URLs are malformed
- Network issues

**Solutions**:
1. Check backend response in logs
2. Verify URLs start with `https://res.cloudinary.com/`
3. Test URL in browser - it should load the image
4. Check if backend GET endpoint includes `imageUrls`

### Issue: "Upload stuck at 0%"

**Possible Causes**:
- Large image file size
- Slow internet
- Image format not supported

**Solutions**:
1. Wait longer (first upload can take 30-60 seconds)
2. Use smaller images or fewer images
3. Check image format (jpg, png are supported)

---

## Expected API Flow

### 1. POST Request to Cloudinary

```
POST https://api.cloudinary.com/v1_1/dt2eki9jf/image/upload

Body (FormData):
- file: [binary image data]
- upload_preset: campuscrib_unsigned
- folder: campuscrib
```

### 2. Cloudinary Response

```json
{
  "secure_url": "https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/abc123.jpg",
  "public_id": "campuscrib/abc123",
  "width": 1200,
  "height": 800
}
```

### 3. POST Request to Your Backend

```
POST http://192.168.1.48:8080/api/cribs

Body (JSON):
{
  "title": "Cozy PG near IIT",
  "latitude": 28.5459,
  "longitude": 77.1926,
  "rent": 8500,
  "electricityRate": "8",
  "housingType": "pg",
  "genderType": "boys",
  "imageUrls": [
    "https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/abc123.jpg",
    "https://res.cloudinary.com/dt2eki9jf/image/upload/v1234/campuscrib/def456.jpg"
  ]
}
```

---

## Performance Benchmarks

### First Upload (Cold Start)
- 1 image: ~5-10 seconds
- 3 images: ~15-30 seconds

### Subsequent Uploads
- 1 image: ~2-5 seconds
- 3 images: ~8-15 seconds

### Image Display
- From Cloudinary CDN: <1 second
- Vs Database BLOB: ~5-10 seconds (much slower!)

---

## Success Criteria

✅ Upload progress bar shows 0% → 100%  
✅ Success alert appears: "Property posted successfully!"  
✅ Images visible in Cloudinary Media Library  
✅ Backend database contains Cloudinary URLs (not binary data)  
✅ Images load instantly in search and details screens  
✅ Can swipe through multiple images smoothly  

---

## Next Steps After Testing

1. **Optimize Image Quality** (Optional):
   - Go to Cloudinary upload preset settings
   - Add transformation: `q_auto:good` (reduces file size by 40-60%)

2. **Add Responsive Images** (Advanced):
   - Use Cloudinary URL transformations for thumbnails:
     ```typescript
     const thumbnailUrl = imageUrl.replace('/upload/', '/upload/w_300,c_scale/');
     ```

3. **Monitor Usage**:
   - Check Cloudinary dashboard for storage/bandwidth usage
   - Free tier: 25GB storage, 25GB bandwidth/month

---

**Need Help?**
- Cloudinary Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com/

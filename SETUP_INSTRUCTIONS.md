# Burp Burger Kiosk - Setup Instructions

## ✅ Latest Changes (March 13, 2026)

### 1. **New MongoDB Connection**
- **Type**: MongoDB Atlas (Cloud Database)
- **Connection String**: `mongodb+srv://kikokiosk:kikokiosk123@cluster0.mongodb.net/kiosk_ordering_db`
- **Credentials**: kikokiosk / kikokiosk123
- **Database**: kiosk_ordering_db

### 2. **Category Names Updated** (IMPORTANT!)
Changed from plural to singular format:
- ✅ `Burger` (was "Burgers")
- ✅ `Rice Meal` (was "Rice Meals")
- ✅ `Fries`
- ✅ `Drinks`

### 3. **Image Upload Restrictions**
- ✅ **JPEG/JPG** files only
- ✅ **PNG** files only
- ❌ No other formats allowed
- Max file size: 50MB

---

## 🚀 Quick Start

### Step 1: Restart Backend Server
```bash
# In backend terminal:
1. Press Ctrl+C to stop current server
2. Clear npm cache (optional):
   npm cache clean --force
3. Start server:
   node server.js
```

### Step 2: Watch for Successful Connection
You should see in the backend terminal:
```
✓ Connected to MongoDB successfully
✓ Server running on http://localhost:5000
```

### Step 3: Test Menu Management
1. Open Menu Management page in browser
2. Click "Add Item"
3. Fill in the form:
   - Name: (any text)
   - Category: Select **Burger**, **Rice Meal**, **Fries**, or **Drinks**
   - Price: (any number > 0)
   - Image: (JPEG or PNG file only)
4. Click "Add Item"

### Step 4: Verify Success
- ✅ Green success popup appears: "Menu item added successfully"
- ✅ Item appears in the list
- ✅ Item shows in Dashboard under correct category

---

## 🔧 Configuration

### Backend .env File
Located at: `backend/.env`
```
MONGO_URI=mongodb+srv://kikokiosk:kikokiosk123@cluster0.mongodb.net/kiosk_ordering_db?retryWrites=true&w=majority
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_TOKEN=kiosk-admin-token
```

### To Use Local MongoDB Instead:
Edit `backend/.env` and change:
```
MONGO_URI=mongodb://127.0.0.1:27017/kiosk_ordering_db
```
(Make sure MongoDB service is running on port 27017)

---

## 📋 Files Modified

| File | Changes |
|------|---------|
| `backend/.env` | **NEW** - Configuration file |
| `backend/server.js` | Updated MongoDB URI |
| `backend/models/MenuItem.js` | Category: `['Burger', 'Rice Meal', 'Fries', 'Drinks']` |
| `backend/routes/menuRoutes.js` | Categories updated + Image filter (JPEG/PNG only) + Simplified POST |
| `frontend/src/pages/MenuManagement.jsx` | Categories updated to singular |
| `frontend/src/pages/Dashboard.jsx` | Categories updated to singular |

---

## 🐛 Troubleshooting

### Error: "Failed to load resource: the server responded with a status of 500"

**Check these in order:**

1. **Backend server restarted?**
   - Stop (Ctrl+C) and restart `node server.js`

2. **MongoDB connection?**
   - Check backend console for: `✓ Connected to MongoDB successfully`
   - If error: Your internet connection or MongoDB Atlas might be down

3. **Category spelling?**
   - Use exactly: `Burger`, `Rice Meal`, `Fries`, `Drinks` (case-sensitive)

4. **Image format?**
   - Only JPEG/JPG or PNG files
   - Check console error: "Only JPEG and PNG images are allowed"

### Error: "Invalid category. Valid options: Burger, Rice Meal, Fries, Drinks"

- **Cause**: Frontend sending wrong category name
- **Solution**: Refresh page, try again
- Make sure you selected from the dropdown

### Error: "Database connection error"

- **Cause**: Can't reach MongoDB Atlas
- **Solution**:
  1. Check internet connection
  2. Verify MongoDB Atlas is working (log into mongodb.com)
  3. Use local MongoDB if Atlas is down:
     - Change MONGO_URI in `.env` to `mongodb://127.0.0.1:27017/kiosk_ordering_db`
     - Start MongoDB locally: `mongod`
     - Restart backend: `node server.js`

---

## 📊 Database Schema

### MenuItem Collection
```javascript
{
  _id: ObjectId,
  name: String,           // Required, trimmed
  price: Number,          // Required, >= 0
  category: String,       // Required, enum: ['Burger', 'Rice Meal', 'Fries', 'Drinks']
  image: String,         // Optional, path to JPEG/PNG file
  createdAt: Date,
  updatedAt: Date
}
```

---

## ✅ Testing Checklist

- [ ] Backend server starts successfully
- [ ] MongoDB connection shows: `✓ Connected to MongoDB successfully`
- [ ] Can add item with "Burger" category
- [ ] Can add item with "Rice Meal" category
- [ ] Can add item with "Fries" category
- [ ] Can add item with "Drinks" category
- [ ] Image upload works for JPEG files
- [ ] Image upload works for PNG files
- [ ] Items appear in Dashboard
- [ ] Items appear in Menu Management list

---

## 📞 Support

If issues persist:
1. Check backend terminal for error logs
2. Check browser console (F12) for error details
3. Verify MongoDB Atlas account is active
4. Restart everything: backend, frontend, browser

---

**Created**: March 13, 2026
**Status**: All configurations updated ✓

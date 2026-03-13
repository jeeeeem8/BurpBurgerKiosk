# Backend Startup Status - Exit Code 1

## Current Issue
The backend fails to start with exit code 1. **The most likely cause is that MongoDB is not running.**

## ✅ Completed Work
- MenuItem schema updated to accept: 'Burger', 'Rice Meal', 'Fries', 'Drinks'
- Menu routes (API endpoints) support all 4 categories
- Image upload restricted to JPEG/PNG only
- Frontend dropdowns updated with correct category names
- Success/error popups implemented (SweetAlert2)
- MongoDB switched to local instance (127.0.0.1:27017)
- All code syntax validated - no errors found

## ⚠️ Current Blocker
**MongoDB service is NOT RUNNING.** Port 27017 is not responding.

## 🔧 Quick Fix (Windows)

### Option 1: Start MongoDB (if installed)
```bash
mongod
```

### Option 2: Check if MongoDB service exists
```bash
net start MongoDB
```

### Option 3: Launch from MongoDB installation
```bash
"C:\Program Files\MongoDB\Server\[VERSION]\bin\mongod.exe"
```

## 📋 Diagnostic Checklist

Run the diagnostic script:
```bash
DIAGNOSE.bat
```

This will check:
- ✓ Node.js installation
- ✓ MongoDB installation
- ✓ MongoDB service status
- ✓ Backend dependencies
- ✓ MongoDB connection

## 🚀 Once MongoDB is Running

Start backend normally:
```bash
cd backend
node server.js
```

Expected output:
```
Server running on port 5000
✓ Connected to MongoDB successfully
```

## 🗂️ Database Location
- **Connection**: mongodb://127.0.0.1:27017/kiosk_ordering_db
- **Database Name**: kiosk_ordering_db
- **Collections**: users, menuitems, orders, addons (auto-created)

## 📝 Next Steps

1. **Start MongoDB** (the critical first step)
2. **Start backend** - use `START_BACKEND.bat` in the repository root
3. **Test categories** - Navigate to Menu Management in frontend
4. **Verify each category**: Burger, Rice Meal, Fries, Drinks
5. **Test image upload** - Only JPEG/PNG accepted

## 🐛 If Backend Still Fails

Check for these issues:
1. Port 5000 already in use
   ```bash
   netstat -ano | findstr :5000
   ```
2. MongoDB connection refused
   - Verify mongod is running
   - Check MongoDB logs
3. Missing dependencies
   ```bash
   npm install
   ```

## 📞 Need Help?
See SETUP_INSTRUCTIONS.md for detailed configuration information.

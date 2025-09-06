# 🌾 AgriBusiness Manager - Complete Setup Guide

## 🚨 **CRITICAL: You Must Do This First!**

### Step 1: Create Environment File
Create a `.env` file in the root directory (same level as package.json) with this content:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/agribusiness

# JWT Secret - IMPORTANT: Use a strong, unique secret
JWT_SECRET=agribusiness_super_secret_jwt_key_2024_secure_random_string_here

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**⚠️ IMPORTANT:** Without this `.env` file, the app will crash with JWT errors!

## 📋 **Complete Setup Process**

### Step 2: Install MongoDB
**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 3: Install Dependencies
```bash
npm run setup
```

### Step 4: Start the Application
```bash
npm run dev
```

## 🎯 **How the App Works**

### Authentication Flow:
1. **First Visit**: User sees login/register page
2. **Registration**: User creates owner account (only one owner allowed)
3. **Login**: User gets JWT token stored in localStorage
4. **Protected Routes**: All business features require authentication

### User Journey:
1. **Register** → Create your business account
2. **Add Customers** → Build your customer database
3. **Add Products** → Create your product catalog
4. **Create Orders** → Process customer orders
5. **View Dashboard** → Monitor business performance

## 🔧 **Troubleshooting**

### Error: "JWT_SECRET is not configured"
**Solution:** Create the `.env` file as shown in Step 1 above.

### Error: "MongoDB connection error"
**Solution:** 
1. Make sure MongoDB is running
2. Check if the connection string in `.env` is correct
3. Try: `mongosh` to test MongoDB connection

### Error: "Port already in use"
**Solution:**
1. Kill processes using ports 3000/5000
2. Or change ports in `.env` file

### App loads but shows blank page
**Solution:**
1. Check browser console for errors
2. Make sure both frontend (3000) and backend (5000) are running
3. Check if `.env` file exists and has correct values

## 📱 **Using the Application**

### First Time Setup:
1. **Register Account**
   - Go to http://localhost:3000
   - Click "Sign up here"
   - Fill in your business details
   - This creates your owner account

2. **Add Your First Customer**
   - Go to "Customers" page
   - Click "Add Customer"
   - Fill in customer details

3. **Add Products**
   - Go to "Products" page
   - Click "Add Product"
   - Add your product catalog

4. **Create an Order**
   - Go to "Cart" page
   - Select a customer
   - Add products to cart
   - Complete the order

### Key Features:
- **Dashboard**: Business analytics and metrics
- **Customers**: Manage customer database
- **Products**: Product catalog and inventory
- **Orders**: Order processing and tracking
- **Profile**: Business settings and preferences

## 🛠️ **Development Commands**

```bash
# Install all dependencies
npm run setup

# Start development servers
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Check MongoDB connection
npm run check-mongo

# Build for production
npm run build

# Start production server
npm start
```

## 🔒 **Security Notes**

1. **JWT Secret**: Use a strong, unique secret in production
2. **Database**: Use MongoDB Atlas for production
3. **Environment**: Never commit `.env` file to version control
4. **HTTPS**: Use HTTPS in production

## 📊 **Database Schema**

The app uses these main collections:
- **users**: Owner account information
- **customers**: Customer database
- **products**: Product catalog
- **orders**: Order records

## 🚀 **Production Deployment**

1. Set up MongoDB Atlas (cloud database)
2. Update `.env` with production values
3. Build frontend: `npm run build`
4. Deploy to hosting service (Heroku, Vercel, etc.)

## ❓ **Common Questions**

**Q: Can I have multiple owners?**
A: No, this is designed for single-owner businesses.

**Q: Can I reset the database?**
A: Yes, delete the MongoDB database and restart the app.

**Q: How do I backup my data?**
A: Export from MongoDB or use MongoDB Atlas backups.

**Q: Can I customize the app?**
A: Yes, the code is fully customizable for your needs.

## 🆘 **Need Help?**

1. Check the console for error messages
2. Verify MongoDB is running
3. Ensure `.env` file exists and is correct
4. Check all dependencies are installed
5. Restart the application

---

**🎉 Once everything is set up, you'll have a fully functional agribusiness management system!**

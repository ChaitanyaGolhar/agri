# AgriBusiness Manager - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js (v16 or higher) - [Download here](https://nodejs.org/)
- MongoDB (v5.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)

### 2. Install Dependencies
```bash
npm run setup
```

### 3. Start MongoDB
**Windows:**
```bash
# Option 1: Start as Windows Service
net start MongoDB

# Option 2: Start manually
mongod --dbpath C:\data\db
```

**macOS:**
```bash
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 4. Start the Application
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Troubleshooting

### MongoDB Connection Issues
If you see "MongoDB connection error", make sure MongoDB is running:

```bash
# Check if MongoDB is running
npm run check-mongo
```

If MongoDB is not running:
1. **Windows**: Run `net start MongoDB` as Administrator
2. **macOS**: Run `brew services start mongodb/brew/mongodb-community`
3. **Linux**: Run `sudo systemctl start mongod`

### Port Already in Use
If ports 3000 or 5000 are already in use:
1. Kill the processes using those ports
2. Or change the ports in your `.env` file

### Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/agribusiness
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## First Time Setup

1. **Register an Account**
   - Go to http://localhost:3000
   - Click "Sign up here"
   - Fill in your business details
   - Create your account

2. **Add Your First Customer**
   - Go to Customers page
   - Click "Add Customer"
   - Fill in customer details

3. **Add Products**
   - Go to Products page
   - Click "Add Product"
   - Add your product catalog

4. **Create an Order**
   - Go to Cart page
   - Select a customer
   - Add products to cart
   - Create your first order

## Features Overview

- **Dashboard**: View business analytics and key metrics
- **Customers**: Manage customer database
- **Products**: Manage product catalog and inventory
- **Orders**: Create and track customer orders
- **Profile**: Manage business settings

## Need Help?

1. Check the console for error messages
2. Ensure MongoDB is running
3. Verify all dependencies are installed
4. Check the README.md for detailed documentation

## Production Deployment

For production deployment:
1. Set up a production MongoDB instance
2. Update environment variables
3. Build the frontend: `npm run build`
4. Start the production server: `npm start`

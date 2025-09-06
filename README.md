# AgriBusiness Manager

A comprehensive web application for agribusiness owners to manage their operations, customers, products, inventory, and sales efficiently.

## Features

### Core Features
- **Owner-only Authentication System** - Secure login and registration
- **Customer Management** - Add, edit, view customer details with order history
- **Product Catalog** - Manage products with categories, search, and filtering
- **Order Management** - Create orders, track status, and generate invoices
- **Inventory Control** - Stock tracking with low-stock alerts
- **Admin Dashboard** - Overview of business performance with analytics

### Key Capabilities
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Real-time Analytics** - Sales charts, top products, customer insights
- **Search & Filtering** - Advanced search across products and customers
- **Order Processing** - Complete order lifecycle management
- **Stock Management** - Automatic stock updates and alerts
- **Multi-language Support** - English, Marathi, and Hindi

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Express Validator** for input validation
- **Helmet** for security
- **Rate Limiting** for API protection

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** for form management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agribusiness-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/agribusiness
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## Usage

### Getting Started
1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or login with existing credentials
3. Start by adding your first customer and product
4. Create orders and manage your inventory

### Key Workflows

#### Customer Management
- Add customers with contact details and business type
- Track customer purchase history
- View detailed customer profiles

#### Product Management
- Create product catalog with categories and specifications
- Set stock levels and minimum thresholds
- Track inventory and receive low-stock alerts

#### Order Processing
1. Select customer and add products to cart
2. Choose payment method and add notes
3. Create order and track status updates
4. Generate invoices automatically

#### Dashboard Analytics
- View sales performance and trends
- Monitor top-selling products
- Track customer insights
- Get low-stock alerts

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Deactivate customer

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `PUT /api/products/:id/stock` - Update stock
- `DELETE /api/products/:id` - Deactivate product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard statistics
- `GET /api/dashboard/sales-chart` - Get sales data
- `GET /api/dashboard/top-products` - Get top products
- `GET /api/dashboard/low-stock-alerts` - Get low stock alerts

## Database Schema

### User
- Business information and preferences
- Authentication credentials
- Account settings

### Customer
- Contact details and address
- Business type and crop preferences
- Purchase history and credit information

### Product
- Product details and specifications
- Inventory and pricing information
- Category and compatibility data

### Order
- Order items and totals
- Customer and payment information
- Status tracking and delivery details

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers

## Development

### Project Structure
```
agribusiness-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── index.js            # Server entry point
├── package.json            # Root package.json
└── README.md
```

### Available Scripts
- `npm run dev` - Start development servers
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build for production
- `npm start` - Start production server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

## Roadmap

### Phase 2 Features
- Advanced inventory management with batch tracking
- Supplier management and purchase orders
- Detailed reports and analytics
- Multilingual support (Marathi, Hindi)
- Commission-based sales tracking
- UPI payment integration
- SMS/WhatsApp notifications
- Print and export functionality

---

Built with ❤️ for agribusiness owners in India

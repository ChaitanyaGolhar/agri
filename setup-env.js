const fs = require('fs');
const path = require('path');

const envContent = `# Database
MONGODB_URI=mongodb://127.0.0.1:27017/agribusiness

# JWT Secret - IMPORTANT: Use a strong, unique secret
JWT_SECRET=agribusiness_super_secret_jwt_key_2024_secure_random_string_here

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email Configuration (for notifications) - Optional
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# UPI Payment Gateway (when implemented) - Optional
UPI_MERCHANT_ID=your_merchant_id
UPI_MERCHANT_KEY=your_merchant_key
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📝 Current .env content:');
  console.log(fs.readFileSync(envPath, 'utf8'));
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Content:');
  console.log(envContent);
}

console.log('\n🚀 You can now run: npm run dev');
console.log('🌐 App will be available at: http://localhost:3000');

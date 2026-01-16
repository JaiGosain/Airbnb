const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Airbnb Clone...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}\n`);
} catch (error) {
  console.error('❌ npm is not installed. Please install npm first.');
  process.exit(1);
}

// Install root dependencies
console.log('📦 Installing root dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Root dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install root dependencies');
  process.exit(1);
}

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  execSync('cd backend && npm install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
try {
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Create .env file for backend if it doesn't exist
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file for backend...');
  const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/airbnb-clone
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created\n');
}

console.log('🎉 Setup completed successfully!\n');
console.log('📋 Next steps:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Update the .env file in the backend directory with your MongoDB connection string');
console.log('3. Run "npm run dev" to start both frontend and backend servers');
console.log('4. Open http://localhost:3000 in your browser\n');
console.log('📚 Available scripts:');
console.log('- npm run dev: Start both frontend and backend in development mode');
console.log('- npm run server: Start only the backend server');
console.log('- npm run client: Start only the frontend server');
console.log('- npm run build: Build the frontend for production\n');
console.log('🔧 Backend will run on http://localhost:5000');
console.log('🎨 Frontend will run on http://localhost:3000');




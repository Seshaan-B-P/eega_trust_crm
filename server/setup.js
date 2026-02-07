// setup.js - Setup script for EEGA Trust CRM
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔧 Setting up EEGA Trust CRM Server...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/eega_trust_crm
JWT_SECRET=eega_trust_crm_secret_key_${Date.now()}
NODE_ENV=development`;
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created');
} else {
    console.log('✅ .env file already exists');
}

// Create uploads directory
const uploadDirs = ['uploads/children', 'uploads/staff', 'uploads/documents', 'uploads/reports'];
uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Check node_modules
if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    exec('npm install', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Error installing dependencies:', error);
            return;
        }
        console.log('✅ Dependencies installed');
        showNextSteps();
    });
} else {
    console.log('✅ Dependencies already installed');
    showNextSteps();
}

function showNextSteps() {
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Start MongoDB (if not running):');
    console.log('   • Windows: Check MongoDB Service is running');
    console.log('   • Mac/Linux: brew services start mongodb-community');
    console.log('\n2. Start the server:');
    console.log('   npm run dev');
    console.log('\n3. Test the API:');
    console.log('   node test-api.js');
    console.log('\n4. Open in browser:');
    console.log('   http://localhost:5000');
    console.log('   http://localhost:5000/api/docs');
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin:  admin@eega.com / admin123');
    console.log('   Staff:  staff@eega.com / staff123');
}
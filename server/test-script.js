
const API_URL = 'http://localhost:5000/api';

const fs = require('fs');
const logFile = 'test-results.log';
// Clear previous log
fs.writeFileSync(logFile, '');

const originalLog = console.log;
console.log = function (...args) {
    fs.appendFileSync(logFile, args.join(' ') + '\n');
    originalLog.apply(console, args);
};
const originalError = console.error;
console.error = function (...args) {
    fs.appendFileSync(logFile, 'ERROR: ' + args.join(' ') + '\n');
    originalError.apply(console, args);
};

async function testAPI() {
    try {
        console.log('0. Testing Auth Route Reachability...');
        try {
            const testRes = await fetch(`${API_URL}/auth/test`);
            const testData = await testRes.json();
            console.log('Auth Test:', testData.success ? 'Success' : 'Failed');
        } catch (e) {
            console.log('Auth Test Failed:', e.message);
        }

        console.log('1. Testing Health Endpoint...');
        const healthRes = await fetch('http://localhost:5000/health');
        const health = await healthRes.json();
        console.log('Health:', health.status);

        console.log('\n2. Registering a new user...');
        const email = `test${Date.now()}@example.com`;
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Agent',
                email: email,
                password: 'password123',
                role: 'staff'
            })
        });
        const registerData = await registerRes.json();
        if (!registerRes.ok) throw new Error(JSON.stringify(registerData));
        console.log('Registered User:', registerData.user.email);
        const token = registerData.token;

        console.log('\n3. Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
        console.log('Login Success:', loginData.success);

        console.log('\n4. Fetching Profile...');
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        console.log('Profile Name:', profileData.user.name);

        console.log('\n5. Registering an Admin...');
        const adminEmail = `admin${Date.now()}@example.com`;
        const adminRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Admin Agent',
                email: adminEmail,
                password: 'admin123',
                role: 'admin'
            })
        });
        const adminData = await adminRes.json();
        if (!adminRes.ok) throw new Error(JSON.stringify(adminData));
        const adminToken = adminData.token;
        console.log('Admin Registered');

        console.log('\n6. Creating a Child (as Admin)...');
        const childRes = await fetch(`${API_URL}/children`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'Baby Yoda',
                dateOfBirth: '2020-01-01',
                gender: 'male',
                background: 'Found in a pod',
                status: 'active'
            })
        });
        const childData = await childRes.json();
        if (!childRes.ok) throw new Error(JSON.stringify(childData));
        console.log('Child Created:', childData.child.name);

        console.log('\n7. Fetching Children...');
        const childrenRes = await fetch(`${API_URL}/children`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const childrenData = await childrenRes.json();
        console.log('Children Count:', childrenData.count);

        console.log('\n8. Fetching Staff (Admin)...');
        const staffRes = await fetch(`${API_URL}/staff`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const staffData = await staffRes.json();
        console.log('Staff Count:', staffData.count);

        console.log('\n9. Fetching Available Staff...');
        const availStaffRes = await fetch(`${API_URL}/staff/available`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const availStaffData = await availStaffRes.json();
        console.log('Available Staff:', availStaffData.count);

        console.log('\n10. Fetching Reports...');
        const reportsRes = await fetch(`${API_URL}/reports`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const reportsData = await reportsRes.json();
        console.log('Reports Count:', reportsData.count);

        console.log('\n✅ All Tests Passed!');

    } catch (error) {
        fs.writeFileSync('test-error.log', error.message);
        console.error('❌ Test Failed. See test-error.log');
    }
}

testAPI();

testAPI();

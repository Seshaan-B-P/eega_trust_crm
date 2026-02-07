// test-api.js - Test all API endpoints
const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

console.log('🧪 Testing EEGA Trust CRM API...\n');

async function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('1. Testing server status...');
    
    // Test 1: Home endpoint
    try {
        const home = await makeRequest('GET', '/');
        console.log(`   ✅ Home: ${home.status} - ${home.data.message}`);
    } catch (error) {
        console.log(`   ❌ Home: ${error.message}`);
    }
    
    // Test 2: Health check
    try {
        const health = await makeRequest('GET', '/health');
        console.log(`   ✅ Health: ${health.status} - ${health.data.status}`);
    } catch (error) {
        console.log(`   ❌ Health: ${error.message}`);
    }
    
    console.log('\n2. Testing authentication...');
    
    // Test 3: Login with admin
    try {
        const login = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@eega.com',
            password: 'admin123'
        });
        
        if (login.status === 200 && login.data.success) {
            authToken = login.data.token;
            console.log(`   ✅ Admin Login: Success - Token received`);
        } else {
            console.log(`   ❌ Admin Login: Failed - ${login.data.message}`);
        }
    } catch (error) {
        console.log(`   ❌ Admin Login: ${error.message}`);
    }
    
    // Test 4: Login with staff
    try {
        const login = await makeRequest('POST', '/api/auth/login', {
            email: 'staff@eega.com',
            password: 'staff123'
        });
        
        if (login.status === 200 && login.data.success) {
            console.log(`   ✅ Staff Login: Success`);
        } else {
            console.log(`   ❌ Staff Login: Failed - ${login.data.message}`);
        }
    } catch (error) {
        console.log(`   ❌ Staff Login: ${error.message}`);
    }
    
    if (authToken) {
        console.log('\n3. Testing child management...');
        
        // Test 5: Get all children (with auth)
        try {
            const children = await makeRequest('GET', '/api/children', null, {
                'Authorization': `Bearer ${authToken}`
            });
            
            if (children.status === 200 && children.data.success) {
                console.log(`   ✅ Get Children: Success - ${children.data.count} children found`);
            } else {
                console.log(`   ❌ Get Children: Failed - ${children.data.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Get Children: ${error.message}`);
        }
        
        // Test 6: Get child by ID
        try {
            const child = await makeRequest('GET', '/api/children/1', null, {
                'Authorization': `Bearer ${authToken}`
            });
            
            if (child.status === 200 && child.data.success) {
                console.log(`   ✅ Get Child: Success - ${child.data.child.name}`);
            } else {
                console.log(`   ❌ Get Child: Failed - ${child.data.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Get Child: ${error.message}`);
        }
        
        // Test 7: Create new child (admin only)
        try {
            const newChild = await makeRequest('POST', '/api/children', {
                name: 'Test Child',
                dateOfBirth: '2018-05-15',
                gender: 'male',
                background: 'Test background',
                medicalHistory: 'None',
                allergies: 'None'
            }, {
                'Authorization': `Bearer ${authToken}`
            });
            
            if (newChild.status === 201 && newChild.data.success) {
                console.log(`   ✅ Create Child: Success - ${newChild.data.child.childId}`);
            } else {
                console.log(`   ❌ Create Child: Failed - ${newChild.data.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Create Child: ${error.message}`);
        }
    }
    
    console.log('\n4. Testing unprotected endpoints...');
    
    // Test 8: API documentation
    try {
        const docs = await makeRequest('GET', '/api/docs');
        if (docs.status === 200) {
            console.log(`   ✅ API Docs: Available`);
        }
    } catch (error) {
        console.log(`   ❌ API Docs: ${error.message}`);
    }
    
    console.log('\n📊 Testing complete!');
    console.log('💡 Try these URLs in your browser:');
    console.log(`   • http://localhost:5000`);
    console.log(`   • http://localhost:5000/api/docs`);
    console.log(`   • http://localhost:5000/health`);
}

// Run tests
runTests().catch(console.error);
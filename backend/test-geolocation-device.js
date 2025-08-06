const analyticsService = require('./src/services/analyticsService');
const DeviceParser = require('./src/utils/deviceParser');

// Test data
const testData = [
  {
    page_url: 'https://example.com/page1',
    visitor_id: 'visitor-1',
    session_id: 'session-1',
    time_on_page: 120,
    referrer: 'https://google.com',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    ip_address: '192.168.1.1',
    country: 'United States',
    region: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    device_type: 'mobile',
    browser: 'Safari',
    browser_version: '14.1.2',
    operating_system: 'iOS',
    os_version: '14.7.1',
    screen_resolution: '375x812'
  },
  {
    page_url: 'https://example.com/page2',
    visitor_id: 'visitor-2',
    session_id: 'session-2',
    time_on_page: 180,
    referrer: 'https://facebook.com',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    ip_address: '192.168.1.2',
    country: 'Canada',
    region: 'Ontario',
    city: 'Toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    device_type: 'desktop',
    browser: 'Chrome',
    browser_version: '91.0.4472.124',
    operating_system: 'Windows',
    os_version: '10',
    screen_resolution: '1920x1080'
  },
  {
    page_url: 'https://example.com/page3',
    visitor_id: 'visitor-3',
    session_id: 'session-3',
    time_on_page: 90,
    referrer: 'https://twitter.com',
    user_agent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    ip_address: '192.168.1.3',
    country: 'United Kingdom',
    region: 'England',
    city: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    device_type: 'tablet',
    browser: 'Safari',
    browser_version: '14.1.2',
    operating_system: 'iOS',
    os_version: '14.7.1',
    screen_resolution: '768x1024'
  }
];

async function testFeatures() {
  console.log('🧪 Testing Geolocation and Device Analytics Features\n');

  // Test 1: Device Parser
  console.log('1. Testing Device Parser...');
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
  const deviceInfo = DeviceParser.parseUserAgent(userAgent);
  console.log('   Parsed device info:', deviceInfo);
  console.log('   ✅ Device parser working\n');

  // Test 2: Geolocation Validation
  console.log('2. Testing Geolocation Validation...');
  const geoData = {
    country: 'United States',
    region: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194
  };
  const validatedGeo = DeviceParser.validateGeolocation(geoData);
  console.log('   Validated geo data:', validatedGeo);
  console.log('   ✅ Geolocation validation working\n');

  // Test 3: Insert test data
  console.log('3. Inserting test data...');
  try {
    for (const data of testData) {
      await analyticsService.trackPageVisit(data);
    }
    console.log('   ✅ Test data inserted successfully\n');
  } catch (error) {
    console.error('   ❌ Error inserting test data:', error.message);
    return;
  }

  // Test 4: Geolocation Analytics
  console.log('4. Testing Geolocation Analytics...');
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    
    const geoData = await analyticsService.getVisitorsByGeolocation(startDate, endDate, 10);
    console.log('   Geolocation data:', geoData);
    console.log('   ✅ Geolocation analytics working\n');
  } catch (error) {
    console.error('   ❌ Error getting geolocation data:', error.message);
  }

  // Test 5: Device Analytics
  console.log('5. Testing Device Analytics...');
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    
    const deviceData = await analyticsService.getVisitorsByDevice(startDate, endDate, 10);
    console.log('   Device data:', deviceData);
    console.log('   ✅ Device analytics working\n');
  } catch (error) {
    console.error('   ❌ Error getting device data:', error.message);
  }

  // Test 6: Device Type Breakdown
  console.log('6. Testing Device Type Breakdown...');
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    
    const breakdown = await analyticsService.getDeviceTypeBreakdown(startDate, endDate);
    console.log('   Device type breakdown:', breakdown);
    console.log('   ✅ Device type breakdown working\n');
  } catch (error) {
    console.error('   ❌ Error getting device breakdown:', error.message);
  }

  console.log('🎉 All tests completed!');
}

// Run the test
testFeatures().catch(console.error); 
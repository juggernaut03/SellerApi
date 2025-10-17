/**
 * Build Verification Script
 * Checks all modules can be loaded without errors
 */

console.log('🔍 Starting build verification...\n');

const errors = [];
const warnings = [];

// Test 1: Check all config files
console.log('✓ Checking config files...');
try {
  require('./config/env');
  console.log('  ✓ config/env.js');
} catch (e) {
  errors.push(`config/env.js: ${e.message}`);
}

try {
  require('./config/logger');
  console.log('  ✓ config/logger.js');
} catch (e) {
  errors.push(`config/logger.js: ${e.message}`);
}

// Note: db.js requires actual MongoDB connection, skip for build check
console.log('  ⚠ config/db.js (skipped - requires MongoDB)');

// Test 2: Check all models
console.log('\n✓ Checking models...');
const models = ['User', 'Inventory', 'Shipment', 'Box', 'Defect', 'Finance'];
models.forEach(model => {
  try {
    require(`./models/${model}`);
    console.log(`  ✓ models/${model}.js`);
  } catch (e) {
    errors.push(`models/${model}.js: ${e.message}`);
  }
});

// Test 3: Check all utilities
console.log('\n✓ Checking utilities...');
const utils = ['jwtHelper', 'responseHandler', 'exportCSV', 'exportExcel', 'fileUploader', 'pdfGenerator'];
utils.forEach(util => {
  try {
    require(`./utils/${util}`);
    console.log(`  ✓ utils/${util}.js`);
  } catch (e) {
    errors.push(`utils/${util}.js: ${e.message}`);
  }
});

// Test 4: Check all middleware
console.log('\n✓ Checking middleware...');
const middleware = ['authMiddleware', 'roleMiddleware', 'errorMiddleware'];
middleware.forEach(mw => {
  try {
    require(`./middleware/${mw}`);
    console.log(`  ✓ middleware/${mw}.js`);
  } catch (e) {
    errors.push(`middleware/${mw}.js: ${e.message}`);
  }
});

// Test 5: Check all services
console.log('\n✓ Checking services...');
const services = ['inventoryService', 'shipmentService', 'defectService', 'financeService', 'exportService', 'packGroupService'];
services.forEach(service => {
  try {
    require(`./services/${service}`);
    console.log(`  ✓ services/${service}.js`);
  } catch (e) {
    errors.push(`services/${service}.js: ${e.message}`);
  }
});

// Test 6: Check all controllers
console.log('\n✓ Checking controllers...');
const controllers = ['authController', 'userController', 'inventoryController', 'shipmentController', 'defectController', 'financeController', 'exportController', 'packGroupController'];
controllers.forEach(controller => {
  try {
    require(`./controllers/${controller}`);
    console.log(`  ✓ controllers/${controller}.js`);
  } catch (e) {
    errors.push(`controllers/${controller}.js: ${e.message}`);
  }
});

// Test 7: Check all routes
console.log('\n✓ Checking routes...');
const routes = ['authRoutes', 'userRoutes', 'inventoryRoutes', 'shipmentRoutes', 'defectRoutes', 'financeRoutes', 'exportRoutes', 'packGroupRoutes'];
routes.forEach(route => {
  try {
    require(`./routes/${route}`);
    console.log(`  ✓ routes/${route}.js`);
  } catch (e) {
    errors.push(`routes/${route}.js: ${e.message}`);
  }
});

// Test 8: Check app.js
console.log('\n✓ Checking app.js...');
try {
  require('./app');
  console.log('  ✓ app.js');
} catch (e) {
  errors.push(`app.js: ${e.message}`);
}

// Test 9: Check environment variables
console.log('\n✓ Checking environment variables...');
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    warnings.push(`Missing environment variable: ${envVar}`);
  } else {
    console.log(`  ✓ ${envVar} is set`);
  }
});

// Test 10: Check package.json
console.log('\n✓ Checking package.json...');
try {
  const pkg = require('./package.json');
  const requiredDeps = ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'cors', 'dotenv', 'winston', 'morgan'];
  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`  ✓ ${dep} (${pkg.dependencies[dep]})`);
    } else {
      errors.push(`Missing dependency: ${dep}`);
    }
  });
} catch (e) {
  errors.push(`package.json: ${e.message}`);
}

// Results
console.log('\n' + '='.repeat(60));
console.log('📊 Build Verification Results');
console.log('='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ BUILD SUCCESSFUL!');
  console.log('   All modules loaded successfully.');
  console.log('\n📝 Next steps:');
  console.log('   1. Ensure MongoDB is running');
  console.log('   2. Update .env with correct credentials');
  console.log('   3. Run: npm run dev');
  process.exit(0);
} else {
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach(e => console.log(`   - ${e}`));
    console.log('\n🔧 Please fix the errors above before running the server.');
    process.exit(1);
  } else {
    console.log('\n⚠️  BUILD COMPLETED WITH WARNINGS');
    console.log('   The application should work, but check the warnings above.');
    process.exit(0);
  }
}


/**
 * Install test dependencies if needed
 * Useful for setting up test environment
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkAndInstallDeps() {
  console.log('🔍 Checking test dependencies...\n');
  
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDevDeps = {
    'jest': '^30.1.3',
    '@types/jest': '^30.0.0',
    'jest-environment-jsdom': '^30.1.2'
  };
  
  const requiredDeps = {
    // All test dependencies are already in devDependencies
  };
  
  const missingDeps = [];
  const missingDevDeps = [];
  
  // Check dev dependencies
  Object.entries(requiredDevDeps).forEach(([dep, version]) => {
    if (!packageJson.devDependencies[dep]) {
      missingDevDeps.push(`${dep}@${version}`);
    }
  });
  
  // Check dependencies
  Object.entries(requiredDeps).forEach(([dep, version]) => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(`${dep}@${version}`);
    }
  });
  
  if (missingDeps.length === 0 && missingDevDeps.length === 0) {
    console.log('✅ All test dependencies are already installed!');
    return;
  }
  
  console.log('📦 Installing missing test dependencies...\n');
  
  try {
    if (missingDeps.length > 0) {
      console.log('Installing dependencies:', missingDeps.join(' '));
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    }
    
    if (missingDevDeps.length > 0) {
      console.log('Installing dev dependencies:', missingDevDeps.join(' '));
      execSync(`npm install -D ${missingDevDeps.join(' ')}`, { stdio: 'inherit' });
    }
    
    console.log('\n✅ All test dependencies installed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkAndInstallDeps();
}

module.exports = { checkAndInstallDeps };

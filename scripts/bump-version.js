/* eslint-env node */
const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Error: Please provide the new version number as an argument.');
  console.log('Usage: node scripts/bump-version.js <new_version>');
  process.exit(1);
}

// Validate basic semver format (x.y.z)
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.warn(`Warning: "${newVersion}" does not look like a standard semantic version (x.y.z). Proceeding anyway...`);
}

const files = [
  {
    path: 'app.json',
    replace: (content) => content.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`),
    name: 'app.json'
  },
  {
    path: 'app.config.ts',
    replace: (content) => content.replace(/version:\s*'[^']+'/, `version: '${newVersion}'`),
    name: 'app.config.ts'
  },
  {
    path: 'android/app/build.gradle',
    replace: (content) => content.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`),
    name: 'android/app/build.gradle'
  },
  {
    path: 'ios/FinnDev/Info.plist',
    replace: (content) => content.replace(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
      `$1${newVersion}$2`
    ),
    name: 'ios/FinnDev/Info.plist'
  }
];

let errors = false;

files.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file.path);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const newContent = file.replace(content);
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Updated ${file.name}`);
      } else {
        // Check if the version is already correct, otherwise regex failed
        if (content.includes(newVersion)) {
             console.log(`ℹ  ${file.name} is already set to ${newVersion}`);
        } else {
             console.error(`❌ Failed to update ${file.name}: Regex match failed. Please check file formatting.`);
             errors = true;
        }
      }
    } else {
      console.error(`❌ File not found: ${file.path}`);
      errors = true;
    }
  } catch (err) {
    console.error(`❌ Error processing ${file.name}:`, err.message);
    errors = true;
  }
});

if (errors) {
  process.exit(1);
} else {
  console.log(`
Successfully bumped version to ${newVersion} 🎉`);
}

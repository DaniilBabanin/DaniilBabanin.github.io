const { exec } = require('child_process');
const fs = require('fs');

// Function to run a command
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Minify JavaScript files
async function minifyJS() {
  try {
    console.log('Minifying JavaScript files...');
    
    // Minify app.js
    await runCommand('npx terser app.js -o app.min.js -c -m');
    console.log('Minified app.js -> app.min.js');
    
    // Minify imprint.js
    await runCommand('npx terser imprint.js -o imprint.min.js -c -m');
    console.log('Minified imprint.js -> imprint.min.js');
    
    // Minify particles-webgl.js
    await runCommand('npx terser particles-webgl.js -o particles-webgl.min.js -c -m');
    console.log('Minified particles-webgl.js -> particles-webgl.min.js');
    
    // Minify i18n/i18n.js
    await runCommand('npx terser ./i18n/i18n.js -o ./i18n/i18n.min.js -c -m');
    await runCommand('npx terser ./i18n/shared.js -o ./i18n/shared.min.js -c -m');
    await runCommand('npx terser ./i18n/translations-de.js -o ./i18n/translations-de.min.js -c -m');
    await runCommand('npx terser ./i18n/translations-en.js -o ./i18n/translations-en.min.js -c -m');
    console.log('Minified ./i18n/ ');

    // Minify css
    await runCommand('npx minify style.css > style.min.css');
    console.log('Minified css ');

    console.log('JavaScript minification complete!');
  } catch (error) {
    console.error('Error during minification:', error);
  }
}

// Run the minification process
minifyJS();

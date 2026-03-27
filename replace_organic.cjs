const fs = require('fs');
const path = require('path');

const replacements = [
    ['জিরো টু ওয়ান - সামারি বুক', 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট'],
    ['জিরো টু ওয়ান', 'অর্গানিক স্কিন কেয়ার'],
    ['https://zero.shehzin.com', 'https://organic.shehzin.com'],
    ['zero.shehzin.com', 'organic.shehzin.com'],
    ['Zero to One', 'Organic Skin Care'],
    ['পিটার থিয়েল', 'রায়হান পাটোয়ারী'],
    ['Zero Panel', 'Organic Panel'],
    ['endingsc_zero', 'endingsc_organic'],
    ['Zero724273269@', 'Organic724273269@'],
    ['ZTO', 'ORG'],
    ['Zero', 'Organic'],
    ['zero', 'organic']
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(path.join(dir, f));
        }
    });
}

walkDir(__dirname, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.php') || filePath.endsWith('.html') || filePath.endsWith('.json') || filePath.endsWith('.sql')) {
        if (filePath.includes('package-lock.json')) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        // Special case for transaction ID prefix
        if (filePath.endsWith('checkout.php') || filePath.endsWith('server.ts') || filePath.endsWith('PaymentModal.tsx')) {
            newContent = newContent.replace(/'ZTO'/g, "'Organic'");
            newContent = newContent.replace(/"ZTO"/g, '"Organic"');
        }

        replacements.forEach(([search, replace]) => {
            newContent = newContent.split(search).join(replace);
        });

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});

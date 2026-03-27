const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
            modified = true;
        }
    }
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
                walkDir(dirPath, callback);
            }
        } else {
            if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx') || dirPath.endsWith('.php') || dirPath.endsWith('.html') || dirPath.endsWith('.json')) {
                callback(dirPath);
            }
        }
    });
}

const replacements = [
    ['think.shehzin.com', 'zero.shehzin.com'],
    ['atomic.shehzin.com', 'zero.shehzin.com'],
    ['থিংক এন্ড গ্রো রিচ - সামারি বুক', 'জিরো টু ওয়ান - সামারি বুক'],
    ['থিংক এন্ড গ্রো রিচ', 'জিরো টু ওয়ান'],
    ['নেপোলিয়ন হিল', 'পিটার থিয়েল'],
    ['TGR_', 'ZERO_'],
    ['Tgr724273269@', 'Zero724273269@'],
    ['endingsc_think', 'endingsc_zero'],
    ['Think and Grow Rich', 'Zero to One'],
    ['TGR Panel', 'Zero Panel']
];

walkDir(__dirname, (filePath) => {
    if (filePath === __filename) return;
    replaceInFile(filePath, replacements);
});

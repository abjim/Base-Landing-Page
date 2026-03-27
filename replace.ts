import * as fs from 'fs';
import * as path from 'path';

const replacements: [string, string][] = [
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

function walkDir(dir: string, callback: (filePath: string) => void) {
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

walkDir(process.cwd(), function(filePath: string) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.php') || filePath.endsWith('.html') || filePath.endsWith('.json') || filePath.endsWith('.sql')) {
        if (filePath.includes('package-lock.json') || filePath.includes('replace.ts')) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        replacements.forEach(([search, replace]) => {
            newContent = newContent.split(search).join(replace);
        });

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});

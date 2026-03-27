const fs = require('fs');
const path = require('path');

const files = ['AdminDashboard.tsx', 'AdminSetup.tsx', 'DevGuide.tsx', 'ErrorBoundary.tsx', 'DesignShowcase.tsx', 'PDFReader.tsx', 'SocialProofPopup.tsx'];

const replacements = [
  { from: /bg-brand-olive text-brand-charcoal/g, to: 'bg-brand-olive text-brand-ivory' },
  { from: /bg-brand-olive hover:bg-brand-leaf text-brand-charcoal/g, to: 'bg-brand-olive hover:bg-brand-leaf text-brand-ivory' },
  { from: /bg-brand-olive hover:bg-brand-leaf disabled:opacity-50 text-brand-charcoal/g, to: 'bg-brand-olive hover:bg-brand-leaf disabled:opacity-50 text-brand-ivory' },
  { from: /focus:border-cyan-500/g, to: 'focus:border-brand-olive' },
  { from: /text-cyan-600/g, to: 'text-brand-olive' },
  { from: /bg-cyan-600/g, to: 'bg-brand-olive' },
  { from: /border-cyan-500/g, to: 'border-brand-olive' },
  { from: /border-cyan-400/g, to: 'border-brand-olive' },
  { from: /ring-cyan-500/g, to: 'ring-brand-olive' },
  { from: /text-brand-charcoal text-sm font-bold animate-fade-in-up/g, to: 'text-white text-sm font-bold animate-fade-in-up' },
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'components', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Done fixing classes in ${file}`);
  }
});

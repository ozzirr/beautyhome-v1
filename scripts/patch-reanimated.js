const fs = require('fs');
const path = require('path');

const baseDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-reanimated',
  'lib',
  'module'
);

const isJsFile = (file) => file.endsWith('.js') && !file.endsWith('.map');

const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else if (stat.isFile() && isJsFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
};

const resolveSpecifier = (filePath, specifier) => {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return specifier;
  if (specifier.endsWith('.js')) return specifier;
  const absBase = path.resolve(path.dirname(filePath), specifier);
  const asFile = `${absBase}.js`;
  const asIndex = path.join(absBase, 'index.js');
  if (fs.existsSync(asIndex)) return `${specifier}/index.js`;
  if (fs.existsSync(asFile)) return `${specifier}.js`;
  return specifier;
};

const patchFile = (filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const pattern = /(from\s+['"])([^'\"]+)(['"])/g;
  const bareImportPattern = /(import\s+['"])([^'\"]+)(['"];?)/g;

  let updated = source.replace(pattern, (match, start, specifier, end) => {
    const next = resolveSpecifier(filePath, specifier);
    return `${start}${next}${end}`;
  });

  updated = updated.replace(bareImportPattern, (match, start, specifier, end) => {
    const next = resolveSpecifier(filePath, specifier);
    return `${start}${next}${end}`;
  });

  if (updated !== source) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
};

if (fs.existsSync(baseDir)) {
  const files = walk(baseDir);
  files.forEach(patchFile);
}

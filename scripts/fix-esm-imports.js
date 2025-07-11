const fs = require('fs-extra');
const path = require('path');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addJsExtensions(filePath);
    } else if (path.extname(file) === '.js') {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace relative imports to add .js extension
      content = content.replace(
        /from\s+['"](\.\/.+?)['"];?/g,
        (match, importPath) => {
          if (!importPath.endsWith('.js')) {
            return match.replace(importPath, importPath + '.js');
          }
          return match;
        }
      );
      
      content = content.replace(
        /import\s+['"](\.\/.+?)['"];?/g,
        (match, importPath) => {
          if (!importPath.endsWith('.js')) {
            return match.replace(importPath, importPath + '.js');
          }
          return match;
        }
      );
      
      fs.writeFileSync(filePath, content);
    }
  }
}

// Add .js extensions to ESM build
addJsExtensions('./dist/esm');
console.log('Added .js extensions to ESM imports');

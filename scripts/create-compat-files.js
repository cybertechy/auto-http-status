const fs = require('fs-extra');
const path = require('path');

/**
 * Creates backward compatibility files for CI and legacy tooling
 * that expect dist/index.js and dist/index.d.ts
 */

async function createCompatibilityFiles() {
  console.log('Creating backward compatibility files...');
  
  try {
    // Copy the CommonJS build to the root dist for backward compatibility
    await fs.copy('dist/cjs/index.js', 'dist/index.js');
    console.log('✅ Created dist/index.js (CommonJS build)');
    
    // Copy type definitions to the root dist
    await fs.copy('dist/types/index.d.ts', 'dist/index.d.ts');
    console.log('✅ Created dist/index.d.ts (Type definitions)');
    
    // Copy all CommonJS files to root for proper module resolution
    const cjsFiles = ['env-config.js', 'types.js'];
    for (const file of cjsFiles) {
      if (await fs.pathExists(`dist/cjs/${file}`)) {
        await fs.copy(`dist/cjs/${file}`, `dist/${file}`);
        console.log(`✅ Created dist/${file}`);
      }
    }
    
    // Copy the CommonJS layers directory for proper module resolution
    if (await fs.pathExists('dist/cjs/layers')) {
      await fs.copy('dist/cjs/layers', 'dist/layers');
      console.log('✅ Created dist/layers/ (CommonJS modules)');
    }
    
    // Also copy type definition files to root
    const typesFiles = ['env-config.d.ts', 'types.d.ts'];
    for (const file of typesFiles) {
      if (await fs.pathExists(`dist/types/${file}`)) {
        await fs.copy(`dist/types/${file}`, `dist/${file}`);
        console.log(`✅ Created dist/${file}`);
      }
    }
    
    // Copy the types layers directory for TypeScript compatibility
    if (await fs.pathExists('dist/types/layers')) {
      const layersExists = await fs.pathExists('dist/layers');
      if (!layersExists) {
        await fs.ensureDir('dist/layers');
      }
      
      // Copy TypeScript definition files to layers directory
      const typesLayersDir = 'dist/types/layers';
      const targetLayersDir = 'dist/layers';
      
      const layerFiles = await fs.readdir(typesLayersDir);
      for (const file of layerFiles) {
        if (file.endsWith('.d.ts')) {
          await fs.copy(path.join(typesLayersDir, file), path.join(targetLayersDir, file));
        }
      }
      console.log('✅ Enhanced dist/layers/ with TypeScript definitions');
    }
    
    console.log('Backward compatibility files created successfully!');
  } catch (error) {
    console.error('Error creating compatibility files:', error);
    process.exit(1);
  }
}

createCompatibilityFiles();

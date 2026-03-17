const fs = require('fs');
const path = require('path');
const root = __dirname;
const files = [
  'packages/core/src/index.ts',
  'packages/web/src/index.ts',
  'packages/react-native/src/index.ts',
  'packages/flutter/pubspec.yaml',
  'packages/flutter/lib/signet_flutter.dart',
  'packages/smart-contracts/Cargo.toml',
  'packages/smart-contracts/src/lib.rs',
  'packages/testing/src/index.ts',
  'examples/web-demo/src/index.ts',
  'examples/react-native-demo/src/index.ts',
  'examples/flutter-demo/pubspec.yaml',
  'examples/flutter-demo/lib/main.dart',
  'docs/README.md'
];

for (const f of files) {
  const fullPath = path.join(root, f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/\\n/g, '\n');
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${f}`);
  }
}

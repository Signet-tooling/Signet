const fs = require('fs');
const path = require('path');

const root = __dirname;

const dirs = [
  'packages/core/src',
  'packages/web/src',
  'packages/react-native/src',
  'packages/react-native/ios',
  'packages/react-native/android',
  'packages/flutter/lib',
  'packages/smart-contracts/src',
  'packages/testing/src',
  'examples/web-demo/src',
  'examples/react-native-demo/src',
  'examples/flutter-demo/lib',
  'docs'
];

dirs.forEach(d => fs.mkdirSync(path.join(root, d), { recursive: true }));

const files = {
  'pnpm-workspace.yaml': `packages:
  - 'packages/*'
  - 'examples/*'
`,
  'turbo.json': JSON.stringify({
    "$schema": "https://turbo.build/schema.json",
    "pipeline": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
      },
      "test": {
        "dependsOn": ["build"],
        "outputs": []
      },
      "dev": {
        "cache": false,
        "persistent": true
      }
    }
  }, null, 2),
  'package.json': JSON.stringify({
    "name": "signet-sdk-monorepo",
    "private": true,
    "scripts": {
      "build": "turbo run build",
      "test": "turbo run test",
      "dev": "turbo run dev"
    },
    "devDependencies": {
      "turbo": "^2.0.0",
      "typescript": "^5.4.0",
      "eslint": "^9.0.0",
      "prettier": "^3.2.0",
      "@changesets/cli": "^2.27.0"
    },
    "engines": {
      "node": ">=20.0.0",
      "pnpm": ">=9.0.0"
    }
  }, null, 2),

  'tsconfig.json': JSON.stringify({
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "declaration": true
    }
  }, null, 2),

  // Core
  'packages/core/package.json': JSON.stringify({
    "name": "@signet-sdk/core",
    "version": "0.1.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.ts --format cjs,esm --dts",
      "test": "vitest run"
    },
    "dependencies": {
      "@stellar/stellar-sdk": "^12.0.0",
      "@noble/curves": "^1.4.0",
      "@noble/hashes": "^1.4.0",
      "cbor-x": "^1.5.0",
      "buffer": "^6.0.3"
    },
    "devDependencies": {
      "tsup": "^8.0.0",
      "vitest": "^1.0.0",
      "typescript": "^5.4.0"
    }
  }, null, 2),
  'packages/core/tsconfig.json': JSON.stringify({
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }, null, 2),
  'packages/core/src/index.ts': 'export const coreVersion = "0.1.0";\\nexport const ping = () => "pong";\\n',

  // Web
  'packages/web/package.json': JSON.stringify({
    "name": "@signet-sdk/web",
    "version": "0.1.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.ts --format cjs,esm --dts",
      "test": "vitest run"
    },
    "dependencies": {
      "@signet-sdk/core": "workspace:*",
      "idb": "^8.0.0"
    },
    "devDependencies": {
      "tsup": "^8.0.0",
      "vitest": "^1.0.0",
      "@vitest/browser": "^1.0.0",
      "typescript": "^5.4.0"
    }
  }, null, 2),
  'packages/web/tsconfig.json': JSON.stringify({
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }, null, 2),
  'packages/web/src/index.ts': 'import { coreVersion } from "@signet-sdk/core";\\nexport const webVersion = "0.1.0";\\nexport const initWeb = () => console.log("Init Web Core:", coreVersion);\\n',

  // React Native
  'packages/react-native/package.json': JSON.stringify({
    "name": "@signet-sdk/react-native",
    "version": "0.1.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.ts --format cjs,esm --dts",
      "test": "vitest run"
    },
    "dependencies": {
      "@signet-sdk/core": "workspace:*"
    },
    "peerDependencies": {
      "react-native": ">=0.73.0",
      "expo-modules-core": ">=1.11.0"
    },
    "peerDependenciesMeta": {
      "expo-modules-core": {
        "optional": true
      }
    },
    "devDependencies": {
      "tsup": "^8.0.0",
      "vitest": "^1.0.0",
      "typescript": "^5.4.0",
      "@react-native-community/cli": "^12.0.0"
    }
  }, null, 2),
  'packages/react-native/tsconfig.json': JSON.stringify({
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }, null, 2),
  'packages/react-native/src/index.ts': 'import { coreVersion } from "@signet-sdk/core";\\nexport const rnVersion = "0.1.0";\\nexport const initRN = () => console.log("Init RN Core:", coreVersion);\\n',

  // Flutter
  'packages/flutter/pubspec.yaml': `name: signet_flutter\\ndescription: Flutter platform integration for Signet SDK.\\nversion: 0.1.0\\n\\nenvironment:\\n  sdk: ">=3.0.0 <4.0.0"\\n\\ndependencies:\\n  flutter:\\n    sdk: flutter\\n  stellar_flutter_sdk: ^1.7.0\\n  pointycastle: ^3.7.0\\n  cbor: ^6.3.0\\n  flutter_secure_storage: ^9.0.0\\n  crypto: ^3.0.3\\n  convert: ^3.1.1\\n\\ndev_dependencies:\\n  flutter_test:\\n    sdk: flutter\\n  mockito: ^5.4.4\\n  build_runner: ^2.4.8\\n`,
  'packages/flutter/lib/signet_flutter.dart': 'class SignetFlutter {\\n  static String ping() => "pong";\\n}\\n',

  // Smart Contracts
  'packages/smart-contracts/Cargo.toml': `[package]\\nname = "signet-contracts"\\nversion = "0.1.0"\\nedition = "2021"\\n\\n[workspace]\\nmembers = ["."]\\n\\n[dependencies]\\nsoroban-sdk = "21.0.0"\\nsoroban-auth = "21.0.0"\\n`,
  'packages/smart-contracts/src/lib.rs': '#![no_std]\\nuse soroban_sdk::{contract, contractimpl, Env};\\n\\n#[contract]\\npub struct SignetContract;\\n\\n#[contractimpl]\\nimpl SignetContract {\\n    pub fn check_auth(_env: Env) {}\\n}\\n',

  // Testing
  'packages/testing/package.json': JSON.stringify({
    "name": "@signet-sdk/testing",
    "version": "0.1.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsup src/index.ts --format cjs,esm --dts"
    },
    "dependencies": {
      "@signet-sdk/core": "workspace:*",
      "@noble/curves": "^1.4.0",
      "@stellar/stellar-sdk": "^12.0.0"
    },
    "devDependencies": {
      "tsup": "^8.0.0",
      "typescript": "^5.4.0",
      "vitest": "^1.0.0"
    }
  }, null, 2),
  'packages/testing/tsconfig.json': JSON.stringify({
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }, null, 2),
  'packages/testing/src/index.ts': 'export const testingVersion = "0.1.0";\\n',
  
  // Demos
  'examples/web-demo/package.json': JSON.stringify({
    "name": "web-demo",
    "private": true,
    "version": "0.1.0",
    "dependencies": {
      "@signet-sdk/web": "workspace:*"
    }
  }, null, 2),
  'examples/web-demo/tsconfig.json': JSON.stringify({
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }, null, 2),
  'examples/web-demo/src/index.ts': 'console.log("Web Demo");\\n',

  'examples/react-native-demo/package.json': JSON.stringify({
    "name": "react-native-demo",
    "private": true,
    "version": "0.1.0",
    "dependencies": {
      "@signet-sdk/react-native": "workspace:*"
    }
  }, null, 2),
  'examples/react-native-demo/tsconfig.json': JSON.stringify({
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }, null, 2),
  'examples/react-native-demo/src/index.ts': 'console.log("React Native Demo");\\n',

  'examples/flutter-demo/pubspec.yaml': `name: flutter_demo\\ndescription: Flutter Demo for Signet SDK.\\nversion: 0.1.0\\nenvironment:\\n  sdk: ">=3.0.0 <4.0.0"\\ndependencies:\\n  flutter:\\n    sdk: flutter\\n  signet_flutter:\\n    path: ../../packages/flutter\\n`,
  'examples/flutter-demo/lib/main.dart': 'void main() { print("Flutter Demo"); }\\n',

  // Docs
  'docs/README.md': '# Signet SDK Documentation\\n',
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(root, filepath), content);
}

console.log('Project setup complete.');

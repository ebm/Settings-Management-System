# Settings API - TypeScript Version

A RESTful API for managing schemaless Settings objects with full CRUD operations, built with **TypeScript**, **Node.js**, **Express**, and **PostgreSQL**.

## Why TypeScript?

TypeScript adds **static type checking** to JavaScript, catching errors at compile-time rather than runtime:

```typescript
// JavaScript - runtime error
const settings = await SettingsModel.findByUid(123);  // Oops! Should be string

// TypeScript - compile-time error
const settings = await SettingsModel.findByUid(123);  
// ❌ Error: Argument of type 'number' is not assignable to parameter of type 'string'
```

### Benefits over JavaScript
✅ **Type Safety**: Catch bugs before running code  
✅ **Better IDE Support**: Autocomplete, refactoring, navigation  
✅ **Self-Documenting**: Types serve as inline documentation  
✅ **Easier Refactoring**: Compiler finds all affected code  
✅ **Same Runtime**: Compiles to JavaScript, runs on Node.js  

### Trade-offs
⚠️ **Build Step Required**: Must compile TypeScript → JavaScript  
⚠️ **Learning Curve**: Need to learn type system  
⚠️ **More Verbose**: Type annotations add code  

## Features

- ✅ **Full Type Safety**: Every function, parameter, and return value is typed
- ✅ **Compile-Time Checks**: Errors caught before running
- ✅ **Same API**: Identical endpoints to JavaScript version
- ✅ **PostgreSQL JSONB**: Schemaless storage with type safety
- ✅ **Development Mode**: Auto-restart on file changes

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run init-db

# Development mode (auto-restart on changes)
npm run dev

# Or build and run production
npm run build
npm start
```

## Project Structure

```
src/
├── types.ts              # TypeScript type definitions
├── db.ts                 # Database connection (typed)
├── models/
│   └── settings.ts       # Data layer with type safety
├── controllers/
│   └── settings.ts       # Request handlers (typed)
├── routes/
│   └── settings.ts       # Route definitions
├── server.ts             # Main application
└── init-db.ts            # Database initialization

dist/                     # Compiled JavaScript (generated)
tsconfig.json             # TypeScript configuration
```

## Type System Examples

### Defining Types

```typescript
// types.ts
export interface SettingsData {
  [key: string]: any;  // Schemaless - any JSON structure
}

export interface Settings {
  uid: string;
  data: SettingsData;
  created_at: Date;
  updated_at: Date;
}
```

### Using Types

```typescript
// models/settings.ts
export class SettingsModel {
  // Return type is enforced
  static async create(data: SettingsData): Promise<SettingsResponse> {
    const uid = uuidv4();
    const query = 'INSERT INTO settings...';
    const results = await pool.query<Settings>(query, [uid, data]);
    return this.formatSettings(results[0]);  // ✅ Type-checked
  }
  
  // TypeScript ensures we return the right type
  static async findByUid(uid: string): Promise<SettingsResponse | null> {
    // If we forget to return, TypeScript errors
  }
}
```

### Type Inference

```typescript
// TypeScript automatically infers types
const settings = await SettingsModel.create({ theme: 'dark' });
// settings is typed as SettingsResponse automatically

settings.uid;        // ✅ OK
settings.theme;      // ✅ OK (from schemaless data)
settings.invalid;    // ⚠️ No error (schemaless allows anything)
settings._metadata;  // ✅ OK - IDE shows the structure
```

## Development Workflow

### Development Mode
```bash
npm run dev
```
- Uses `ts-node-dev` for auto-restart
- No build step required
- Instant feedback on changes

### Production Build
```bash
npm run build  # Compiles TypeScript → JavaScript in dist/
npm start      # Runs compiled JavaScript
```

## Configuration

### `tsconfig.json`
Controls how TypeScript compiles your code:

```json
{
  "compilerOptions": {
    "target": "ES2020",        // Output JavaScript version
    "module": "commonjs",       // Module system
    "strict": true,             // Enable all strict checks
    "outDir": "./dist",         // Output directory
    "rootDir": "./src",         // Source directory
    "esModuleInterop": true     // Better import compatibility
  }
}
```

**Key options**:
- `strict: true` - Maximum type safety (recommended)
- `noImplicitAny: true` - No implicit 'any' types
- `strictNullChecks: true` - Null/undefined must be explicit

## Type Safety in Action

### Example 1: Function Parameters

```typescript
// JavaScript - no protection
function createSettings(data) {
  return SettingsModel.create(data);  // What if data is undefined?
}

// TypeScript - guaranteed valid
function createSettings(data: SettingsData): Promise<SettingsResponse> {
  return SettingsModel.create(data);  // ✅ Must be SettingsData
}

createSettings(undefined);  // ❌ TypeScript error
```

### Example 2: API Responses

```typescript
// Controller is typed
static async getOne(req: Request, res: Response): Promise<Response> {
  const { uid } = req.params;  // string (from Express types)
  
  const settings = await SettingsModel.findByUid(uid);
  
  if (!settings) {
    // TypeScript knows ApiError structure
    return res.status(404).json({
      error: 'Not Found',
      message: `Settings not found`
    });
  }
  
  // TypeScript knows settings is SettingsResponse
  return res.status(200).json(settings);
}
```

### Example 3: Database Queries

```typescript
// Type-safe query helper
async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

// Usage with type inference
const settings = await query<Settings>(
  'SELECT * FROM settings WHERE uid = $1',
  [uid]
);
// settings is Settings[] - TypeScript knows the structure
```

## Common TypeScript Patterns

### Optional Properties
```typescript
interface User {
  id: string;
  name: string;
  email?: string;  // Optional (may be undefined)
}
```

### Union Types
```typescript
type Status = 'active' | 'inactive' | 'pending';
// Can only be one of these strings
```

### Generics
```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Use with any type
const response: PaginatedResponse<Settings> = await getAll();
```

### Type Guards
```typescript
function isValidSettings(data: any): data is SettingsData {
  return data && typeof data === 'object';
}

if (isValidSettings(req.body)) {
  // TypeScript knows req.body is SettingsData here
}
```

## Migrating from JavaScript

If you have the JavaScript version, migration is straightforward:

1. **Rename files**: `.js` → `.ts`
2. **Add type annotations**: Start with function signatures
3. **Fix errors**: TypeScript will highlight issues
4. **Gradually strengthen types**: Start loose, tighten over time

Example migration:
```javascript
// Before (JavaScript)
async function create(data) {
  const uid = uuidv4();
  const query = 'INSERT INTO...';
  return await pool.query(query, [uid, data]);
}

// After (TypeScript)
async function create(data: SettingsData): Promise<SettingsResponse> {
  const uid: string = uuidv4();
  const query: string = 'INSERT INTO...';
  return await pool.query<Settings>(query, [uid, data]);
}
```

## IDE Integration

### VS Code
- Install: `ESLint` and `Prettier` extensions
- TypeScript support is built-in
- Hover over any variable to see its type
- `F12` to jump to definition
- `Shift+F12` to find all references

### IntelliJ/WebStorm
- Full TypeScript support out of the box
- Advanced refactoring tools
- Type-aware code completion

## Testing with Types

```typescript
import request from 'supertest';
import app from '../src/server';

describe('Settings API', () => {
  it('should create settings', async () => {
    const response = await request(app)
      .post('/settings')
      .send({ theme: 'dark' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('uid');
    // TypeScript knows response.body structure
  });
});
```

## Performance

TypeScript has **zero runtime overhead**:
- Compiles to JavaScript
- Same performance as hand-written JS
- Types are stripped during compilation

Compilation time:
- Initial: ~2-5 seconds
- Incremental: ~100-500ms

## When to Use TypeScript

✅ **Good for:**
- Large codebases (100+ files)
- Team projects (multiple developers)
- Long-term maintenance
- Complex business logic
- APIs with many integrations

❌ **Overkill for:**
- Simple scripts (<100 lines)
- Prototypes/experiments
- Solo weekend projects
- When team doesn't know TypeScript

## Common Commands

```bash
# Development
npm run dev          # Auto-restart on changes

# Build
npm run build        # Compile to JavaScript

# Production
npm start            # Run compiled code

# Database
npm run init-db      # Initialize schema

# Testing
npm test             # Run tests with type checking
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run build
```

### Type errors in node_modules
```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true  // Skip type checking of dependencies
  }
}
```

### Strict mode too restrictive
```json
// tsconfig.json - loosen gradually
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true  // Enable checks one by one
  }
}
```

## Further Learning

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)

## Comparison with Other Versions

| Feature | TypeScript | JavaScript | Rust |
|---------|-----------|------------|------|
| Type Safety | Compile-time | None | Compile-time |
| Performance | Same as JS | Fast | Fastest |
| Learning Curve | Medium | Easy | Steep |
| Ecosystem | Huge (npm) | Huge (npm) | Growing |
| Build Time | ~Seconds | None | ~Minutes |
| Memory Usage | Node.js | Node.js | Minimal |
| Concurrency | Single-threaded | Single-threaded | Multi-threaded |

TypeScript is the **sweet spot** for most web APIs - it adds safety without sacrificing ecosystem or requiring a complete paradigm shift.

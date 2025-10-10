# 🗄️ Supabase Integration Guide

## 📊 Database Structure Overview

### **Connection Info**
- **Project**: design-bulk-import
- **Ref**: `tsnzjzhnseyhhtsxtmyq`
- **Region**: us-east-2
- **Status**: ACTIVE_HEALTHY

---

## 🔑 Key Tables & Relationships

### **1. users** (Main user table)
```sql
user_id TEXT PRIMARY KEY
display_name TEXT
email TEXT
avatar_url TEXT
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()
```

**Test User Created:**
- `user_id`: `'user_test'`
- `display_name`: `'John Doe'`
- `email`: `'john.doe@example.com'`
- `avatar_url`: `NULL` (can be updated later)

### **2. user_settings** (User preferences)
```sql
user_id TEXT PRIMARY KEY → users.user_id (CASCADE)
default_shop_id TEXT
default_preset_id TEXT → presets.id (SET NULL)
locale TEXT
timezone TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### **3. api_tokens** (Encrypted API tokens)
```sql
id TEXT PRIMARY KEY (auto: gen_random_uuid())
user_id TEXT → users.user_id (CASCADE)
provider ENUM('printify', 'shopify')
token_ref TEXT (reference to encrypted token)
enc_blob BYTEA (encrypted token data)
created_at TIMESTAMP
last_used_at TIMESTAMP
```

### **4. stores** (User's connected shops)
```sql
id TEXT PRIMARY KEY (auto: gen_random_uuid())
user_id TEXT → users.user_id (CASCADE)
provider ENUM('printify', 'shopify')
external_id TEXT (Printify shop ID)
name TEXT (Shop name)
token_ref TEXT (reference to api_tokens)
is_default BOOLEAN DEFAULT false
created_at TIMESTAMP
shop_id TEXT
```

### **5. imports** (Import job tracking)
```sql
id TEXT PRIMARY KEY (auto: gen_random_uuid())
user_id TEXT → users.user_id (CASCADE)
provider ENUM('printify', 'shopify')
store_id TEXT → stores.id (CASCADE)
token_ref TEXT
source ENUM('drive', 'upload')
drive_folder_id TEXT
status ENUM('queued', 'running', 'done', 'error', 'canceled')
total INTEGER DEFAULT 0
processed INTEGER DEFAULT 0
error_message TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### **6. import_events** (Import logs)
```sql
id BIGSERIAL PRIMARY KEY
import_id TEXT → imports.id
item_external_ref TEXT
event_type TEXT
severity TEXT
message TEXT
payload JSONB
created_at TIMESTAMP
```

### **7. presets** (Design presets)
```sql
id TEXT PRIMARY KEY (auto: gen_random_uuid())
user_id TEXT
name TEXT
provider ENUM('printify', 'shopify')
blueprint_id BIGINT
print_provider_id BIGINT
placements JSONB NOT EMPTY
visibility ENUM('private', 'team', 'public')
created_at TIMESTAMP
updated_at TIMESTAMP
```

### **8. assets** (Uploaded/imported files)
```sql
id TEXT PRIMARY KEY (auto: gen_random_uuid())
user_id TEXT
source ENUM('drive', 'upload')
drive_file_id TEXT
drive_folder_id TEXT
storage_path TEXT
file_name TEXT
file_ext TEXT
file_bytes BIGINT
width INTEGER
height INTEGER
checksum TEXT
created_at TIMESTAMP
```

### **9. asset_preset_assignments** (Link assets to presets)
```sql
id TEXT PRIMARY KEY (auto: gen_random_uuid())
user_id TEXT
asset_id TEXT → assets.id
preset_id TEXT → presets.id
created_at TIMESTAMP
```

### **10-12. Catalog Tables**
- **blueprints**: Product templates (t-shirts, mugs, etc.)
- **print_providers**: Print service providers
- **print_areas**: Printable zones on products

---

## 🔄 Current Wizard → Supabase Integration Plan

### **Step 1: Google Drive Folder**
**Current**: Validates folder URL, returns `folderId` and `fileCount`
**New with Supabase**:
```javascript
// After validation, store in assets table
INSERT INTO assets (user_id, source, drive_folder_id, file_name, ...)
VALUES ('user_test', 'drive', 'folder_id', 'filename.png', ...)
```

### **Step 2: Printify API Token**
**Current**: Validates token, returns `tokenRef` and `shops[]`
**New with Supabase**:
```javascript
// 1. Store encrypted token
INSERT INTO api_tokens (user_id, provider, token_ref, enc_blob)
VALUES ('user_test', 'printify', 'token_ref_123', encrypted_data)

// 2. Store shops
INSERT INTO stores (user_id, provider, external_id, name, token_ref)
VALUES ('user_test', 'printify', '23057120', 'My Shop', 'token_ref_123')
```

### **Step 3: Choose Shop**
**Current**: Logs shop selection to n8n
**New with Supabase**:
```javascript
// Update user settings with default shop
INSERT INTO user_settings (user_id, default_shop_id)
VALUES ('user_test', 'store_uuid_123')
ON CONFLICT (user_id) DO UPDATE SET default_shop_id = 'store_uuid_123'
```

### **Step 4: Preview Designs**
**Current**: Fetches file list from n8n
**New with Supabase**:
```javascript
// Query existing assets
SELECT * FROM assets 
WHERE user_id = 'user_test' 
AND drive_folder_id = 'folder_id'
```

### **Step 5: Import & Process**
**Current**: Triggers import, shows success/error
**New with Supabase**:
```javascript
// 1. Create import job
INSERT INTO imports (user_id, provider, store_id, source, drive_folder_id, status, total)
VALUES ('user_test', 'printify', 'store_uuid', 'drive', 'folder_id', 'queued', 10)
RETURNING id

// 2. Log events during import
INSERT INTO import_events (import_id, event_type, severity, message)
VALUES ('import_uuid', 'progress', 'info', 'Processing file 1/10')

// 3. Update import status
UPDATE imports 
SET status = 'done', processed = 10, updated_at = now()
WHERE id = 'import_uuid'
```

---

## 🎯 Integration Priority

### **Phase 1: User Profile (NOW)**
- ✅ Create/update user in `users` table
- ✅ Store display_name and avatar_url
- ✅ Query user data for profile page

### **Phase 2: Settings & Tokens**
- Store API tokens in `api_tokens`
- Store shops in `stores`
- Save user preferences in `user_settings`

### **Phase 3: Import Tracking**
- Create import jobs in `imports`
- Log events in `import_events`
- Display import history on profile

### **Phase 4: Assets & Presets**
- Store uploaded files in `assets`
- Create design presets
- Link assets to presets

---

## 🔧 Next Steps

1. **Create Supabase client** in Next.js
2. **Update user profile** to read/write from Supabase
3. **Migrate wizard flow** to use Supabase + n8n
4. **Add import history** page
5. **Implement presets** management

---

## 📝 Notes

- **user_id**: Currently using fixed `'user_test'`, will be replaced with real auth
- **token_ref**: Used to reference encrypted tokens without exposing them
- **ENUMs**: provider, asset_source, import_status, visibility
- **Foreign Keys**: CASCADE delete on user_id, SET NULL on optional references
- **Timestamps**: Auto-generated with `now()` default

---

**Last Updated**: October 10, 2025
**Branch**: feature/new-features


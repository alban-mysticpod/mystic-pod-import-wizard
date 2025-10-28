# 📊 Analyse du Flow Wizard - Étapes 1 à 3

## 🎯 Vue d'ensemble

Le wizard actuel suit ce flow :
```
Step 1 (Drive Folder) → Step 2 (Choose Shop) → Step 3 (Choose Blueprint)
```

---

## 📍 STEP 1 : Google Drive Folder

### État Initial
- **Props reçues** : `folderUrl`, `fileCount`, `sampleFiles`, `onNext`
- **State local** : `url`, `isLoading`, `error`, `validationResult`

### Actions Utilisateur
1. User colle l'URL du dossier Google Drive
2. Clic sur "Validate Folder"

### API Calls
#### 1. `validateDriveFolder(url)` → `/api/validate-folder`
```typescript
// Frontend: lib/api.ts
export async function validateDriveFolder(folderUrl: string) {
  const response = await fetch('/api/validate-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderUrl })
  });
  return response.json();
}

// Backend: app/api/validate-folder/route.ts
POST /api/validate-folder
Body: { folderUrl: string }
→ Calls n8n: https://n8n.srv874829.hstgr.cloud/webhook/validate-folder
Response: {
  folderId: string,
  fileCount: number,
  sampleFiles: Array<{ id: string, name: string }>,
  importId: string  // ← Généré par n8n, utilisé pour tracking
}
```

### Données transmises à Step 2
```typescript
onNext({
  folderUrl: string,
  folderId: string,
  fileCount: number,
  sampleFiles: Array<{ id: string, name: string }>,
  importId: string  // ← IMPORTANT : ID de tracking
});
```

### État du Wizard après Step 1
```typescript
wizardState = {
  currentStep: 2,
  folderUrl: "https://drive.google.com/...",
  folderId: "1abc...",
  fileCount: 42,
  sampleFiles: [...],
  importId: "import_123abc"  // ← Utilisé dans toutes les étapes suivantes
}
```

---

## 📍 STEP 2 : Choose Shop (Printify)

### État Initial
- **Props reçues** : `selectedShopId`, `importId`, `onNext`, `onBack`
- **State local** : 
  - `savedTokens[]` (tokens de l'user depuis Supabase)
  - `hasConnectedAccount` (boolean)
  - `selectedToken`, `newToken`, `newTokenName`
  - `shops[]`, `tokenRef`, `selectedShop`

### Flow au montage du composant

#### 1. Chargement des tokens sauvegardés
```typescript
useEffect(() => {
  loadSavedTokens();
}, []);

async function loadSavedTokens() {
  // Récupère les tokens depuis Supabase
  const response = await fetch(`/api/user/tokens?userId=${userId}&provider=printify`);
  const tokens: ApiToken[] = await response.json();
  
  if (tokens.length > 0) {
    setHasConnectedAccount(true);
    // Utilise automatiquement le premier token (le plus récent)
    await validateTokenAndLoadShops(tokens[0].token_ref);
  } else {
    setHasConnectedAccount(false);
    // Affiche le formulaire "Connect Printify Account"
  }
}
```

#### 2. Validation du token et chargement des shops

```typescript
async function validateTokenAndLoadShops(token: string, name?: string) {
  // Protection contre double appel
  if (validationInProgress.current.has(tokenKey)) return;
  validationInProgress.current.add(tokenKey);
  
  try {
    // ÉTAPE 1 : Valider le token Printify
    const tokenData = await verifyPrintifyToken(token, userId, importId, name);
    // → POST /api/validate-token
    // → Calls n8n: /webhook/verify-printify-token
    // → Crée/met à jour le record dans api_tokens table
    // Response: { id: "uuid", token_ref: "...", ... }
    
    // ÉTAPE 2 : Logger l'utilisation du token
    await logPrintifyApiToken(tokenData.id, userId, importId);
    // → POST /api/user/tokens/log
    // → Calls n8n: /webhook/log-printify-token
    // → Met à jour last_used_at dans api_tokens
    
    // ÉTAPE 3 : Lister les shops Printify
    const shopsData = await listPrintifyShops(userId, tokenData.id);
    // → POST /api/user/tokens/list-shops
    // → Calls n8n: /webhook/list-shops
    // Response: { shops: [...] }
    
    setShops(shopsData.shops);
    setTokenRef(token);
    setHasConnectedAccount(true);
  } finally {
    validationInProgress.current.delete(tokenKey);
  }
}
```

### API Calls dans Step 2

#### API 1: Validate Token
```typescript
POST /api/validate-token
Body: {
  apiToken: string,
  userId: string,
  importId: string,
  name?: string
}
→ n8n: /webhook/verify-printify-token
Response: {
  id: "token-uuid",
  user_id: "user_id",
  provider: "printify",
  token_ref: "eyJ0eXAi...",
  name: "My Store",
  is_default: false,
  created_at: "2025-10-28...",
  last_used_at: null
}
```

#### API 2: Log Token Usage
```typescript
POST /api/user/tokens/log
Body: {
  apiTokenId: "token-uuid",
  userId: string,
  importId: string
}
→ n8n: /webhook/log-printify-token
Response: { success: true }
```

#### API 3: List Shops
```typescript
POST /api/user/tokens/list-shops
Body: {
  userId: string,
  apiTokenId: "token-uuid"
}
→ n8n: /webhook/list-shops
Response: {
  shops: [
    { id: 22281922, title: "My Store" },
    ...
  ]
}
```

### Actions Utilisateur
1. **Si tokens existants** : Sélectionne un shop dans la liste
2. **Si nouveau token** : Entre le token → Valide → Sélectionne un shop
3. Clic sur "Continue"

### Sélection du shop et continuation

```typescript
async function handleContinue() {
  if (!selectedShop || !tokenRef) return;
  
  const userId = getUserId();
  
  // Appel à /api/choose-shop pour logger le shop sélectionné
  await chooseShop(tokenRef, selectedShop, userId, importId);
  // → POST /api/choose-shop
  // → Calls n8n: /webhook/log-printify-shop-id
  // → Crée un record dans stores table avec is_default
  
  // Passer au step suivant
  onNext({
    apiToken: selectedToken || newToken,
    tokenRef: tokenRef,
    shops: shops,
    shopId: selectedShop
  });
}
```

#### API 4: Choose Shop
```typescript
POST /api/choose-shop
Body: {
  apiTokenId: "token-uuid",  // NOT tokenRef (security)
  shopId: "22281922",
  userId: string,
  isDefault: boolean
}
→ n8n: /webhook/log-printify-shop-id
Response: {
  id: "store-uuid",
  user_id: "user_id",
  name: "My Store",
  provider: "printify",
  shop_id: "22281922",
  api_token: "token-uuid",
  is_default: true,
  created_at: "2025-10-28..."
}
```

### Données transmises à Step 3
```typescript
onNext({
  apiToken: string,      // Le token (pas utilisé après)
  tokenRef: string,      // Le token en clair (pour API Printify)
  shops: PrintifyShop[], // Liste complète (pas vraiment utilisée)
  shopId: number         // Shop sélectionné
});
```

### État du Wizard après Step 2
```typescript
wizardState = {
  currentStep: 3,
  folderUrl: "...",
  folderId: "...",
  fileCount: 42,
  sampleFiles: [...],
  importId: "import_123abc",
  apiToken: "...",       // ← Ajouté
  tokenRef: "eyJ0eXAi...", // ← Ajouté (token en clair)
  shops: [...],          // ← Ajouté
  selectedShopId: 22281922 // ← Ajouté
}
```

---

## 📍 STEP 3 : Choose Blueprint

### État Initial
- **Props reçues** : `selectedBlueprint`, `importId`, `tokenRef`, `onNext`, `onPresetNext`, `onPrintifyProductNext`, `onBack`
- **State local** :
  - `blueprints[]`, `presets[]`
  - `selected` (blueprint)
  - `selectedPreset`
  - `showPrintifyModal`, `printProviders[]`

### Flow au montage

#### 1. Chargement des blueprints
```typescript
useEffect(() => {
  loadBlueprints();
  loadPresets();
}, []);

async function loadBlueprints() {
  const response = await fetch('/api/blueprints?provider=printify');
  // → GET /api/blueprints (Next.js API route)
  // → Retourne la liste des blueprints depuis un fichier JSON local
  const data = await response.json();
  setBlueprints(data.blueprints);
}
```

#### 2. Chargement des presets
```typescript
async function loadPresets() {
  const response = await fetch('/api/presets');
  // → GET /api/presets
  // → Supabase: SELECT * FROM presets WHERE user_id = ?
  const data = await response.json();
  setPresets(data.presets);
}
```

### Trois options pour l'utilisateur

#### Option A : Sélectionner un preset existant
```typescript
function handlePresetSelect(preset: Preset) {
  setSelectedPreset(preset);
}

async function handleContinueWithPreset() {
  // Assigner le preset à l'import
  await assignPreset(importId, selectedPreset.id);
  // → POST /api/assign-preset
  // → Calls n8n: /webhook/assign-preset
  // Body: { importId, presetId }
  
  onPresetNext(selectedPreset);
  // → Skip au Step 5 (Mockups) directement !
}
```

#### Option B : Importer depuis Printify (produit existant)
```typescript
function handleImportFromPrintify() {
  setShowPrintifyModal(true);
  // Modal s'ouvre avec liste des produits Printify
}

async function handlePrintifyProductSelect(product: PrintifyProduct) {
  // Le produit contient déjà blueprint_id, print_provider_id, etc.
  onPrintifyProductNext(product);
  // → Skip au Step 5 (Mockups) directement !
}
```

#### Option C : Configuration manuelle (DÉSACTIVÉE POUR MVP)
```typescript
// Feature flag: ENABLE_MANUAL_CONFIGURATION = false
// Cette option est cachée dans le MVP
```

### API Calls dans Step 3

#### API 1: Get Blueprints (local)
```typescript
GET /api/blueprints?provider=printify
Response: {
  blueprints: [
    { id: 3, title: "T-Shirt", ... },
    { id: 6, title: "Mug", ... },
    ...
  ]
}
```

#### API 2: Get Presets (Supabase)
```typescript
GET /api/presets
Response: {
  presets: [
    {
      id: "preset-uuid",
      user_id: "user_id",
      name: "My Favorite Setup",
      blueprint_id: 3,
      print_provider_id: 99,
      favorite: true,
      placement_configs: {...},
      created_at: "..."
    },
    ...
  ]
}
```

#### API 3: Assign Preset (si preset sélectionné)
```typescript
POST /api/assign-preset
Body: {
  importId: string,
  presetId: string
}
→ n8n: /webhook/assign-preset
Response: { success: true }
```

#### API 4: List Printify Products (si "Import from Printify")
```typescript
GET /api/list-printify-products?tokenRef=...&page=1
→ Calls Printify API: GET /v1/shops/{shop_id}/products.json
Response: {
  products: [
    {
      id: "prod_123",
      title: "Cool T-Shirt",
      blueprint_id: 3,
      print_provider_id: 99,
      ...
    },
    ...
  ],
  total_number_of_products: 150,
  current_page: 1,
  next_page: 2,
  last_page: 15
}
```

### Données transmises après Step 3

**Si preset sélectionné :**
```typescript
onPresetNext(preset);
// → wizardState.selectedPreset = preset
// → wizardState.currentStep = 5 (skip step 4)
```

**Si produit Printify sélectionné :**
```typescript
onPrintifyProductNext(product);
// → wizardState.selectedPrintifyProduct = product
// → wizardState.currentStep = 5 (skip step 4)
```

---

## 🔑 Données Clés Utilisées

### ImportId
- **Créé à** : Step 1 (par n8n)
- **Utilisé dans** : Step 2 (validation token, log token, choose shop), Step 3 (assign preset)
- **But** : Tracker tout l'import du début à la fin

### TokenRef (API Token en clair)
- **Créé à** : Step 2 (lors de la validation)
- **Utilisé dans** : Step 3 (pour lister produits Printify), Steps suivants (pour appels Printify API)
- **But** : Authentifier les requêtes vers Printify

### ShopId
- **Sélectionné à** : Step 2
- **Utilisé dans** : Steps suivants (création de produits dans ce shop)
- **But** : Identifier le shop Printify de destination

---

## 🎯 Plan pour Supprimer Step 2

### Problème
Step 2 fait plusieurs choses critiques :
1. ✅ Valide le token Printify
2. ✅ Crée/met à jour le record dans `api_tokens`
3. ✅ Charge la liste des shops
4. ✅ User sélectionne un shop
5. ✅ Enregistre le shop dans `stores` avec `is_default`

### Solution avec ShopSelector dans Step 1

#### Nouvelles sources de données (depuis Settings)
- **Tokens disponibles** : `GET /api/user/tokens?userId=X&provider=printify`
- **Shops disponibles** : `GET /api/user/stores?userId=X`
- **Shop par défaut** : Shop avec `is_default = true` pour le provider

#### Flow proposé après suppression de Step 2

**Step 1 devient :**
1. User entre URL Google Drive
2. User sélectionne shop Printify (via ShopSelector - déjà par défaut)
3. User sélectionne shop Shopify (via ShopSelector - optionnel)
4. Clic "Continue"

**Données à récupérer au moment du "Continue" :**
```typescript
// Dans Step1, avant onNext()
const userId = getUserId();

// 1. Récupérer le shop sélectionné (Printify)
const selectedPrintifyStore = await getSelectedStore('printify');
// → GET /api/user/stores?userId=X
// → Filter by is_default + provider = 'printify'

// 2. Récupérer le token associé au shop
const tokenRecord = await getTokenForStore(selectedPrintifyStore.api_token);
// → GET /api/user/tokens?userId=X&tokenId=Y

// 3. Transmettre à Step 3 (en skippant Step 2)
onNext({
  folderUrl,
  folderId,
  fileCount,
  sampleFiles,
  importId,
  // Nouvelles données (normalement de Step 2)
  apiToken: tokenRecord.id,
  tokenRef: tokenRecord.token_ref,
  shops: [selectedPrintifyStore], // Pas vraiment nécessaire
  shopId: parseInt(selectedPrintifyStore.shop_id)
});
```

### API Calls à déplacer/modifier

#### Actuellement dans Step 2 → À déplacer où ?

1. **`verifyPrintifyToken`** → ❌ Plus nécessaire (déjà validé lors de la connexion dans Settings)
2. **`logPrintifyApiToken`** → 🔄 À appeler dans Step 1 (avant onNext)
3. **`listPrintifyShops`** → ❌ Plus nécessaire (shops déjà dans `stores` table)
4. **`chooseShop`** → ❌ Plus nécessaire (shop déjà sélectionné via `is_default`)

#### Nouvel appel dans Step 1 (optionnel)
```typescript
// Optionnel : Logger l'utilisation du token au début de l'import
await logPrintifyApiToken(tokenRecord.id, userId, importId);
// → POST /api/user/tokens/log
```

---

## 📝 Résumé des Changements Nécessaires

### 1. Wizard.tsx
- Supprimer `Step2ChooseShop` du rendu
- Modifier `handleStep1Next` pour inclure les données du shop sélectionné
- Ajuster la numérotation des steps (Step 3 → Step 2, etc.)

### 2. Step1DriveFolder.tsx
- Ajouter logique pour récupérer le shop sélectionné depuis ShopSelector
- Ajouter appel à `logPrintifyApiToken` avant `onNext()`
- Transmettre `tokenRef` et `shopId` dans les données

### 3. ShopSelector.tsx
- ✅ Déjà implémenté et fonctionnel
- Exposer une fonction `getSelectedStore()` pour récupérer le shop sélectionné

### 4. Step3ChooseBlueprint.tsx (devient Step2)
- ✅ Déjà reçoit `tokenRef` et `importId`
- Pas de changement nécessaire (sauf props interface)

### 5. Types
- Mettre à jour `WizardState` si nécessaire
- Ajuster `STEPS` array pour enlever Step 2

---

## ⚠️ Points d'Attention

1. **tokenRef** : Doit être récupéré depuis `api_tokens` table via l'ID stocké dans `stores.api_token`
2. **importId** : Toujours créé au Step 1, rien ne change
3. **Validation** : S'assurer qu'un shop est bien sélectionné avant de continuer
4. **Migration** : Les utilisateurs existants avec des tokens mais sans shops devront connecter un shop via Settings


# Mystic POD Drive → Printify Wizard

A Next.js wizard-style web app that allows users to seamlessly import designs from Google Drive to Printify. This frontend-only application connects to n8n webhooks for all backend operations.

## 🚀 Features

- **5-Step Wizard Flow**: Intuitive step-by-step process
- **Google Drive Integration**: Validate and preview designs from shared folders
- **Printify API Connection**: Test API tokens and select shops
- **Design Preview**: Thumbnail grid of all designs before import
- **Real-time Progress**: Live import progress with detailed logs
- **Responsive Design**: Beautiful UI that works on all devices
- **Error Handling**: Comprehensive error handling with retry options

## 🛠 Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **n8n Webhooks** for backend operations
- **Supabase** for database (managed by n8n)

## 📋 Prerequisites

- Node.js 18+ 
- n8n instance with configured webhooks
- Google Drive folder shared with `admin@mysticpod.com`
- Printify API token

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mystic-pod-drive-printify-wizard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your n8n webhook URLs:
   ```env
   NEXT_PUBLIC_WEBHOOK_DRIVE_VALIDATE=https://your-n8n-instance.com/webhook/drive/validate
   NEXT_PUBLIC_WEBHOOK_PRINTIFY_TEST=https://your-n8n-instance.com/webhook/printify/test
   NEXT_PUBLIC_WEBHOOK_SESSION_CHOOSE_SHOP=https://your-n8n-instance.com/webhook/session/choose-shop
   NEXT_PUBLIC_WEBHOOK_DRIVE_LIST=https://your-n8n-instance.com/webhook/drive/list
   NEXT_PUBLIC_WEBHOOK_PRINTIFY_IMPORT_START=https://your-n8n-instance.com/webhook/printify/import/start
   NEXT_PUBLIC_WEBHOOK_PRINTIFY_IMPORT_STATUS=https://your-n8n-instance.com/webhook/printify/import/status
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

### Deploy to Vercel

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel**
   - Go to your Vercel dashboard
   - Navigate to Project Settings → Environment Variables
   - Add all the webhook URLs from your `.env.local`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- **Netlify**: Use the Next.js build command
- **Railway**: Connect your GitHub repo
- **DigitalOcean App Platform**: Use the Next.js buildpack

## 🔌 API Integration

The app integrates with n8n webhooks for all backend operations:

### Webhook Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/drive/validate` | POST | Validate Google Drive folder URL |
| `/printify/test` | POST | Test Printify API token |
| `/session/choose-shop` | POST | Select Printify shop |
| `/drive/list` | POST | List files in Google Drive folder |
| `/printify/import/start` | POST | Start import process |
| `/printify/import/status` | GET/SSE | Get import progress |

### Request/Response Formats

#### Drive Validation
```typescript
// Request
{ folderUrl: string }

// Response
{ folderId: string, fileCount: number, sample: Array<{id: string, name: string}> }
```

#### Printify Test
```typescript
// Request
{ apiToken: string }

// Response
{ shops: Array<{id: number, title: string, sales_channel: string}>, tokenRef: string }
```

## 🎨 UI Components

### Core Components
- **Stepper**: Progress indicator with step navigation
- **Card**: Container component with consistent styling
- **Button**: Multi-variant button component
- **Input**: Form input with validation states
- **PreviewGrid**: Thumbnail grid for design preview
- **ProgressLog**: Real-time progress with logs

### Step Components
- **Step1DriveFolder**: Google Drive folder validation
- **Step2PrintifyToken**: API token validation
- **Step3ChooseShop**: Shop selection (conditional)
- **Step4Preview**: Design preview and confirmation
- **Step5Process**: Import progress and completion

## 🔄 User Flow

1. **Step 1**: User pastes Google Drive folder URL → validates folder → shows file count
2. **Step 2**: User enters Printify API token → validates token → retrieves shops
3. **Step 3**: (Optional) If multiple shops → user selects shop
4. **Step 4**: User previews designs → confirms import
5. **Step 5**: Import starts → real-time progress → completion/success

## 🎯 Key Features

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface

### Error Handling
- Input validation
- API error messages
- Retry mechanisms
- Graceful fallbacks

### Performance
- Optimized images with Next.js Image
- Lazy loading
- Minimal bundle size
- Fast page loads

### Accessibility
- Keyboard navigation
- Screen reader friendly
- High contrast support
- Focus management

## 🚦 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WEBHOOK_DRIVE_VALIDATE` | Drive folder validation webhook | Yes |
| `NEXT_PUBLIC_WEBHOOK_PRINTIFY_TEST` | Printify token test webhook | Yes |
| `NEXT_PUBLIC_WEBHOOK_SESSION_CHOOSE_SHOP` | Shop selection webhook | Yes |
| `NEXT_PUBLIC_WEBHOOK_DRIVE_LIST` | Drive files list webhook | Yes |
| `NEXT_PUBLIC_WEBHOOK_PRINTIFY_IMPORT_START` | Import start webhook | Yes |
| `NEXT_PUBLIC_WEBHOOK_PRINTIFY_IMPORT_STATUS` | Import status webhook | Yes |

## 🐛 Troubleshooting

### Common Issues

1. **Webhook URLs not working**
   - Check n8n instance is running
   - Verify webhook URLs are correct
   - Ensure CORS is configured

2. **Google Drive access denied**
   - Verify folder is shared with `admin@mysticpod.com`
   - Check folder URL format
   - Ensure folder has proper permissions

3. **Printify API errors**
   - Verify API token is correct
   - Check token permissions
   - Ensure shop is active

## 📝 License

This project is proprietary to Mystic POD.

## 🤝 Support

For support, please contact the Mystic POD team or create an issue in the repository.

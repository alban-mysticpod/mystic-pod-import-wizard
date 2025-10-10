# 🔧 Supabase Setup Guide

## 📋 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://tsnzjzhnseyhhtsxtmyq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🔑 How to Get Your Keys

### 1. Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/tsnzjzhnseyhhtsxtmyq/settings/api

### 2. Copy the Values
- **Project URL**: Copy the `URL` field
- **Service Role Key**: Copy the `service_role` key (⚠️ **secret**)

### 3. Create `.env.local`
```bash
# In the project root
touch .env.local

# Add the values:
SUPABASE_URL=https://tsnzjzhnseyhhtsxtmyq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Security Notes

### **NEVER:**
- ❌ Commit `.env.local` to Git
- ❌ Share the `SERVICE_ROLE_KEY` publicly
- ❌ Expose the key in frontend code

### **ALWAYS:**
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use `SERVICE_ROLE_KEY` only server-side
- ✅ Rotate keys if accidentally exposed

## 🧪 Testing

After adding the environment variables:

```bash
# Restart the dev server
npm run dev

# Test the API routes
curl http://localhost:3000/api/user/profile?userId=user_test
```

## 📊 Database Status

- **Project**: design-bulk-import
- **Ref**: tsnzjzhnseyhhtsxtmyq
- **Region**: us-east-2
- **RLS**: ✅ Enabled on all tables
- **Test User**: `user_test` (John Doe, john.doe@example.com)

## 🔄 Next Steps

1. ✅ Add environment variables to `.env.local`
2. ✅ Restart dev server
3. ✅ Test profile page: http://localhost:3000/profile
4. ✅ Test settings page: http://localhost:3000/profile/settings

---

**Last Updated**: October 10, 2025
**Branch**: feature/new-features


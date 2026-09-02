# WUTNYANG BUSINESS CENTER — deployment

## 1. Preserve Version 1, then publish Version 2
Do not replace the existing live Version 1 service. Keep it running as the rollback.

Create a separate private GitHub repository named `wutnyang-business-center-v2` and upload all files from this folder. This avoids changing the Version 1 repository or deployment.

## 2. Render
Create a new Render Web Service from the Version 2 repository. Do not connect this deployment to the Version 1 service.
Build Command: `npm install`
Start Command: `npm start`

Add these environment variables in Render:
SUPABASE_URL = https://eoyaunzknoowjldilbdp.supabase.co
SUPABASE_KEY = your Supabase publishable key

Do NOT put the key in the repository.

## 3. Supabase
The `transactions` table created earlier must exist. The current policy is suitable only for the initial connection test. Before real production use, add Supabase Auth and proper Row Level Security for Admin/Staff permissions.

## 4. Test
After Render deploys, open the new Render URL and first test the Admin login. Keep the old anonymous transaction policy in place at this stage. Once login is confirmed, test one small transaction and check Supabase > Table Editor > transactions to confirm it appears. Only then should Admin/Staff RLS policies be applied.

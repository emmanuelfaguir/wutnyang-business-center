# WUTNYANG BUSINESS CENTER — deployment

## 1. GitHub
Create a private GitHub repository named `wutnyang-business-center` and upload all files from this folder.

## 2. Render
Create a Web Service from that GitHub repository.
Build Command: `npm install`
Start Command: `npm start`

Add these environment variables in Render:
SUPABASE_URL = https://eoyaunzknoowjldilbdp.supabase.co/rest/v1
SUPABASE_KEY = your Supabase publishable key

Do NOT put the key in the repository.

## 3. Supabase
The `transactions` table created earlier must exist. The current policy is suitable only for the initial connection test. Before real production use, add Supabase Auth and proper Row Level Security for Admin/Staff permissions.

## 4. Test
After Render deploys, open the Render URL and test one small transaction. Then check Supabase > Table Editor > transactions to confirm it appears.

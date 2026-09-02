# WUTNYANG BUSINESS CENTER — Version 2

This version adds a Supabase email/password login screen and associates new transactions
with the logged-in user's Auth ID.

IMPORTANT:
- Keep the existing working deployment as a rollback.
- Do not remove the old anonymous transaction policy until Version 2 has been deployed and tested.
- After testing, the old open-access policy should be removed and proper RLS policies enabled.
- The publishable Supabase key is intentionally used by the browser; never place a Supabase secret/service-role key in this project.

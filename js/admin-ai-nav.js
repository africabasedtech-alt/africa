(function() {
  const PAGES = [
    { name: 'Admin Dashboard', href: 'Admin-panel.html', icon: 'fa-tachometer-alt', desc: 'Main admin panel — payment modes, announcements, system reset & sync', keywords: ['dashboard','home','main','panel','overview','payment mode','deposit mode','withdrawal mode','announcement','reset','sync','homepage','opportunities','testimonials'], superOnly: true },
    { name: 'User Management', href: 'admin-user.html', icon: 'fa-users', desc: 'View, search, edit users — balances, passwords, suspensions, impersonation', keywords: ['user','users','accounts','balance','suspend','password','impersonate','edit user','block','unblock','kyc','help user','lock','unlock','search user','find user','user list'] },
    { name: 'Products', href: 'admin-product.html', icon: 'fa-box', desc: 'Create, edit, disable products — set prices, returns, duration, units', keywords: ['product','products','investment','create product','add product','units','price','return','daily return','category','disable','enable','edit product','delete product','promo','free product'] },
    { name: 'Deposits', href: 'admin-deposit.html', icon: 'fa-money-bill-wave', desc: 'View deposit history, stats, search transactions, filter by status', keywords: ['deposit','deposits','payment','top up','topup','mpesa','m-pesa','deposit history','deposit stats','confirmed deposits','rejected deposits'] },
    { name: 'Withdrawals', href: 'admin-withdraw.html', icon: 'fa-money-bill-transfer', desc: 'View withdrawal history, stats, search transactions, filter by status', keywords: ['withdraw','withdrawal','withdrawals','payout','cash out','send money','withdrawal history','withdrawal stats','completed withdrawals'] },
    { name: 'Pending Approvals', href: 'admin-approve.html', icon: 'fa-clipboard-check', desc: 'Approve or reject pending deposits & withdrawals in manual mode', keywords: ['approve','reject','pending','approval','review','confirm','manual deposit','manual withdrawal','pending deposit','pending withdrawal','queue'] },
    { name: 'Sub-Admin Management', href: 'admin-management.html', icon: 'fa-user-shield', desc: 'Create invites, manage sub-admins, set permissions & privileges', keywords: ['sub-admin','subadmin','management','invite','permissions','privilege','role','access','create admin','admin invite','delete admin','edit admin','track admin','staff','team'], superOnly: true },
    { name: 'Exchange Codes', href: 'admin-exchange.html', icon: 'fa-exchange-alt', desc: 'Generate and manage currency exchange/redemption codes for users', keywords: ['exchange','code','codes','exchange code','generate code','currency','voucher','redemption','redeem','gift','coupon','promo code'] },
    { name: 'Settings', href: 'admin-settings.html', icon: 'fa-cog', desc: 'System settings — maintenance mode, login PINs, site configuration', keywords: ['settings','config','configuration','maintenance','pin','security','system','maintenance mode','site config'] },
    { name: 'Services', href: 'admin-service.html', icon: 'fa-concierge-bell', desc: 'Manage WhatsApp groups and support managers for user assistance', keywords: ['service','services','add service','manage service','whatsapp','support','group','manager','contact'] },
    { name: 'Referrals', href: 'admin-referrals.html', icon: 'fa-network-wired', desc: 'View referral tree, commissions, and referral activity', keywords: ['referral','referrals','commission','invite','refer','tree','network','downline','mlm'] },
    { name: 'Pending Applications', href: 'admin-pending-applications.html', icon: 'fa-file-alt', desc: 'Review pending user applications for fixed salary promotion', keywords: ['application','applications','pending application','signup','registration','salary','promotion','fixed salary'] },
    { name: 'Sub-Admin Dashboard', href: 'sub-admin-panel.html', icon: 'fa-columns', desc: 'Sub-admin panel — shows only sections you have access to', keywords: ['sub-admin panel','sub admin dashboard','my panel','limited panel'] }
  ];

  const ACTIONS = [
    { question: 'How do I add a new product?', answer: 'Go to <b>Products</b> and click "+ Add Product". Fill in: name, price (0 for free), daily return, duration (days), category, image URL, invest limit, total units, and max units per user. Click Save.', page: 'admin-product.html', keywords: ['add product','new product','create product'] },
    { question: 'How do I edit a product?', answer: 'Go to <b>Products</b>, find the product card, and click the "Edit" button. Update any fields and click Save. Changes apply immediately to new investments.', page: 'admin-product.html', keywords: ['edit product','update product','change product','modify product'] },
    { question: 'How do I create a free/promo product?', answer: 'Go to <b>Products</b>, click "+ Add Product", and set the <b>price to 0</b>. Users will see a "Get Free" button instead of "Invest". Set the daily return, duration, and max units per user. Great for onboarding new users!', page: 'admin-product.html', keywords: ['free product','promo product','promotional','zero price'] },
    { question: 'How do I disable or enable a product?', answer: 'Go to <b>Products</b>, find the product, and click "Disable" to hide it from users (existing investments continue). Click "Enable" to show it again. Disabled products cannot receive new investments.', page: 'admin-product.html', keywords: ['disable product','enable product','hide product','show product','toggle product'] },
    { question: 'How do I approve a deposit?', answer: 'Go to <b>Pending Approvals</b>. You\'ll see pending deposits with user info and transaction codes. Click the green <b>"Approve"</b> button — this credits the user\'s deposit (wallet) balance immediately. The user can then invest with those funds.', page: 'admin-approve.html', keywords: ['approve deposit','confirm deposit','accept deposit'] },
    { question: 'How do I reject a deposit?', answer: 'Go to <b>Pending Approvals</b>, find the deposit, and click the red <b>"Reject"</b> button. Enter a reason for the rejection. The user\'s balance will NOT be credited. They\'ll see the rejection status on their deposit history.', page: 'admin-approve.html', keywords: ['reject deposit','decline deposit','deny deposit'] },
    { question: 'How do I approve a withdrawal?', answer: 'Go to <b>Pending Approvals</b>. Find the pending withdrawal showing the user\'s M-Pesa number and amount. Send the payment via M-Pesa, then click <b>"Approve"</b>. The amount was already deducted from the user\'s earnings balance when they requested it.', page: 'admin-approve.html', keywords: ['approve withdrawal','process withdrawal','approve payout'] },
    { question: 'How do I reject a withdrawal?', answer: 'Go to <b>Pending Approvals</b>, find the withdrawal, and click <b>"Reject"</b>. Enter a reason. The amount will be <b>refunded to the user\'s earnings balance</b> automatically.', page: 'admin-approve.html', keywords: ['reject withdrawal','decline withdrawal','refund withdrawal'] },
    { question: 'How do I create a sub-admin?', answer: 'Go to <b>Sub-Admin Management</b> and click "Create Invite". Set: name, email, phone, password, API key. Then choose permissions for each area (products, deposits, withdrawals, users, services, settings). You can also set exchange code limits. Share the generated invite link with the new sub-admin.', page: 'admin-management.html', superOnly: true, keywords: ['create sub-admin','new admin','add admin','invite admin'] },
    { question: 'How do I edit sub-admin permissions?', answer: 'Go to <b>Sub-Admin Management</b>, find the sub-admin, and click "Edit". You can change their:\n• <b>Permissions</b> — which sections they can access\n• <b>Sub-permissions</b> — granular controls like view/add/edit/delete per section\n• <b>Exchange limit</b> — max exchange code value they can generate\n• <b>Status</b> — active or suspended', page: 'admin-management.html', superOnly: true, keywords: ['edit admin','change permissions','update admin','modify admin'] },
    { question: 'How do I delete a sub-admin?', answer: 'Go to <b>Sub-Admin Management</b>, find the sub-admin and click <b>"Delete"</b> or <b>"Revoke"</b>. This immediately removes their access. They won\'t be able to log in anymore.', page: 'admin-management.html', superOnly: true, keywords: ['delete admin','remove admin','revoke admin'] },
    { question: 'How do I track sub-admin activity?', answer: 'Go to <b>Sub-Admin Management</b>. Each sub-admin card shows:\n• <b>Last login</b> date/time\n• <b>Exchange usage</b> (generated vs limit)\n• <b>Status</b> (active/suspended)\n• <b>Permissions</b> assigned\nYou can also type "show sub-admins" here for a quick overview.', page: 'admin-management.html', superOnly: true, keywords: ['track admin','monitor admin','admin activity','admin login'] },
    { question: 'How do I switch deposit mode?', answer: 'On the <b>Admin Dashboard</b>, find "Payment Processing Modes". Choose:\n• <b>Auto</b> — M-Pesa STK push (instant, user gets popup)\n• <b>Manual</b> — User sends to Paybill/Till, submits code for admin review\nIn manual mode, set payment instructions (Paybill number, account name, etc.) that users see.', page: 'Admin-panel.html', superOnly: true, keywords: ['deposit mode','payment mode','auto deposit','manual deposit','switch mode'] },
    { question: 'How do I switch withdrawal mode?', answer: 'On the <b>Admin Dashboard</b>, find "Payment Processing Modes". Toggle withdrawal mode between:\n• <b>Auto</b> — Automatic M-Pesa B2C payment\n• <b>Manual</b> — You review and process each withdrawal manually\nManual mode gives you full control over outgoing payments.', page: 'Admin-panel.html', superOnly: true, keywords: ['withdrawal mode','payout mode','auto withdrawal','manual withdrawal'] },
    { question: 'How do I suspend or lock a user?', answer: 'Go to <b>User Management</b>, search for the user, and click the <b>lock/suspend</b> button. The user won\'t be able to log in until you unlock them. Their investments and balances are preserved.', page: 'admin-user.html', keywords: ['suspend user','lock user','block user','ban user','disable user'] },
    { question: 'How do I unlock a user?', answer: 'Go to <b>User Management</b>, find the locked user, and click the <b>unlock</b> button. They\'ll be able to log in again immediately.', page: 'admin-user.html', keywords: ['unlock user','unblock user','unban user','unsuspend user','enable user'] },
    { question: 'How do I impersonate a user?', answer: 'Go to <b>User Management</b>, find the user, and click <b>"Impersonate"</b>. You\'ll see the platform exactly as the user sees it — their balances, investments, products, everything. This is <b>read-only</b>; you can\'t make transactions on their behalf. Click "Exit" in the red banner to return to admin view.', page: 'admin-user.html', keywords: ['impersonate user','view as user','login as user','see user view'] },
    { question: 'How do I help a user?', answer: 'Several ways to help a user from <b>User Management</b>:\n• <b>Impersonate</b> — see exactly what they see\n• <b>Edit balance</b> — adjust their deposit or earnings balance\n• <b>Reset password</b> — set a new temporary password\n• <b>Unlock account</b> — if they\'re locked out\n• <b>View details</b> — check their deposits, withdrawals, investments', page: 'admin-user.html', keywords: ['help user','assist user','user issue','user problem','customer support'] },
    { question: 'How do I edit a user\'s balance?', answer: 'Go to <b>User Management</b>, find the user, and use the balance edit controls. You can adjust:\n• <b>Wallet Balance</b> (deposit funds) — for investing\n• <b>Earnings Balance</b> (account balance) — for withdrawing\nChanges take effect immediately.', page: 'admin-user.html', keywords: ['edit balance','change balance','adjust balance','add balance','user balance','credit user','debit user'] },
    { question: 'How do I reset a user\'s password?', answer: 'Go to <b>User Management</b>, find the user, and click the <b>password reset</b> option. Set a new temporary password. The user can then log in and change it from their profile.', page: 'admin-user.html', keywords: ['reset password','change password','user password','forgot password','new password'] },
    { question: 'How do I set an announcement?', answer: 'On the <b>Admin Dashboard</b>, scroll to "Homepage Announcement". Choose a type:\n• <b>Info</b> (blue) — general updates\n• <b>Warning</b> (yellow) — important notices\n• <b>Success</b> (green) — good news\nWrite your message, click "Save Announcement", and toggle it <b>On</b> to show on the user homepage.', page: 'Admin-panel.html', superOnly: true, keywords: ['announcement','notice','message','homepage message','broadcast','alert'] },
    { question: 'How do I generate exchange codes?', answer: 'Go to <b>Exchange Codes</b> page. Choose code type:\n• <b>Single</b> — one code, one user\n• <b>Bulk</b> — multiple single-use codes\n• <b>Random/Pool</b> — shared pool split among users\n• <b>User-Assigned</b> — code for a specific user\nSet the amount, expiry date, and generate. Share codes with users to credit their balance.', page: 'admin-exchange.html', keywords: ['exchange code','generate code','create code','voucher','redemption code','coupon'] },
    { question: 'How do I manage exchange codes?', answer: 'On the <b>Exchange Codes</b> page, you can:\n• <b>View</b> all codes with redemption status\n• <b>Deactivate/Activate</b> — toggle a code on/off\n• <b>Delete</b> — permanently remove a code\n• See who redeemed each code and when\nSub-admins have exchange limits set by the super admin.', page: 'admin-exchange.html', keywords: ['manage codes','deactivate code','delete code','code list','code status'] },
    { question: 'How do I enable maintenance mode?', answer: 'Go to <b>Settings</b> and toggle <b>maintenance mode on</b>. Users will see a maintenance page instead of the normal site. This is useful for updates or emergency fixes. Remember to turn it off when done!', page: 'admin-settings.html', keywords: ['maintenance mode','maintenance','site down','offline','take offline'] },
    { question: 'How do I view referral commissions?', answer: 'Go to the <b>Referrals</b> page to see:\n• Full referral tree (3 levels deep)\n• Commission amounts per level\n• Active vs inactive referrals\n• Commission collection history\nRates: L1 = 10%, L2 = 6%, L3 = 1% (requires Basic level: 5+ active direct referrals)', page: 'admin-referrals.html', keywords: ['referral','commission','referral tree','network','downline'] },
    { question: 'How do I manage homepage content?', answer: 'On the <b>Admin Dashboard</b>, you can manage:\n• <b>Investment Opportunities</b> — the product cards shown on the homepage\n• <b>Testimonials</b> — client reviews displayed on the homepage\n• <b>Announcements</b> — banners shown at the top\nAdd, edit, or remove items to control what users see first.', page: 'Admin-panel.html', superOnly: true, keywords: ['homepage','landing page','opportunities','testimonials','homepage content'] },
    { question: 'How do I manage WhatsApp support?', answer: 'Go to the <b>Services</b> page to manage:\n• <b>WhatsApp Groups</b> — community/support groups users can join\n• <b>WhatsApp Managers</b> — direct support contacts\nAdd group links and manager numbers so users can reach support easily.', page: 'admin-service.html', keywords: ['whatsapp','support','groups','managers','contact','customer service'] },
    { question: 'How do I do a system reset?', answer: 'On the <b>Admin Dashboard</b>, find the "System Controls" section. The system reset clears cached data and re-syncs with the database. Use this if data seems stale or out of sync. <b>Warning:</b> This does NOT delete user data — it only refreshes the system state.', page: 'Admin-panel.html', superOnly: true, keywords: ['system reset','reset','sync','refresh','clear cache','re-sync'] },
    { question: 'How do I review pending applications?', answer: 'Go to <b>Pending Applications</b> to review users who applied for the Fixed Salary promotion. Check their submitted ID documents, referral count, and commission history. Approve or reject each application.', page: 'admin-pending-applications.html', keywords: ['pending applications','applications','fixed salary','promotion review','review applications'] },
    { question: 'How do I search for a specific user?', answer: 'Go to <b>User Management</b> and use the search bar at the top. You can search by:\n• Username\n• Email address\n• Phone number\nResults update as you type. Click on a user to see their full details.', page: 'admin-user.html', keywords: ['search user','find user','lookup user','user search'] },
    { question: 'How do I view deposit history?', answer: 'Go to the <b>Deposits</b> page. You\'ll see:\n• <b>Stats grid</b> — total, confirmed, pending, fees, platform balance\n• <b>Filter bar</b> — search by user, filter by status\n• <b>Transaction table</b> — paginated history of all deposits\nClick on any deposit for details.', page: 'admin-deposit.html', keywords: ['deposit history','deposit list','view deposits','all deposits'] },
    { question: 'How do I view withdrawal history?', answer: 'Go to the <b>Withdrawals</b> page. You\'ll see:\n• <b>Stats grid</b> — total, completed, pending, fees, platform balance\n• <b>Filter bar</b> — search by user, filter by status\n• <b>Transaction table</b> — paginated history of all withdrawals\nClick on any withdrawal for details.', page: 'admin-withdraw.html', keywords: ['withdrawal history','withdrawal list','view withdrawals','all withdrawals'] },
    { question: 'What are the permission levels?', answer: 'Sub-admin permissions have two layers:\n\n<b>Section access:</b> product, deposit, withdraw, user, service, settings, impersonate\n\n<b>Granular sub-permissions per section:</b>\n• <b>Product:</b> view, add, edit, delete, enable, disable\n• <b>Deposit:</b> view, approve, reject\n• <b>Withdraw:</b> view, approve, reject\n• <b>User:</b> view, edit, balance, lock, password, delete\n• <b>Service:</b> view, add, edit, delete\n• <b>Settings:</b> view, edit\n• <b>Impersonate:</b> impersonate_user', page: 'admin-management.html', superOnly: true, keywords: ['permissions','privilege','access','role','permission levels','what permissions','explain permissions'] },
    { question: 'How does the referral system work?', answer: 'The referral system has <b>3 levels</b>:\n\n• <b>Level 1</b> (direct referrals): 10% commission\n• <b>Level 2</b> (referrals of referrals): 6%\n• <b>Level 3</b>: 1%\n\n<b>Membership levels:</b>\n• Active — has an investment\n• Basic (5+ active L1) — commissions start\n• Premium (60+ active L1)\n• Gold (300+ active L1)\n\nUsers must have an active investment AND 5+ active direct referrals to earn commissions.', page: 'admin-referrals.html', keywords: ['referral system','commission rates','how referrals work','referral levels','membership levels'] },
    { question: 'How do user balances work?', answer: '<b>Two balance types:</b>\n\n• <b>Wallet Balance</b> (Deposit Balance)\n  — Funded by deposits\n  — Can be used to invest\n  — CANNOT be withdrawn\n\n• <b>Account Balance</b> (Earnings Balance)\n  — Funded by daily income collection, commissions, exchange codes\n  — Can be withdrawn AND used to invest\n\n<b>Key rules:</b>\n• Investments deduct from wallet first, then earnings\n• Rejected withdrawals refund to earnings balance\n• Exchange code redemptions credit earnings balance', page: 'admin-user.html', keywords: ['balance','wallet','earnings','how balance works','balance types','wallet balance','account balance','deposit balance','earnings balance'] },
    { question: 'How do investments work?', answer: '<b>Investment lifecycle:</b>\n\n1. User buys product units (from wallet or earnings balance)\n2. Investment becomes "active" with a start and end date\n3. User collects daily income every 24 hours from <b>My Products</b>\n4. Collected income goes to earnings balance\n5. When the hold period ends, investment "matures"\n\n<b>Rules:</b>\n• Sunday is maintenance day (no collections)\n• Max units per user is configurable per product\n• Products can have total unit limits and investor limits', page: 'admin-product.html', keywords: ['investment','how invest works','investment lifecycle','daily income','collection','maturity','hold period'] },
    { question: 'What is the AI user assistant?', answer: 'Every user-facing page has an <b>AI Assistant</b> — a floating chat bubble in the bottom-right corner. It helps users with:\n\n• Registration & login\n• How to invest\n• Deposits & withdrawals\n• Referrals & commissions\n• Exchange codes\n• Account settings\n\nIt provides context-aware suggestions based on which page the user is on. No setup needed — it\'s automatic!', keywords: ['user assistant','chatbot','ai assistant','user help','user support','bot'] },
    { question: 'How does the exchange code system work?', answer: '<b>Exchange codes</b> are admin-created vouchers that credit user balances.\n\n<b>Code types:</b>\n• <b>Single</b> — fixed amount, one user redeems\n• <b>Bulk</b> — generates multiple single-use codes at once\n• <b>Random/Pool</b> — total pool divided randomly among multiple users\n• <b>User-Assigned</b> — code tied to a specific user\n\n<b>Features:</b>\n• Set expiry dates\n• Set max redemptions\n• Deactivate/reactivate codes\n• Track who redeemed and when\n• Sub-admins have configurable generation limits', page: 'admin-exchange.html', keywords: ['exchange code system','code types','how codes work','voucher system'] },
    { question: 'How does impersonation work?', answer: '<b>Impersonation</b> lets admins see the platform as a specific user.\n\n• It\'s <b>strictly read-only</b> — you cannot make transactions\n• A red "VIEW-ONLY MODE" banner appears at the top\n• All action buttons are disabled\n• You see the user\'s real balances, investments, deposits, withdrawals\n• Click "Exit" to return to admin view\n\nThis is invaluable for debugging user issues without knowing their password.', page: 'admin-user.html', keywords: ['impersonation','view only','read only','how impersonate','impersonate details'] },
    { question: 'What happens when I reject a withdrawal?', answer: 'When you reject a withdrawal:\n1. The withdrawal status changes to "rejected"\n2. The amount is <b>automatically refunded</b> to the user\'s earnings balance\n3. The user sees the rejection and reason in their withdrawal history\n\nThis is safe — the money was already deducted when they requested, so rejecting simply gives it back.', page: 'admin-approve.html', keywords: ['reject withdrawal effect','withdrawal rejection','refund'] },
    { question: 'How do I check platform health?', answer: 'Use the <b>status</b> command here to see a quick dashboard of:\n• Pending deposits & withdrawals\n• Total users & new signups\n• Active investments & products\n• Platform-wide balances\n• 24-hour activity\n\nYou can also check the <b>Deposits</b> and <b>Withdrawals</b> pages for detailed transaction stats, or <b>User Management</b> for user growth.', keywords: ['platform health','system health','check status','platform overview','health check','diagnostics'] },
    { question: 'What is Sunday maintenance?', answer: 'Every <b>Sunday</b> is designated as maintenance day:\n• Users <b>cannot collect</b> daily investment income\n• All other functions (deposits, withdrawals, investing) still work\n• This is built into the system and happens automatically\n• No admin action needed — the server blocks collections on Sundays', keywords: ['sunday','maintenance day','why sunday','collection blocked','maintenance'] }
  ];

  const TROUBLESHOOTING = [
    { question: 'User says deposit not showing', answer: '<b>Deposit not showing?</b> Check these:\n\n1. Go to <b>Deposits</b> page and search for the user\n2. Check if deposit is "pending_review" (needs approval) or "rejected"\n3. If in <b>manual mode</b>, the deposit needs admin approval\n4. If in <b>auto mode</b>, check M-Pesa transaction status\n5. Verify the user deposited to the correct Paybill/Till number\n\n<b>Quick fix:</b> If payment was received but not reflected, go to <b>User Management</b> and manually credit their wallet balance.', keywords: ['deposit not showing','deposit missing','deposit problem','money not received','balance not updated','deposit issue'] },
    { question: 'User can\'t withdraw', answer: '<b>Withdrawal issues?</b> Check these:\n\n1. User must have sufficient <b>earnings balance</b> (NOT deposit balance)\n2. Wallet/deposit balance is NOT withdrawable — only earnings\n3. Check if user account is <b>locked/suspended</b>\n4. Check if <b>withdrawal mode</b> is set correctly\n5. Check minimum withdrawal amount settings\n\n<b>Important:</b> Only the <b>Account/Earnings Balance</b> can be withdrawn. Deposited funds can only be used for investing.', keywords: ['cant withdraw','withdrawal failed','withdrawal problem','withdrawal error','cant cash out','withdrawal issue'] },
    { question: 'User can\'t log in', answer: '<b>Login issues?</b> Check these:\n\n1. Go to <b>User Management</b> and search for the user\n2. Check if account is <b>locked/suspended</b> — unlock if needed\n3. <b>Reset password</b> if they forgot it\n4. Ensure they\'re using their <b>email</b> (not username) to log in\n5. Check if maintenance mode is accidentally enabled\n\n<b>Quick fix:</b> Reset their password from User Management and share the temporary password.', keywords: ['cant login','login problem','login failed','locked out','login issue','access denied','account locked'] },
    { question: 'User says investment not collecting', answer: '<b>Collection issues?</b> Check these:\n\n1. Is it <b>Sunday</b>? Collections are blocked on maintenance day\n2. Has it been <b>24 hours</b> since their last collection?\n3. Has the investment <b>matured</b> (end date passed)?\n4. <b>Impersonate</b> the user to see their exact My Products view\n\nThe system enforces a 24-hour cooldown between collections per investment.', keywords: ['cant collect','collection failed','not collecting','income not working','daily return issue','collection issue','investment problem'] },
    { question: 'Exchange code not working', answer: '<b>Exchange code issues?</b> Check these:\n\n1. Go to <b>Exchange Codes</b> and search for the code\n2. Check if the code is <b>deactivated</b>\n3. Check if it\'s <b>expired</b>\n4. Check if the <b>max redemptions</b> have been reached\n5. For user-assigned codes, verify it\'s assigned to the correct user\n6. The user might have already redeemed it (check redemption history)\n\n<b>Quick fix:</b> Generate a new code for the user if the old one has issues.', keywords: ['code not working','invalid code','exchange error','redeem failed','code issue','code problem'] },
    { question: 'Sub-admin can\'t access a page', answer: '<b>Permission issues?</b> Check these:\n\n1. Go to <b>Sub-Admin Management</b>\n2. Find the sub-admin and check their <b>privileges</b>\n3. They need both:\n   — The <b>section permission</b> (e.g., "product")\n   — The <b>sub-permission</b> (e.g., "product_view")\n4. If privileges array is empty, they have full access (legacy mode)\n5. Check if their account status is "active"\n\n<b>Quick fix:</b> Edit the sub-admin and add the missing permissions.', keywords: ['admin access','permission denied','sub-admin cant','access denied admin','permission issue','cant see page'] },
    { question: 'Product shows sold out but shouldn\'t', answer: '<b>Sold out issue?</b> Check these:\n\n1. Go to <b>Products</b> and check the product\'s <b>total_units</b>\n2. Compare with active investments for that product\n3. If <b>invest_limit</b> is set, check how many unique investors exist\n4. Past (matured/completed) investments still count toward sold units\n\n<b>Quick fix:</b> Edit the product and increase total_units or invest_limit, or remove the limit entirely (set to 0 for unlimited).', keywords: ['sold out','no units','unit limit','investor limit','product full','cant invest'] },
    { question: 'Platform balance seems wrong', answer: '<b>Balance discrepancy?</b> The platform has two balance pools:\n\n• <b>Platform Wallet</b> = sum of all user wallet_balance values (deposit funds)\n• <b>Platform Earnings</b> = sum of all user account_balance values (earnings)\n\nCommon causes of discrepancy:\n1. Pending deposits not yet approved\n2. Investment collections adding to earnings\n3. Exchange code redemptions crediting earnings\n4. Rejected withdrawal refunds\n\nType <b>"analytics"</b> here for a full financial overview.', keywords: ['wrong balance','balance wrong','discrepancy','balance mismatch','money missing','platform balance'] },
    { question: 'How to handle a fraudulent user', answer: '<b>Handling fraud:</b>\n\n1. Go to <b>User Management</b> and <b>lock the account</b> immediately\n2. <b>Impersonate</b> to review their activity\n3. Check their deposit history for suspicious transactions\n4. Check their referral tree for fake accounts\n5. You can <b>edit their balance</b> to zero if needed\n6. <b>Reject</b> any pending withdrawals\n\n<b>Note:</b> Locking prevents login but preserves all data for investigation.', keywords: ['fraud','suspicious','fake','scam','fraudulent','cheat','abuse'] },
    { question: 'How to give a user bonus funds', answer: '<b>Adding bonus funds:</b>\n\n<b>Option 1 — Direct balance edit:</b>\nGo to <b>User Management</b>, find the user, and increase their wallet balance (for investing) or earnings balance (for withdrawing).\n\n<b>Option 2 — Exchange code:</b>\nGo to <b>Exchange Codes</b> and create a user-assigned code. Share the code with the user to redeem. This creates an audit trail.\n\n<b>Option 3 — Free product:</b>\nCreate a promo product with price=0 that the user can activate.', keywords: ['bonus','give bonus','credit user','add funds','reward user','gift'] }
  ];

  let summaryData = null;
  let adminKey = null;
  let chatHistory = [];

  function getAdminKey() {
    if (adminKey) return adminKey;
    if (window.__abAdminKey) { adminKey = window.__abAdminKey; return adminKey; }
    return '1540568e';
  }

  function isSuperAdmin() {
    return !!window.__abIsSuper;
  }

  function fmtNum(n) {
    return (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtCur(n) {
    return 'KES ' + (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function fetchSummary() {
    try {
      const key = getAdminKey();
      const res = await fetch('/api/admin/ai-nav-summary', {
        headers: { 'x-admin-key': key }
      });
      if (!res.ok) return null;
      const prevPending = summaryData ? (summaryData.pendingDeposits + summaryData.pendingWithdrawals) : -1;
      summaryData = await res.json();
      updateFabBadge();
      const newPending = (summaryData.pendingDeposits || 0) + (summaryData.pendingWithdrawals || 0);
      if (isOpen && prevPending !== newPending) {
        refreshCurrentView();
      }
      return summaryData;
    } catch(e) { return null; }
  }

  function refreshCurrentView() {
    const body = document.getElementById('ainBody');
    if (body && !body.querySelector('.ain-chat-msg')) {
      body.innerHTML = renderResponse({ type: 'greeting' });
    }
  }

  function updateFabBadge() {
    const fab = document.getElementById('ainFab');
    if (!fab || !summaryData) return;
    const total = (summaryData.pendingDeposits || 0) + (summaryData.pendingWithdrawals || 0);
    let badge = fab.querySelector('.ain-fab-count');
    if (total > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'ain-fab-count';
        fab.appendChild(badge);
      }
      badge.textContent = total > 99 ? '99+' : total;
      const dot = fab.querySelector('.ain-fab-dot');
      if (dot) dot.style.display = 'none';
    } else {
      if (badge) badge.remove();
    }
  }

  function renderNotifications() {
    if (!summaryData) return '';
    const s = summaryData;
    const isSuper = s.isSuperAdmin || isSuperAdmin();
    let alerts = [];

    if (s.pendingDeposits > 0) {
      alerts.push({
        icon: 'fa-money-bill-wave', color: '#ffd54f', bg: 'rgba(255,213,79,0.08)', border: 'rgba(255,213,79,0.2)',
        text: `<b>${s.pendingDeposits}</b> pending deposit${s.pendingDeposits > 1 ? 's' : ''} awaiting review`,
        action: 'admin-approve.html', actionText: 'Review Now'
      });
    }
    if (s.pendingWithdrawals > 0) {
      alerts.push({
        icon: 'fa-money-bill-transfer', color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.2)',
        text: `<b>${s.pendingWithdrawals}</b> pending withdrawal${s.pendingWithdrawals > 1 ? 's' : ''} awaiting approval`,
        action: 'admin-approve.html', actionText: 'Review Now'
      });
    }
    if (isSuper && s.newUsers24h > 0) {
      alerts.push({
        icon: 'fa-user-plus', color: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.15)',
        text: `<b>${s.newUsers24h}</b> new user${s.newUsers24h > 1 ? 's' : ''} in the last 24 hours`,
        action: 'admin-user.html', actionText: 'View Users'
      });
    }

    if (!alerts.length) return '';
    let html = '<div class="ain-alerts">';
    for (const a of alerts) {
      html += `<div class="ain-alert" style="background:${a.bg};border-color:${a.border};">
        <div class="ain-alert-icon" style="color:${a.color};"><i class="fas ${a.icon}"></i></div>
        <div class="ain-alert-text">${a.text}</div>
        <a class="ain-alert-action" href="${a.action}" style="color:${a.color};">${a.actionText} <i class="fas fa-arrow-right"></i></a>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  function renderSubAdminList() {
    if (!summaryData || !summaryData.subAdmins || !summaryData.subAdmins.length) return '<div class="ain-empty">No sub-admins found.</div>';
    let html = '<div class="ain-subadmin-list">';
    for (const a of summaryData.subAdmins) {
      const statusColor = a.status === 'active' ? '#4ecdc4' : '#ff6b6b';
      const lastLogin = a.last_login ? new Date(a.last_login).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';
      const exUsed = a.exchange_generated || 0;
      const exLimit = a.exchange_limit || 0;
      html += `<div class="ain-subadmin-card">
        <div class="ain-sa-top">
          <div class="ain-sa-avatar" style="background:rgba(${a.status === 'active' ? '78,205,196' : '255,107,107'},0.15);color:${statusColor};">
            ${(a.name || a.email || '?')[0].toUpperCase()}
          </div>
          <div class="ain-sa-info">
            <div class="ain-sa-name">${a.name || 'Unnamed'}</div>
            <div class="ain-sa-email">${a.email || '—'}</div>
          </div>
          <span class="ain-sa-status" style="color:${statusColor};border-color:${statusColor};">${a.status || '—'}</span>
        </div>
        <div class="ain-sa-meta">
          <span><i class="fas fa-clock"></i> ${lastLogin}</span>
          <span><i class="fas fa-coins"></i> ${exUsed.toLocaleString()} / ${exLimit.toLocaleString()}</span>
        </div>
      </div>`;
    }
    html += '</div><a class="ain-go-btn" href="admin-management.html" style="margin-top:10px;display:inline-flex;"><i class="fas fa-user-shield"></i> Full Management</a>';
    return html;
  }

  function renderAnalytics() {
    if (!summaryData) return '<div class="ain-empty">Loading analytics data...</div>';
    const s = summaryData;
    const isSuper = s.isSuperAdmin || isSuperAdmin();
    let html = '<div class="ain-section-title"><i class="fas fa-chart-line"></i> Platform Analytics</div>';
    html += '<div class="ain-analytics-grid">';
    html += `<div class="ain-ana-card" style="border-left:3px solid #4ecdc4;"><div class="ain-ana-label">Total Deposited</div><div class="ain-ana-val" style="color:#4ecdc4;">${fmtCur(s.totalDeposited)}</div></div>`;
    html += `<div class="ain-ana-card" style="border-left:3px solid #ff6b6b;"><div class="ain-ana-label">Total Withdrawn</div><div class="ain-ana-val" style="color:#ff6b6b;">${fmtCur(s.totalWithdrawn)}</div></div>`;
    html += `<div class="ain-ana-card" style="border-left:3px solid #ffd54f;"><div class="ain-ana-label">Total Invested (Active)</div><div class="ain-ana-val" style="color:#ffd54f;">${fmtCur(s.totalInvested)}</div></div>`;
    html += `<div class="ain-ana-card" style="border-left:3px solid #a78bfa;"><div class="ain-ana-label">Platform Wallet Pool</div><div class="ain-ana-val" style="color:#a78bfa;">${fmtCur(s.platformWallet)}</div></div>`;
    html += `<div class="ain-ana-card" style="border-left:3px solid #818cf8;"><div class="ain-ana-label">Platform Earnings Pool</div><div class="ain-ana-val" style="color:#818cf8;">${fmtCur(s.platformEarnings)}</div></div>`;
    html += `<div class="ain-ana-card" style="border-left:3px solid #34d399;"><div class="ain-ana-label">Net Flow (In - Out)</div><div class="ain-ana-val" style="color:#34d399;">${fmtCur(s.totalDeposited - s.totalWithdrawn)}</div></div>`;
    html += '</div>';

    html += '<div class="ain-section-title" style="margin-top:14px;"><i class="fas fa-clock"></i> Last 24 Hours</div>';
    html += '<div class="ain-24h-row">';
    html += `<div class="ain-24h-item"><span class="ain-24h-num" style="color:#a78bfa;">${fmtNum(s.newUsers24h)}</span><span class="ain-24h-label">New Users</span></div>`;
    html += `<div class="ain-24h-item"><span class="ain-24h-num" style="color:#4ecdc4;">${fmtNum(s.deposits24h)}</span><span class="ain-24h-label">Deposits</span></div>`;
    html += `<div class="ain-24h-item"><span class="ain-24h-num" style="color:#ff6b6b;">${fmtNum(s.withdrawals24h)}</span><span class="ain-24h-label">Withdrawals</span></div>`;
    html += '</div>';

    html += '<div class="ain-section-title" style="margin-top:14px;"><i class="fas fa-cubes"></i> Platform Stats</div>';
    html += '<div class="ain-24h-row">';
    html += `<div class="ain-24h-item"><span class="ain-24h-num" style="color:#4ecdc4;">${fmtNum(s.activeProducts)}</span><span class="ain-24h-label">Active Products</span></div>`;
    html += `<div class="ain-24h-item"><span class="ain-24h-num" style="color:#ffd54f;">${fmtNum(s.activeInvestments)}</span><span class="ain-24h-label">Active Investments</span></div>`;
    html += `<div class="ain-24h-item"><span class="ain-24h-num" style="color:#818cf8;">${fmtNum(s.activeExchangeCodes)}</span><span class="ain-24h-label">Active Codes</span></div>`;
    html += '</div>';
    return html;
  }

  function matchScore(query, item) {
    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 1);
    let score = 0;
    if (item.name && item.name.toLowerCase().includes(q)) score += 10;
    if (item.desc && item.desc.toLowerCase().includes(q)) score += 5;
    if (item.keywords) {
      for (const kw of item.keywords) {
        if (q.includes(kw)) score += 8;
        else if (kw.includes(q)) score += 6;
        else {
          for (const w of words) { if (w.length > 2 && kw.includes(w)) score += 3; }
        }
      }
    }
    if (item.question) {
      for (const w of words) { if (w.length > 2 && item.question.toLowerCase().includes(w)) score += 4; }
    }
    if (item.answer) {
      for (const w of words) { if (w.length > 2 && item.answer.toLowerCase().includes(w)) score += 2; }
    }
    return score;
  }

  function processQuery(query) {
    if (!query || !query.trim()) return { type: 'empty' };
    const q = query.trim().toLowerCase();

    const greetings = ['hello','hi','hey','help','what can you do','menu','start'];
    if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ','))) return { type: 'greeting' };

    if (/^(show\s+)?sub[\s-]?admin/i.test(q) || /track.*admin|admin.*track|admin.*list|list.*admin|manage.*admin|admin.*account|who are.*admin|my team|staff/i.test(q)) {
      if (isSuperAdmin() || (summaryData && summaryData.isSuperAdmin)) {
        return { type: 'subadmin_list' };
      }
    }

    if (/^(status|overview|summary|what.*pending|how many|dashboard data|quick stats|show status|platform status|site status|system status|check status)$/i.test(q) || (q.split(/\s+/).length <= 3 && /status|overview|summary/i.test(q))) {
      return { type: 'status' };
    }

    if (/analytics|financ|revenue|money flow|net flow|total deposit.*total|total withdraw.*total|platform money|platform balance|how much|income report|financial report|report/i.test(q)) {
      return { type: 'analytics' };
    }

    if (/^(today|last 24|24 hour|24h|recent activity|what.*today|today.*activity)$/i.test(q) || /what.*happened.*today|today.*stats|daily report|daily summary/i.test(q)) {
      return { type: 'today' };
    }

    if (/thank|thanks|okay|ok|got it|understood|perfect|great|awesome|nice/i.test(q)) {
      return { type: 'thanks' };
    }

    if (/who are you|what are you|about you|your name|what can you|your purpose|capabilities/i.test(q)) {
      return { type: 'about' };
    }

    const isSuper = isSuperAdmin() || (summaryData && summaryData.isSuperAdmin);
    const allKB = [...ACTIONS, ...TROUBLESHOOTING];
    const filteredKB = isSuper ? allKB : allKB.filter(a => !a.superOnly);
    const filteredPages = isSuper ? PAGES : PAGES.filter(p => !p.superOnly);

    const kbResults = filteredKB.map(a => ({ ...a, score: matchScore(q, a) })).filter(a => a.score > 3).sort((a, b) => b.score - a.score);
    const pageResults = filteredPages.map(p => ({ ...p, score: matchScore(q, p) })).filter(p => p.score > 3).sort((a, b) => b.score - a.score);

    if (kbResults.length && kbResults[0].score >= 8 && kbResults[0].score >= (pageResults[0]?.score || 0)) {
      return { type: 'action', results: kbResults.slice(0, 2), pages: pageResults.slice(0, 3) };
    }
    if (pageResults.length && pageResults[0].score >= 8) {
      return { type: 'pages', results: pageResults.slice(0, 4) };
    }
    if (kbResults.length || pageResults.length) {
      return { type: 'ai_enhanced', query: q, fallbackResults: kbResults.slice(0, 2), fallbackPages: pageResults.slice(0, 3) };
    }
    return { type: 'ai_query', query: q };
  }

  function renderResponse(result) {
    if (result.type === 'empty') return '';

    const notifHtml = renderNotifications();
    const isSuper = isSuperAdmin() || (summaryData && summaryData.isSuperAdmin);

    if (result.type === 'greeting') {
      let suggestions = `
        <button class="ain-suggestion" onclick="window._ainChat('status')"><i class="fas fa-chart-bar"></i> Status</button>
        <button class="ain-suggestion" onclick="window._ainChat('analytics')"><i class="fas fa-chart-line"></i> Analytics</button>
        <button class="ain-suggestion" onclick="window._ainChat('approve deposits')">Approve deposits</button>
        <button class="ain-suggestion" onclick="window._ainChat('help a user')">Help a user</button>
        <button class="ain-suggestion" onclick="window._ainChat('How do I add a product?')">Add product</button>
        <button class="ain-suggestion" onclick="window._ainChat('how do balances work')">Balance guide</button>
        <button class="ain-suggestion" onclick="window._ainChat('deposit not showing')"><i class="fas fa-wrench"></i> Troubleshoot</button>`;
      if (isSuper) {
        suggestions += `
        <button class="ain-suggestion" onclick="window._ainChat('show sub-admins')"><i class="fas fa-user-shield"></i> Sub-admins</button>
        <button class="ain-suggestion" onclick="window._ainChat('permissions')">Permissions guide</button>`;
      }
      return `${notifHtml}
      <div class="ain-greeting">
        <div class="ain-greeting-icon"><i class="fas fa-robot"></i></div>
        <div class="ain-greeting-text">${isSuper ? 'Welcome, Super Admin!' : 'Hi!'} I\'m your AI admin assistant. I can help with navigation, how-to guides, troubleshooting, analytics, and platform management. What do you need?</div>
        <div class="ain-suggestions">${suggestions}</div>
      </div>`;
    }

    if (result.type === 'thanks') {
      return `<div class="ain-greeting">
        <div class="ain-greeting-icon"><i class="fas fa-smile"></i></div>
        <div class="ain-greeting-text">You're welcome! Let me know if you need anything else.</div>
        <div class="ain-suggestions">
          <button class="ain-suggestion" onclick="window._ainChat('status')">Status</button>
          <button class="ain-suggestion" onclick="window._ainChat('analytics')">Analytics</button>
          <button class="ain-suggestion" onclick="window._ainChat('help')">Main menu</button>
        </div>
      </div>`;
    }

    if (result.type === 'about') {
      return `<div class="ain-answer">
        <div class="ain-answer-text">I'm the <b>AfricaBased AI Admin Assistant</b>. Here's what I can do:<br><br>
          <b>Navigate:</b> Find any admin page instantly<br>
          <b>How-to guides:</b> Step-by-step instructions for every admin task<br>
          <b>Troubleshooting:</b> Diagnose user issues and platform problems<br>
          <b>Analytics:</b> Real-time platform stats, financials, and 24h activity<br>
          <b>Sub-admin management:</b> View and manage your team<br>
          <b>Live alerts:</b> Pending deposits/withdrawals notifications<br><br>
          Try asking me anything about the platform!</div>
        <div class="ain-suggestions">
          <button class="ain-suggestion" onclick="window._ainChat('status')">Status</button>
          <button class="ain-suggestion" onclick="window._ainChat('analytics')">Analytics</button>
          <button class="ain-suggestion" onclick="window._ainChat('how do investments work')">Investments guide</button>
        </div>
      </div>`;
    }

    if (result.type === 'status') {
      if (!summaryData) return '<div class="ain-empty">Loading status data...</div>';
      const s = summaryData;
      let html = '<div class="ain-status-grid">';
      html += `<div class="ain-stat-card"><div class="ain-stat-num" style="color:#ffd54f;">${s.pendingDeposits}</div><div class="ain-stat-label">Pending Deposits</div></div>`;
      html += `<div class="ain-stat-card"><div class="ain-stat-num" style="color:#ff6b6b;">${s.pendingWithdrawals}</div><div class="ain-stat-label">Pending Withdrawals</div></div>`;
      html += `<div class="ain-stat-card"><div class="ain-stat-num" style="color:#4ecdc4;">${s.totalUsers}</div><div class="ain-stat-label">Total Users</div></div>`;
      if (isSuper) {
        html += `<div class="ain-stat-card"><div class="ain-stat-num" style="color:#a78bfa;">${s.activeSubAdmins}</div><div class="ain-stat-label">Active Sub-Admins</div></div>`;
      }
      html += `<div class="ain-stat-card"><div class="ain-stat-num" style="color:#34d399;">${s.activeProducts}</div><div class="ain-stat-label">Active Products</div></div>`;
      html += `<div class="ain-stat-card"><div class="ain-stat-num" style="color:#818cf8;">${s.activeInvestments}</div><div class="ain-stat-label">Active Investments</div></div>`;
      html += '</div>';
      if (s.pendingDeposits > 0 || s.pendingWithdrawals > 0) {
        html += `<a class="ain-go-btn" href="admin-approve.html" style="margin-top:12px;display:inline-flex;"><i class="fas fa-clipboard-check"></i> Go to Approvals</a>`;
      }
      html += '<div class="ain-suggestions" style="margin-top:12px;">';
      html += '<button class="ain-suggestion" onclick="window._ainChat(\'analytics\')"><i class="fas fa-chart-line"></i> Full Analytics</button>';
      html += '<button class="ain-suggestion" onclick="window._ainChat(\'today\')"><i class="fas fa-clock"></i> Today\'s Activity</button>';
      html += '</div>';
      return html;
    }

    if (result.type === 'analytics') {
      return renderAnalytics();
    }

    if (result.type === 'today') {
      if (!summaryData) return '<div class="ain-empty">Loading...</div>';
      const s = summaryData;
      let html = '<div class="ain-section-title"><i class="fas fa-clock"></i> Last 24 Hours Activity</div>';
      html += '<div class="ain-analytics-grid">';
      html += `<div class="ain-ana-card" style="border-left:3px solid #a78bfa;"><div class="ain-ana-label">New Users</div><div class="ain-ana-val" style="color:#a78bfa;">${fmtNum(s.newUsers24h)}</div></div>`;
      html += `<div class="ain-ana-card" style="border-left:3px solid #4ecdc4;"><div class="ain-ana-label">Deposits Confirmed</div><div class="ain-ana-val" style="color:#4ecdc4;">${fmtNum(s.deposits24h)}</div></div>`;
      html += `<div class="ain-ana-card" style="border-left:3px solid #ff6b6b;"><div class="ain-ana-label">Withdrawals Completed</div><div class="ain-ana-val" style="color:#ff6b6b;">${fmtNum(s.withdrawals24h)}</div></div>`;
      html += `<div class="ain-ana-card" style="border-left:3px solid #ffd54f;"><div class="ain-ana-label">Pending Deposits</div><div class="ain-ana-val" style="color:#ffd54f;">${fmtNum(s.pendingDeposits)}</div></div>`;
      html += `<div class="ain-ana-card" style="border-left:3px solid #f87171;"><div class="ain-ana-label">Pending Withdrawals</div><div class="ain-ana-val" style="color:#f87171;">${fmtNum(s.pendingWithdrawals)}</div></div>`;
      html += '</div>';
      html += '<div class="ain-suggestions" style="margin-top:12px;">';
      html += '<button class="ain-suggestion" onclick="window._ainChat(\'analytics\')">Full Analytics</button>';
      html += '<button class="ain-suggestion" onclick="window._ainChat(\'status\')">Status Overview</button>';
      html += '</div>';
      return html;
    }

    if (result.type === 'subadmin_list') {
      return '<div class="ain-section-title"><i class="fas fa-user-shield"></i> Sub-Admin Accounts</div>' + renderSubAdminList();
    }

    if (result.type === 'ai_query' || result.type === 'ai_enhanced' || result.type === 'unknown') {
      return null;
    }

    if (result.type === 'ai_response') {
      var safeReply = (result.reply || '').replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
      var formattedReply = safeReply.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>').replace(/•/g, '<span style="color:#4ecdc4;">•</span>');
      var html2 = `<div class="ain-answer ain-ai-answer">
        <div class="ain-ai-badge"><i class="fas fa-sparkles"></i> AI-Powered Response</div>
        <div class="ain-answer-text">${formattedReply}</div>
      </div>`;
      if (result.relatedPages && result.relatedPages.length) {
        html2 += '<div class="ain-related-label">Related pages</div><div class="ain-pages ain-pages-sm">';
        for (var rp of result.relatedPages) {
          html2 += `<a class="ain-page-link" href="${rp.href}">
            <div class="ain-page-icon"><i class="fas ${rp.icon}"></i></div>
            <div class="ain-page-info"><div class="ain-page-name">${rp.name}</div></div>
            <i class="fas fa-chevron-right ain-page-arrow"></i>
          </a>`;
        }
        html2 += '</div>';
      }
      return html2;
    }

    let html = notifHtml;
    if (result.type === 'action' && result.results.length) {
      const a = result.results[0];
      html += `<div class="ain-answer">
        <div class="ain-answer-text">${a.answer}</div>
        ${a.page ? `<a class="ain-go-btn" href="${a.page}"><i class="fas fa-arrow-right"></i> Go to Page</a>` : ''}
      </div>`;
      if (result.results.length > 1) {
        html += '<div class="ain-related-label">Also relevant</div>';
        html += `<div class="ain-answer ain-answer-secondary"><div class="ain-answer-text">${result.results[1].answer}</div>
          ${result.results[1].page ? `<a class="ain-go-btn ain-go-btn-sm" href="${result.results[1].page}"><i class="fas fa-arrow-right"></i> Go to Page</a>` : ''}
        </div>`;
      }
    }
    if (result.results && result.type === 'pages') {
      html += '<div class="ain-pages">';
      for (const p of result.results) {
        html += `<a class="ain-page-link" href="${p.href}">
          <div class="ain-page-icon"><i class="fas ${p.icon}"></i></div>
          <div class="ain-page-info">
            <div class="ain-page-name">${p.name}</div>
            <div class="ain-page-desc">${p.desc}</div>
          </div>
          <i class="fas fa-chevron-right ain-page-arrow"></i>
        </a>`;
      }
      html += '</div>';
    }
    if (result.type === 'action' && result.pages && result.pages.length) {
      html += '<div class="ain-related-label">Related pages</div><div class="ain-pages ain-pages-sm">';
      for (const p of result.pages.slice(0, 3)) {
        html += `<a class="ain-page-link" href="${p.href}">
          <div class="ain-page-icon"><i class="fas ${p.icon}"></i></div>
          <div class="ain-page-info"><div class="ain-page-name">${p.name}</div></div>
          <i class="fas fa-chevron-right ain-page-arrow"></i>
        </a>`;
      }
      html += '</div>';
    }
    return html;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ain-fab {
        position: fixed; bottom: 24px; right: 24px; z-index: 99998;
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #4ecdc4, #2ba89e);
        border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 6px 24px rgba(78,205,196,0.4);
        transition: all 0.3s; color: #fff; font-size: 1.3rem;
      }
      .ain-fab:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(78,205,196,0.5); }
      .ain-fab.open { background: linear-gradient(135deg, #ff6b6b, #c0392b); }
      .ain-fab .ain-fab-dot {
        position: absolute; top: 6px; right: 6px; width: 12px; height: 12px;
        background: #ffd54f; border-radius: 50%; border: 2px solid #0f1623;
        animation: ainPulse 2s infinite;
      }
      .ain-fab .ain-fab-count {
        position: absolute; top: -4px; right: -4px; min-width: 22px; height: 22px;
        background: #ff6b6b; border-radius: 11px; border: 2px solid #0f1623;
        color: #fff; font-size: 0.65rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        padding: 0 4px; animation: ainPulse 2s infinite;
      }
      @keyframes ainPulse {
        0%,100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.15); opacity: 0.8; }
      }
      .ain-panel {
        position: fixed; bottom: 92px; right: 24px; z-index: 99999;
        width: 420px; max-width: calc(100vw - 32px); max-height: calc(100vh - 140px);
        background: linear-gradient(165deg, #0f1a2e 0%, #162236 50%, #0d1520 100%);
        border: 1px solid rgba(78,205,196,0.2); border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(78,205,196,0.05);
        display: none; flex-direction: column; overflow: hidden;
        animation: ainSlideUp 0.3s ease;
      }
      .ain-panel.open { display: flex; }
      @keyframes ainSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .ain-header {
        background: linear-gradient(135deg, rgba(78,205,196,0.15), rgba(78,205,196,0.03));
        padding: 16px 20px 12px;
        border-bottom: 1px solid rgba(78,205,196,0.1);
        display: flex; align-items: center; gap: 12px;
      }
      .ain-header-icon {
        width: 40px; height: 40px; border-radius: 12px;
        background: linear-gradient(135deg, #4ecdc4, #2ba89e);
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; color: #fff; flex-shrink: 0;
      }
      .ain-header-text { flex: 1; }
      .ain-header-title { font-size: 0.95rem; font-weight: 700; color: #fff; }
      .ain-header-sub { font-size: 0.72rem; color: rgba(255,255,255,0.4); }
      .ain-body {
        flex: 1; overflow-y: auto; padding: 14px 16px;
        min-height: 120px; max-height: calc(100vh - 300px);
      }
      .ain-body::-webkit-scrollbar { width: 4px; }
      .ain-body::-webkit-scrollbar-thumb { background: rgba(78,205,196,0.2); border-radius: 4px; }
      .ain-input-wrap {
        padding: 10px 16px 14px;
        border-top: 1px solid rgba(78,205,196,0.08);
        background: rgba(0,0,0,0.15);
      }
      .ain-input-row { display: flex; gap: 8px; }
      .ain-input {
        flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(78,205,196,0.15);
        border-radius: 12px; padding: 10px 14px; color: #fff; font-size: 0.88rem;
        font-family: inherit; outline: none; transition: border-color 0.2s;
      }
      .ain-input::placeholder { color: rgba(255,255,255,0.3); }
      .ain-input:focus { border-color: rgba(78,205,196,0.4); }
      .ain-send-btn {
        width: 42px; height: 42px; border-radius: 12px;
        background: linear-gradient(135deg, #4ecdc4, #2ba89e);
        border: none; cursor: pointer; color: #fff; font-size: 0.9rem;
        display: flex; align-items: center; justify-content: center; transition: all 0.2s;
      }
      .ain-send-btn:hover { transform: scale(1.05); }

      .ain-alerts { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
      .ain-alert {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px; border-radius: 12px;
        border: 1px solid; font-size: 0.82rem;
        animation: ainFadeIn 0.3s ease;
      }
      @keyframes ainFadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      .ain-alert-icon { font-size: 1rem; flex-shrink: 0; }
      .ain-alert-text { flex: 1; color: rgba(255,255,255,0.75); line-height: 1.4; }
      .ain-alert-text b { color: #fff; }
      .ain-alert-action {
        font-size: 0.72rem; font-weight: 700; text-decoration: none;
        white-space: nowrap; display: flex; align-items: center; gap: 4px;
        transition: opacity 0.2s;
      }
      .ain-alert-action:hover { opacity: 0.7; }

      .ain-status-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .ain-stat-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px; padding: 12px 8px; text-align: center;
      }
      .ain-stat-num { font-size: 1.4rem; font-weight: 800; }
      .ain-stat-label { font-size: 0.68rem; color: rgba(255,255,255,0.4); margin-top: 2px; }

      .ain-section-title {
        font-size: 0.82rem; font-weight: 700; color: #4ecdc4;
        margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
      }
      .ain-subadmin-list { display: flex; flex-direction: column; gap: 6px; }
      .ain-subadmin-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px; padding: 10px 12px; transition: border-color 0.2s;
      }
      .ain-subadmin-card:hover { border-color: rgba(78,205,196,0.2); }
      .ain-sa-top { display: flex; align-items: center; gap: 10px; }
      .ain-sa-avatar {
        width: 34px; height: 34px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.85rem; font-weight: 700; flex-shrink: 0;
      }
      .ain-sa-info { flex: 1; min-width: 0; }
      .ain-sa-name { font-size: 0.85rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ain-sa-email { font-size: 0.7rem; color: rgba(255,255,255,0.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ain-sa-status {
        font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
        border-radius: 10px; border: 1px solid; text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .ain-sa-meta {
        display: flex; gap: 14px; margin-top: 6px; padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.04);
        font-size: 0.7rem; color: rgba(255,255,255,0.35);
      }
      .ain-sa-meta i { margin-right: 4px; }
      .ain-empty { text-align: center; color: rgba(255,255,255,0.35); font-size: 0.85rem; padding: 20px 0; }

      .ain-greeting, .ain-unknown { text-align: center; padding: 8px 0; }
      .ain-greeting-icon, .ain-unknown-icon {
        width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 10px;
        background: linear-gradient(135deg, rgba(78,205,196,0.15), rgba(78,205,196,0.05));
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; color: #4ecdc4;
      }
      .ain-greeting-text, .ain-unknown > div:not(.ain-suggestions):not(.ain-unknown-icon) {
        color: rgba(255,255,255,0.6); font-size: 0.85rem; line-height: 1.5; margin-bottom: 14px;
      }
      .ain-suggestions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
      .ain-suggestion {
        background: rgba(78,205,196,0.08); border: 1px solid rgba(78,205,196,0.2);
        color: #4ecdc4; border-radius: 20px; padding: 6px 14px; font-size: 0.76rem;
        cursor: pointer; transition: all 0.2s; font-family: inherit; font-weight: 500;
        display: inline-flex; align-items: center; gap: 4px;
      }
      .ain-suggestion:hover { background: rgba(78,205,196,0.15); border-color: rgba(78,205,196,0.4); }

      .ain-answer {
        background: rgba(78,205,196,0.06); border: 1px solid rgba(78,205,196,0.12);
        border-radius: 14px; padding: 14px 16px; margin-bottom: 12px;
      }
      .ain-answer-secondary {
        background: rgba(129,140,248,0.06); border-color: rgba(129,140,248,0.12);
      }
      .ain-answer-text {
        color: rgba(255,255,255,0.75); font-size: 0.85rem; line-height: 1.6; margin-bottom: 10px;
      }
      .ain-answer-text b { color: #4ecdc4; }
      .ain-go-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: linear-gradient(135deg, #4ecdc4, #2ba89e);
        color: #fff; text-decoration: none; padding: 8px 18px;
        border-radius: 10px; font-size: 0.82rem; font-weight: 700; transition: all 0.2s;
      }
      .ain-go-btn:hover { transform: translateX(2px); box-shadow: 0 4px 16px rgba(78,205,196,0.3); }
      .ain-go-btn-sm { padding: 6px 14px; font-size: 0.78rem; }
      .ain-related-label {
        font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em;
        color: rgba(255,255,255,0.3); font-weight: 600; margin: 4px 0 8px;
      }
      .ain-pages { display: flex; flex-direction: column; gap: 6px; }
      .ain-pages-sm .ain-page-link { padding: 8px 12px; }
      .ain-page-link {
        display: flex; align-items: center; gap: 12px; padding: 10px 14px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px; text-decoration: none; color: #fff; transition: all 0.2s;
      }
      .ain-page-link:hover {
        background: rgba(78,205,196,0.08); border-color: rgba(78,205,196,0.2);
        transform: translateX(4px);
      }
      .ain-page-icon {
        width: 36px; height: 36px; border-radius: 10px;
        background: rgba(78,205,196,0.1); color: #4ecdc4;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.85rem; flex-shrink: 0;
      }
      .ain-page-info { flex: 1; min-width: 0; }
      .ain-page-name { font-size: 0.88rem; font-weight: 600; }
      .ain-page-desc {
        font-size: 0.74rem; color: rgba(255,255,255,0.4);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .ain-page-arrow { color: rgba(255,255,255,0.15); font-size: 0.7rem; }
      .ain-page-link:hover .ain-page-arrow { color: #4ecdc4; }

      .ain-analytics-grid { display: flex; flex-direction: column; gap: 6px; }
      .ain-ana-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; padding: 10px 14px;
        display: flex; justify-content: space-between; align-items: center;
      }
      .ain-ana-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
      .ain-ana-val { font-size: 0.95rem; font-weight: 700; }
      .ain-24h-row { display: flex; gap: 8px; }
      .ain-24h-item {
        flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; padding: 10px; text-align: center;
      }
      .ain-24h-num { display: block; font-size: 1.3rem; font-weight: 800; }
      .ain-24h-label { font-size: 0.68rem; color: rgba(255,255,255,0.4); }

      .ain-chat-msg {
        padding: 10px 14px; border-radius: 14px; margin-bottom: 8px;
        font-size: 0.85rem; line-height: 1.5; max-width: 90%;
        animation: ainFadeIn 0.3s ease;
      }
      .ain-chat-user {
        background: linear-gradient(135deg, #4ecdc4, #1abc9c);
        color: #050b15; font-weight: 600; margin-left: auto;
        border-bottom-right-radius: 4px;
      }
      .ain-chat-bot {
        background: rgba(78,205,196,0.08); border: 1px solid rgba(78,205,196,0.12);
        color: rgba(255,255,255,0.85);
        border-bottom-left-radius: 4px;
      }
      .ain-chat-bot a { color: #4ecdc4; }
      .ain-chat-bot b { color: #4ecdc4; }

      .ain-ai-badge {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 0.68rem; font-weight: 700; color: #a78bfa;
        text-transform: uppercase; letter-spacing: 0.04em;
        margin-bottom: 8px;
      }
      .ain-ai-badge i { font-size: 0.75rem; }
      .ain-ai-answer {
        background: rgba(167,139,250,0.06); border-color: rgba(167,139,250,0.15);
      }
      .ain-ai-answer .ain-answer-text b { color: #a78bfa; }

      .ain-thinking {
        display: flex; align-items: center; gap: 10px;
      }
      .ain-thinking-dots {
        display: flex; gap: 4px;
      }
      .ain-thinking-dots span {
        width: 8px; height: 8px; border-radius: 50%;
        background: #4ecdc4; opacity: 0.4;
        animation: ainDotBounce 1.4s ease-in-out infinite;
      }
      .ain-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
      .ain-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes ainDotBounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
      .ain-thinking-text {
        font-size: 0.82rem; color: rgba(255,255,255,0.4); font-style: italic;
      }

      @media (max-width: 480px) {
        .ain-panel { right: 8px; bottom: 84px; width: calc(100vw - 16px); }
        .ain-fab { bottom: 16px; right: 16px; width: 50px; height: 50px; font-size: 1.1rem; }
        .ain-status-grid { grid-template-columns: 1fr 1fr; }
        .ain-24h-row { flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectHTML() {
    const fab = document.createElement('button');
    fab.className = 'ain-fab';
    fab.id = 'ainFab';
    fab.innerHTML = '<i class="fas fa-robot"></i><span class="ain-fab-dot"></span>';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'ain-panel';
    panel.id = 'ainPanel';
    const isSuper = isSuperAdmin();
    panel.innerHTML = `
      <div class="ain-header">
        <div class="ain-header-icon"><i class="fas fa-robot"></i></div>
        <div class="ain-header-text">
          <div class="ain-header-title">AI Admin Assistant</div>
          <div class="ain-header-sub">${isSuper ? 'Super Admin' : 'Admin'} · Navigation · Analytics · Troubleshooting</div>
        </div>
      </div>
      <div class="ain-body" id="ainBody"></div>
      <div class="ain-input-wrap">
        <div class="ain-input-row">
          <input class="ain-input" id="ainInput" placeholder="Ask me anything about the platform..." autocomplete="off">
          <button class="ain-send-btn" id="ainSendBtn"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  let isOpen = false;
  function togglePanel() {
    isOpen = !isOpen;
    const fab = document.getElementById('ainFab');
    const panel = document.getElementById('ainPanel');
    if (isOpen) {
      fab.classList.add('open');
      fab.innerHTML = '<i class="fas fa-times"></i>';
      panel.classList.add('open');
      const body = document.getElementById('ainBody');
      if (!body.innerHTML.trim()) {
        body.innerHTML = renderResponse({ type: 'greeting' });
      }
      setTimeout(() => document.getElementById('ainInput').focus(), 200);
    } else {
      fab.classList.remove('open');
      fab.innerHTML = '<i class="fas fa-robot"></i>';
      updateFabBadge();
      const dot = fab.querySelector('.ain-fab-dot');
      if (!fab.querySelector('.ain-fab-count') && !dot) {
        const d = document.createElement('span');
        d.className = 'ain-fab-dot';
        fab.appendChild(d);
      }
      panel.classList.remove('open');
    }
  }

  async function callAI(query) {
    try {
      const key = getAdminKey();
      const currentPage = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'Admin-panel';
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ message: query, context: 'Admin is on page: ' + currentPage })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.error || 'AI unavailable' };
      }
      const data = await res.json();
      return { reply: data.reply };
    } catch(e) {
      return { error: 'Network error. AI unavailable.' };
    }
  }

  function findRelatedPages(query) {
    const q = query.toLowerCase();
    const isSuper = isSuperAdmin() || (summaryData && summaryData.isSuperAdmin);
    const filteredPages = isSuper ? PAGES : PAGES.filter(p => !p.superOnly);
    return filteredPages.map(p => ({ ...p, score: matchScore(q, p) })).filter(p => p.score > 2).sort((a, b) => b.score - a.score).slice(0, 3);
  }

  async function submitQuery(overrideQuery) {
    const input = document.getElementById('ainInput');
    const q = overrideQuery || input.value.trim();
    if (!q) return;
    const body = document.getElementById('ainBody');

    const userMsg = document.createElement('div');
    userMsg.className = 'ain-chat-msg ain-chat-user';
    userMsg.textContent = q;
    body.appendChild(userMsg);
    input.value = '';
    body.scrollTop = body.scrollHeight;

    const result = processQuery(q);
    const html = renderResponse(result);

    if (html) {
      const botMsg = document.createElement('div');
      botMsg.className = 'ain-chat-msg ain-chat-bot';
      botMsg.innerHTML = html;
      body.appendChild(botMsg);
      body.scrollTop = body.scrollHeight;
      return;
    }

    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'ain-chat-msg ain-chat-bot ain-thinking';
    thinkingMsg.innerHTML = '<div class="ain-thinking-dots"><span></span><span></span><span></span></div><span class="ain-thinking-text">Thinking...</span>';
    body.appendChild(thinkingMsg);
    body.scrollTop = body.scrollHeight;

    const aiResult = await callAI(q);
    thinkingMsg.remove();

    if (aiResult.error) {
      const suggestions = [
        { label: 'Status', q: 'status' }, { label: 'Analytics', q: 'analytics' }, { label: 'Users', q: 'users' },
        { label: 'Products', q: 'products' }, { label: 'Deposits', q: 'deposits' }, { label: 'Troubleshoot', q: 'deposit not showing' }
      ];
      var safeQ = q.replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
      const fallbackHtml = `<div class="ain-unknown">
        <div class="ain-unknown-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div>${aiResult.error}</div>
        <div style="margin-top:8px;font-size:0.8rem;color:rgba(255,255,255,0.4);">Your question: "${safeQ}"</div>
        <div class="ain-suggestions" style="margin-top:10px;">
          ${suggestions.map(s => `<button class="ain-suggestion" onclick="window._ainChat('${s.q}')">${s.label}</button>`).join('')}
        </div>
      </div>`;
      const errMsg = document.createElement('div');
      errMsg.className = 'ain-chat-msg ain-chat-bot';
      errMsg.innerHTML = fallbackHtml;
      body.appendChild(errMsg);
    } else {
      const relPages = findRelatedPages(q);
      const aiResponse = renderResponse({ type: 'ai_response', reply: aiResult.reply, relatedPages: relPages });
      const aiMsg = document.createElement('div');
      aiMsg.className = 'ain-chat-msg ain-chat-bot';
      aiMsg.innerHTML = aiResponse;
      body.appendChild(aiMsg);
    }
    body.scrollTop = body.scrollHeight;
  }

  window._ainChat = function(q) {
    submitQuery(q);
  };

  window._ainFillQuery = function(q) {
    submitQuery(q);
  };

  function init() {
    injectStyles();
    injectHTML();
    document.getElementById('ainSendBtn').addEventListener('click', function() { submitQuery(); });
    document.getElementById('ainInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); submitQuery(); }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) togglePanel();
    });
    document.addEventListener('click', function(e) {
      if (!isOpen) return;
      const panel = document.getElementById('ainPanel');
      const fab = document.getElementById('ainFab');
      if (!panel.contains(e.target) && !fab.contains(e.target)) togglePanel();
    });

    fetchSummary();
    setInterval(fetchSummary, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function() {
  if (document.getElementById('abAiBubble')) return;

  var currentPage = window.location.pathname.replace(/\.html$/, '').replace(/^\//, '') || 'index';
  var isLoggedIn = !!(window.getABToken && window.getABToken());

  var KB = [
    {
      keys: ['hello','hi','hey','help','assist','support','start'],
      answer: "Hello! I'm your AfricaBased assistant. I can help you with:\n\n• Registration & Login\n• Investing in products\n• Deposits & Withdrawals\n• Referrals & Commissions\n• Exchange codes\n• Account settings\n\nWhat would you like to know?"
    },
    {
      keys: ['register','sign up','create account','join','signup','new account','registration'],
      answer: "To create an account:\n\n1. Enter your username, email, and password on the <a href='/'>registration page</a>\n2. If you have a referral code, enter it to connect with your referrer\n3. Click Register — you'll receive an OTP code via email\n4. Enter the OTP to verify your account\n5. Add your phone number (or skip for later)\n\nYou'll then be taken to your dashboard!"
    },
    {
      keys: ['login','log in','sign in','cant login','password wrong','access','signin'],
      answer: "To log in, go to the <a href='/login'>Login page</a> and enter your email and password.\n\nForgot your password? Use the <a href='/forgot-password'>Forgot Password</a> link to reset it via email.\n\nIf you're still having trouble, make sure you verified your email during registration."
    },
    {
      keys: ['invest','product','buy','purchase','how to invest','investing','plans','packages'],
      answer: "To invest in a product:\n\n1. Go to the <a href='/products'>Products page</a>\n2. Browse available investments by sector\n3. Click <b>Invest</b> on your chosen product\n4. Select your balance source (Deposit or Earnings)\n5. Choose the number of units\n6. Confirm your investment\n\nFree/promo products can be activated at no cost — just click <b>Get Free</b>!\n\nAfter investing, collect your daily returns from <a href='/My-products'>My Products</a>."
    },
    {
      keys: ['free product','promo','free','get free','promotional','bonus product'],
      answer: "Promo products are free investment opportunities! Look for products marked <b>FREE</b> or with a <b>Get Free</b> button.\n\nSimply click <b>Get Free</b> to activate — no deposit needed. You'll earn daily returns that you can collect from <a href='/My-products'>My Products</a>.\n\nKeep an eye out for new promos!"
    },
    {
      keys: ['collect','daily return','earnings','income','daily income','my products','my investments','returns'],
      answer: "To collect your daily returns:\n\n1. Go to <a href='/My-products'>My Products</a>\n2. Find your active investments\n3. Click the <b>Collect</b> button when it's available\n\nYou can collect once every 24 hours per investment. Collected earnings go to your <b>Earnings Balance</b> which you can withdraw or reinvest.\n\n<b>Note:</b> Sunday is maintenance day — collections are paused."
    },
    {
      keys: ['deposit','add money','fund','top up','mpesa','m-pesa','paybill','recharge','add funds'],
      answer: "To deposit funds:\n\n1. Go to <a href='/deposit'>Deposit page</a>\n2. Choose <b>Auto Deposit</b> (M-Pesa STK push) or <b>Manual Deposit</b>\n3. Enter the amount you wish to deposit\n4. Follow the payment instructions\n\n<b>Auto Deposit:</b> You'll receive an M-Pesa prompt on your phone — just enter your PIN.\n<b>Manual Deposit:</b> Send to the provided Paybill/Till number, then submit your confirmation code for admin approval.\n\nDeposits go to your <b>Deposit Balance</b> for investing."
    },
    {
      keys: ['withdraw','cash out','take money','withdrawal','withdraw money','payout','withdraw funds'],
      answer: "To withdraw your earnings:\n\n1. Go to <a href='/withdraw'>Withdraw page</a>\n2. Enter the amount (from your <b>Earnings Balance</b>)\n3. Confirm your M-Pesa phone number\n4. Submit the request\n\nWithdrawals are processed by admin and sent to your registered M-Pesa number. Only your <b>Earnings Balance</b> (not deposit balance) is withdrawable.\n\nMinimum withdrawal amounts may apply."
    },
    {
      keys: ['referral','refer','invite','friend','commission','referral code','share','earn from friends','downline'],
      answer: "The AfricaBased referral program lets you earn commissions!\n\n1. Go to <a href='/referrals'>Referrals page</a> to get your unique referral link\n2. Share it with friends\n3. Earn commissions when your referrals invest:\n   • <b>Level 1</b> (direct): 10%\n   • <b>Level 2</b>: 6%\n   • <b>Level 3</b>: 1%\n\n<b>Requirements:</b> You need an active investment + at least 5 active direct referrals (Basic level) to start earning commissions.\n\nCollect your commissions from the Referrals page."
    },
    {
      keys: ['exchange','code','redeem','exchange code','voucher','gift code','coupon'],
      answer: "Exchange codes are special vouchers that add funds to your account!\n\nTo redeem:\n1. Go to <a href='/exchange'>Exchange page</a>\n2. Enter your code (e.g., RC-XXXXX)\n3. Click <b>Redeem</b>\n\nThe amount will be added to your balance. Codes may have limits on how many users can redeem them, so use them quickly!\n\nYour redemption history is shown on the Exchange page."
    },
    {
      keys: ['profile','account','settings','phone','password change','update','avatar','edit profile'],
      answer: "Manage your account on the <a href='/profile'>Profile page</a>:\n\n• Update your username and avatar\n• Change your M-Pesa phone number\n• Update your password\n• View your account details\n\nYour M-Pesa phone number is used for deposits and withdrawals, so keep it up to date!"
    },
    {
      keys: ['statistics','stats','balance','how much','total','overview','dashboard'],
      answer: "View all your financial details on the <a href='/statistics'>Statistics page</a>:\n\n• <b>Deposit Balance</b> — available funds for investing\n• <b>Earnings Balance</b> — withdrawable earnings\n• <b>Total Assets</b> — value of active investments\n• <b>Total Earnings</b> — with commission & redemption breakdown\n• <b>Today's Income</b> — collections today\n• <b>Total Deposits & Withdrawals</b>\n\nPlus a full transaction history at the bottom!"
    },
    {
      keys: ['safe','secure','security','trust','legitimate','legit','scam','fraud'],
      answer: "AfricaBased takes security seriously:\n\n• All passwords are encrypted\n• Email verification (OTP) on registration\n• JWT-based authentication tokens\n• Admin-approved deposits and withdrawals\n\nFor your safety:\n• Never share your password\n• Use a strong, unique password\n• Keep your M-Pesa PIN private\n• Only use official AfricaBased links"
    },
    {
      keys: ['maintenance','sunday','not working','error','problem','issue','bug','down'],
      answer: "A few things to check:\n\n• <b>Sundays</b> are maintenance days — daily income collection is paused\n• Make sure you have a stable internet connection\n• Try refreshing the page\n• Clear your browser cache if issues persist\n\nIf the problem continues, reach out via the <a href='/Services'>Support page</a> for WhatsApp assistance."
    },
    {
      keys: ['contact','whatsapp','support team','talk to someone','human','agent','customer service'],
      answer: "Need to talk to our team?\n\nVisit the <a href='/Services'>Services page</a> to find:\n• WhatsApp support groups\n• Direct manager contacts\n\nOur support team is available to help with account issues, deposit confirmations, and more."
    },
    {
      keys: ['membership','level','basic','premium','gold','tier','rank'],
      answer: "AfricaBased has membership levels based on your active direct referrals:\n\n• <b>Active</b> — You have an investment (default)\n• <b>Basic</b> — 5+ active referrals (commissions start!)\n• <b>Premium</b> — 60+ active referrals\n• <b>Gold</b> — 300+ active referrals\n\nHigher levels unlock commission earnings from your referral network. Check your level on the <a href='/referrals'>Referrals page</a>."
    },
    {
      keys: ['forgot password','reset password','cant remember','lost password'],
      answer: "To reset your password:\n\n1. Go to the <a href='/forgot-password'>Forgot Password page</a>\n2. Enter your registered email\n3. Check your inbox for the reset link\n4. Click the link and set a new password\n\nIf you don't receive the email, check your spam folder."
    },
    {
      keys: ['terms','conditions','rules','policy','tos'],
      answer: "You can read our full terms and conditions on the <a href='/terms'>Terms page</a>.\n\nKey points:\n• Investments have specific hold periods\n• Daily collections are available every 24 hours\n• Sundays are maintenance days\n• Withdrawals require admin approval"
    }
  ];

  var pageSuggestions = {
    'index': ['How do I register?', 'Is it safe?', 'What can I invest in?', 'Referral program'],
    'login': ['Forgot password', 'How to register', 'Help me log in'],
    'home': ['How to invest', 'My Products', 'Deposit funds', 'Check statistics'],
    'products': ['How to invest', 'Free products', 'Collect returns', 'My investments'],
    'My-products': ['How to collect', 'Invest more', 'View statistics'],
    'deposit': ['How to deposit', 'M-Pesa help', 'Deposit not showing?'],
    'auto-deposit': ['How does auto deposit work?', 'M-Pesa help'],
    'manual-deposit': ['How does manual deposit work?', 'Contact support'],
    'withdraw': ['How to withdraw', 'Minimum withdrawal?', 'Withdrawal pending?'],
    'referrals': ['How referrals work', 'Commission rates', 'Membership levels'],
    'exchange': ['How to redeem', 'Exchange code help'],
    'profile': ['Update phone', 'Change password', 'Edit profile'],
    'statistics': ['What is each balance?', 'Total earnings explained'],
    'forgot-password': ['Reset password help', 'Contact support'],
    'Services': ['Contact support', 'WhatsApp help']
  };

  var welcomeMessages = {
    'index': "Welcome to AfricaBased! I can help you get started with registration, explain our investment platform, or answer any questions.",
    'login': "Welcome back! Need help logging in, or want to reset your password? I'm here to help.",
    'home': "Hi there! Want to explore investment products, check your earnings, or learn about our referral program?",
    'products': "Browsing investments? I can explain how investing works, tell you about free products, or help you choose.",
    'My-products': "This is where you manage your investments. Need help collecting daily returns or understanding your progress?",
    'deposit': "Ready to add funds? I can walk you through the deposit process step by step.",
    'withdraw': "Need to cash out? I can explain how withdrawals work and what to expect.",
    'referrals': "Want to grow your network? I can explain commission rates, membership levels, and how to maximize earnings.",
    'exchange': "Have an exchange code? I can help you redeem it. Just ask!",
    'statistics': "Looking at your finances? I can explain each balance, commission totals, and your transaction history.",
    'profile': "Managing your account? I can help with updating your phone number, password, or profile details.",
    'auto-deposit': "Using auto deposit? I'll walk you through the M-Pesa STK push process. Just ask!",
    'manual-deposit': "Submitting a manual deposit? I can help you understand the process and what to expect after submitting.",
    'forgot-password': "Need to reset your password? I can guide you through the recovery process step by step.",
    'Services': "Looking for support? I can help you find the right contact or answer common questions right here."
  };

  function findAnswer(query) {
    var q = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    var words = q.split(/\s+/);
    var bestMatch = null;
    var bestScore = 0;

    for (var i = 0; i < KB.length; i++) {
      var score = 0;
      for (var j = 0; j < KB[i].keys.length; j++) {
        var key = KB[i].keys[j];
        if (q.indexOf(key) !== -1) {
          score += key.length + 2;
        } else {
          var keyWords = key.split(/\s+/);
          for (var k = 0; k < keyWords.length; k++) {
            for (var w = 0; w < words.length; w++) {
              if (words[w] === keyWords[k] || (words[w].length > 3 && keyWords[k].indexOf(words[w]) === 0)) {
                score += 1;
              }
            }
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = KB[i];
      }
    }

    if (bestScore >= 2 && bestMatch) {
      return bestMatch.answer;
    }

    return "I'm not sure about that, but I can help with:\n\n• <b>Registration & Login</b>\n• <b>Investing</b> in products\n• <b>Deposits</b> & <b>Withdrawals</b>\n• <b>Referrals</b> & commissions\n• <b>Exchange codes</b>\n• <b>Account settings</b>\n\nTry asking about any of these topics, or visit our <a href='/Services'>Support page</a> for direct help.";
  }

  function createWidget() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/ai-assistant.css';
    document.head.appendChild(link);

    var bubble = document.createElement('button');
    bubble.id = 'abAiBubble';
    bubble.className = 'ab-ai-bubble';
    bubble.setAttribute('data-testid', 'button-ai-assistant');
    bubble.innerHTML = '<i class="fas fa-robot"></i><span class="ab-badge"></span>';
    document.body.appendChild(bubble);

    var panel = document.createElement('div');
    panel.id = 'abAiPanel';
    panel.className = 'ab-ai-panel';
    panel.innerHTML =
      '<div class="ab-ai-header">' +
        '<div class="ab-ai-avatar"><i class="fas fa-robot"></i></div>' +
        '<div class="ab-ai-header-info"><h4>AB Assistant</h4><span>Always online</span></div>' +
        '<button class="ab-ai-close" data-testid="button-close-assistant"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="ab-ai-messages" id="abAiMessages"></div>' +
      '<div class="ab-ai-suggestions" id="abAiSuggestions"></div>' +
      '<div class="ab-ai-input-area">' +
        '<input type="text" id="abAiInput" placeholder="Type your question..." data-testid="input-ai-question" autocomplete="off">' +
        '<button id="abAiSend" data-testid="button-send-question"><i class="fas fa-paper-plane"></i></button>' +
      '</div>';
    document.body.appendChild(panel);

    var messages = document.getElementById('abAiMessages');
    var suggestionsEl = document.getElementById('abAiSuggestions');
    var input = document.getElementById('abAiInput');
    var sendBtn = document.getElementById('abAiSend');
    var closeBtn = panel.querySelector('.ab-ai-close');
    var isOpen = false;

    function addMessage(text, type) {
      var div = document.createElement('div');
      div.className = 'ab-ai-msg ' + type;
      if (type === 'user') {
        div.textContent = text;
      } else {
        div.innerHTML = text;
      }
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      var div = document.createElement('div');
      div.className = 'ab-ai-typing';
      div.id = 'abAiTyping';
      div.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
      var t = document.getElementById('abAiTyping');
      if (t) t.remove();
    }

    function showSuggestions(items) {
      suggestionsEl.innerHTML = '';
      if (!items || !items.length) return;
      items.forEach(function(text) {
        var btn = document.createElement('button');
        btn.textContent = text;
        btn.addEventListener('click', function() { handleSend(text); });
        suggestionsEl.appendChild(btn);
      });
    }

    function handleSend(text) {
      var q = text || input.value.trim();
      if (!q) return;
      input.value = '';
      addMessage(q, 'user');
      suggestionsEl.innerHTML = '';
      showTyping();

      var delay = 400 + Math.random() * 600;
      setTimeout(function() {
        hideTyping();
        var answer = findAnswer(q);
        addMessage(answer, 'bot');
        var followUp = ['How to invest', 'Deposit funds', 'Referral program', 'Exchange codes', 'Contact support'];
        var filtered = followUp.filter(function(s) { return q.toLowerCase().indexOf(s.toLowerCase().split(' ')[0]) === -1; });
        showSuggestions(filtered.slice(0, 3));
      }, delay);
    }

    function togglePanel() {
      isOpen = !isOpen;
      if (isOpen) {
        panel.classList.add('visible');
        bubble.classList.add('open');
        bubble.querySelector('.ab-badge').style.display = 'none';
        if (!messages.children.length) {
          var welcome = welcomeMessages[currentPage] || welcomeMessages['home'] || "Hi! How can I help you today?";
          addMessage(welcome, 'bot');
          var pageSuggs = pageSuggestions[currentPage] || pageSuggestions['home'] || ['How to invest', 'Deposit', 'Referrals'];
          showSuggestions(pageSuggs);
        }
        setTimeout(function() { input.focus(); }, 300);
      } else {
        panel.classList.remove('visible');
        bubble.classList.remove('open');
      }
    }

    bubble.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', function() {
      isOpen = true;
      togglePanel();
    });

    sendBtn.addEventListener('click', function() { handleSend(); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSend();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();

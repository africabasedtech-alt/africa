(function() {
  if (document.getElementById('abAiBubble')) return;

  var currentPage = window.location.pathname.replace(/\.html$/, '').replace(/^\//, '') || 'index';
  var isLoggedIn = !!(window.getABToken && window.getABToken());
  var userName = '';
  var conversationHistory = [];
  var aiAvailable = true;

  if (isLoggedIn) {
    try {
      var token = window.getABToken();
      fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function(r) { return r.json(); })
        .then(function(d) { if (d && d.username) userName = d.username; })
        .catch(function() {});
    } catch(e) {}
  }

  var KB = [
    {
      keys: ['hello','hi','hey','help','assist','support','start'],
      answer: function() { return "Hello" + (userName ? ", " + userName : "") + "! I'm AB Assistant, your personal guide on AfricaBased. I can help you with:\n\n• Investing in products & earning daily returns\n• Deposits & Withdrawals via M-Pesa\n• Building your referral network & earning commissions\n• Exchange codes & account management\n\nWhat would you like to know?"; }
    },
    {
      keys: ['register','sign up','create account','join','signup','new account','registration'],
      answer: function() { return "To create an account:\n\n1. Enter your username, email, and password on the <a href='/'>registration page</a>\n2. If you have a referral code, enter it to connect with your referrer\n3. Click Register — you'll receive an OTP code via email\n4. Enter the OTP to verify your account\n\nOnce you're in, I recommend depositing funds and investing right away — the sooner you start, the sooner you earn daily returns!"; }
    },
    {
      keys: ['login','log in','sign in','cant login','password wrong','access','signin'],
      answer: function() { return "To log in, go to the <a href='/login'>Login page</a> and enter your email and password.\n\nForgot your password? Use the <a href='/forgot-password'>Forgot Password</a> link to reset it via email.\n\nIf you're still having trouble, make sure you verified your email during registration."; }
    },
    {
      keys: ['invest','product','buy','purchase','how to invest','investing','plans','packages','opportunity','opportunities'],
      answer: function() { return (userName ? userName + ", g" : "G") + "reat question! Investing on AfricaBased is simple:\n\n1. Go to the <a href='/products'>Products page</a>\n2. Browse investments across Agriculture, Technology, Real Estate, Energy & more\n3. Click <b>Invest</b> on your chosen product\n4. Select your balance source & number of units\n5. Confirm and start earning!\n\nYou'll earn daily returns that you can collect from <a href='/My-products'>My Products</a>. I recommend diversifying across sectors for the best results. The earlier you invest, the sooner your money works for you!"; }
    },
    {
      keys: ['collect','daily return','earnings','income','daily income','my products','my investments','returns'],
      answer: function() { return "To collect your daily returns:\n\n1. Go to <a href='/My-products'>My Products</a>\n2. Find your active investments\n3. Click the <b>Collect</b> button when available\n\nYou can collect once every 24 hours per investment. Earnings go to your <b>Earnings Balance</b> which you can withdraw or reinvest.\n\n<b>Note:</b> Sundays are maintenance days — collections resume on Monday.\n\n💡 <b>Pro tip:</b> Reinvesting your earnings into more products compounds your growth! And don't forget to invite friends — their investments earn you commissions too!"; }
    },
    {
      keys: ['deposit','add money','fund','top up','mpesa','m-pesa','paybill','recharge','add funds'],
      answer: function() { return "To deposit funds:\n\n1. Go to <a href='/deposit'>Deposit page</a>\n2. Choose <b>Auto Deposit</b> (M-Pesa STK push) or <b>Manual Deposit</b>\n3. Enter the amount\n4. Follow the payment instructions\n\n<b>Auto Deposit:</b> You'll receive an M-Pesa prompt — just enter your PIN.\n<b>Manual Deposit:</b> Send to the provided Paybill/Till, then submit your confirmation code.\n\nDeposits go to your <b>Deposit Balance</b> — head to <a href='/products'>Products</a> to invest and start earning!"; }
    },
    {
      keys: ['withdraw','cash out','take money','withdrawal','withdraw money','payout','withdraw funds'],
      answer: function() { return "To withdraw your earnings:\n\n1. Go to <a href='/withdraw'>Withdraw page</a>\n2. Enter the amount from your <b>Earnings Balance</b>\n3. Confirm your M-Pesa number\n4. Submit the request\n\nWithdrawals are processed by admin and sent to your M-Pesa. Only <b>Earnings Balance</b> (not deposit balance) is withdrawable.\n\n💡 Consider reinvesting some earnings into more products to grow your portfolio!"; }
    },
    {
      keys: ['referral','refer','invite','friend','commission','referral code','share','earn from friends','downline','network','team'],
      answer: function() { return (userName ? userName + ", b" : "B") + "uilding your referral network is one of the smartest moves on AfricaBased! Here's why:\n\n<b>Commission Rates:</b>\n• <b>Level 1</b> (direct referrals): <b>10%</b> commission\n• <b>Level 2</b> (their referrals): <b>6%</b> commission\n• <b>Level 3</b>: <b>1%</b> commission\n\n<b>Requirements:</b> Active investment + 5 active direct referrals (Basic level) to start earning.\n\n<b>Membership Levels:</b>\n• Active — Have an investment\n• Basic (5+) — Commissions unlocked!\n• Premium (60+) — Growing leader\n• Gold (300+) — Top earner\n\nEvery person you invite who invests becomes a source of <b>daily passive income</b> for you! Share your referral link from the <a href='/referrals'>Referrals page</a> with friends, family, and on social media. The more downlines you build, the more you earn — even while you sleep! 🚀"; }
    },
    {
      keys: ['exchange','code','redeem','exchange code','voucher','gift code','coupon'],
      answer: function() { return "Exchange codes are special vouchers that add funds to your account!\n\n1. Go to <a href='/exchange'>Exchange page</a>\n2. Enter your code (e.g., RC-XXXXX)\n3. Click <b>Redeem</b>\n\nThe amount is added to your balance instantly. Codes have limited uses, so redeem quickly!\n\nOnce redeemed, head to <a href='/products'>Products</a> to invest those funds and start earning!"; }
    },
    {
      keys: ['profile','account','settings','phone','password change','update','avatar','edit profile'],
      answer: function() { return "Manage your account on the <a href='/profile'>Profile page</a>:\n\n• Update your username and avatar\n• Change your M-Pesa phone number\n• Update your password\n• Access WhatsApp support groups\n• View your membership level\n\nKeep your M-Pesa phone number up to date — it's used for deposits and withdrawals!"; }
    },
    {
      keys: ['statistics','stats','balance','how much','total','overview','dashboard'],
      answer: function() { return "View all your financial details on the <a href='/statistics'>Statistics page</a>:\n\n• <b>Deposit Balance</b> — funds for investing\n• <b>Earnings Balance</b> — withdrawable earnings\n• <b>Total Assets</b> — active investment value\n• <b>Today's Income</b> — collected today\n• <b>Transaction History</b> — full log\n\n" + (userName ? userName + ", i" : "I") + "f you have idle balance sitting there, consider investing it in a product to make it work for you!"; }
    },
    {
      keys: ['safe','secure','security','trust','legitimate','legit','scam','fraud'],
      answer: function() { return "AfricaBased takes security seriously:\n\n• All passwords are encrypted\n• Email verification (OTP) on registration\n• Secure JWT authentication\n• Admin-approved deposits and withdrawals\n• Biometric login option available\n\nFor your safety: never share your password, use a strong unique password, and keep your M-Pesa PIN private."; }
    },
    {
      keys: ['maintenance','sunday','not working','error','problem','issue','bug','down'],
      answer: function() { return "A few things to check:\n\n• <b>Sundays</b> are maintenance days — income collection is paused\n• Make sure you have stable internet\n• Try refreshing the page\n• Clear your browser cache if issues persist\n\nIf the problem continues, reach out via the WhatsApp support on your <a href='/profile'>Profile page</a>."; }
    },
    {
      keys: ['contact','whatsapp','support team','talk to someone','human','agent','customer service'],
      answer: function() { return "Need to talk to our team?\n\nVisit your <a href='/profile'>Profile page</a> and scroll to the <b>Connect</b> section to find:\n• WhatsApp support groups\n• Direct manager contacts\n\nOur support team is ready to help!"; }
    },
    {
      keys: ['membership','level','basic','premium','gold','tier','rank'],
      answer: function() { return "AfricaBased membership levels are based on your total active downlines:\n\n• <b>Active</b> — You have an investment\n• <b>Basic</b> (5+) — Commissions unlocked! 🎉\n• <b>Premium</b> (60+) — Growing network leader\n• <b>Gold</b> (300+) — Top earner status\n\n" + (userName ? userName + ", t" : "T") + "he key to climbing levels is building your referral network. Each active referral counts toward your tier. Invite friends, help them invest, and watch your passive income grow!"; }
    },
    {
      keys: ['forgot password','reset password','cant remember','lost password'],
      answer: function() { return "To reset your password:\n\n1. Go to the <a href='/forgot-password'>Forgot Password page</a>\n2. Enter your registered email\n3. Check your inbox for the reset link\n4. Click the link and set a new password\n\nCheck spam folder if you don't see the email."; }
    },
    {
      keys: ['money','make money','earn','how to earn','income','passive','passive income','strategy'],
      answer: function() { return (userName ? userName + ", h" : "H") + "ere's how to maximize your earnings on AfricaBased:\n\n<b>1. Invest in Products</b>\nBrowse <a href='/products'>Products</a> across multiple sectors. Each product earns you daily returns!\n\n<b>2. Collect Daily</b>\nVisit <a href='/My-products'>My Products</a> every day to collect your income.\n\n<b>3. Build Your Team</b>\nThis is the game-changer! Share your referral link and earn:\n• 10% from Level 1 referrals\n• 6% from Level 2\n• 1% from Level 3\n\n<b>4. Reinvest Earnings</b>\nCompound your growth by reinvesting collected earnings into more products.\n\nThe most successful users combine active investing with a strong referral network. Start building yours today from the <a href='/referrals'>Referrals page</a>! 🚀"; }
    },
    {
      keys: ['terms','conditions','rules','policy','tos'],
      answer: function() { return "You can read our full terms on the <a href='/terms'>Terms page</a>.\n\nKey points:\n• Investments have specific hold periods\n• Daily collections available every 24 hours\n• Sundays are maintenance days\n• Withdrawals require admin approval"; }
    },
    {
      keys: ['who are you','what are you','your name','about you','tell me about yourself'],
      answer: function() { return "I'm <b>AB Assistant</b>" + (userName ? ", and it's great to chat with you, " + userName : "") + "! I'm your personal AI guide on the AfricaBased investment platform.\n\nI'm here 24/7 to help you:\n• Navigate the platform\n• Understand investment opportunities\n• Learn about the referral program\n• Troubleshoot any issues\n\nThink of me as your investment companion — I'm always here to help you make the most of AfricaBased! What would you like to know?"; }
    }
  ];

  var pageSuggestions = {
    'index': ['How do I register?', 'How can I earn?', 'What can I invest in?', 'Tell me about referrals'],
    'login': ['Forgot password', 'How to register', 'Help me log in'],
    'home': ['How to invest', 'How to earn more', 'Referral program', 'Check statistics'],
    'products': ['How to invest', 'Best strategy', 'Collect returns', 'Build my team'],
    'My-products': ['How to collect', 'Invest more', 'Why build downlines?'],
    'deposit': ['How to deposit', 'M-Pesa help', 'What to do after deposit?'],
    'auto-deposit': ['How does auto deposit work?', 'M-Pesa help'],
    'manual-deposit': ['How does manual deposit work?', 'Contact support'],
    'withdraw': ['How to withdraw', 'Reinvest earnings?', 'Build passive income'],
    'referrals': ['How referrals work', 'Commission rates', 'How to get more referrals'],
    'exchange': ['How to redeem', 'Exchange code help'],
    'profile': ['Update phone', 'Change password', 'My membership level'],
    'statistics': ['What is each balance?', 'How to earn more', 'Investment strategy'],
    'forgot-password': ['Reset password help', 'Contact support'],
    'Services': ['Contact support', 'WhatsApp help']
  };

  function getWelcome() {
    var name = userName || '';
    var greet = name ? ('Hi ' + name + '! ') : 'Hi there! ';
    var intro = "I'm <b>AB Assistant</b>, your personal guide on AfricaBased. ";
    var pages = {
      'index': "Ready to start your investment journey? I can help you register and get going!",
      'login': "Welcome back! Need help logging in, or want to reset your password?",
      'home': "What would you like to do today? Invest in products, check earnings, or grow your referral network?",
      'products': "Great choice exploring investments! Want help choosing a product or understanding how returns work?",
      'My-products': "Here's where your money works for you! Need help collecting returns or managing investments?",
      'deposit': "Ready to fund your account? I'll walk you through the deposit process!",
      'withdraw': "Looking to cash out? I can explain withdrawals — or suggest reinvesting some for bigger returns!",
      'referrals': "Your referral network is key to earning passive income! Want to learn how to maximize your commissions?",
      'exchange': "Have an exchange code? I'll help you redeem it in seconds!",
      'statistics': "Let's look at your numbers! I can explain any balance or help you plan your next move.",
      'profile': "Managing your account? I can help with settings, or tell you about your membership level!",
    };
    return greet + intro + (pages[currentPage] || "How can I help you today?");
  }

  function findKBAnswer(query) {
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
      return bestMatch.answer();
    }
    return null;
  }

  async function getAIResponse(query) {
    if (!aiAvailable) return null;
    try {
      var headers = { 'Content-Type': 'application/json' };
      var token = window.getABToken && window.getABToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;

      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: query,
          userName: userName,
          currentPage: currentPage,
          conversationHistory: conversationHistory.slice(-6)
        })
      });

      if (res.status === 429 || res.status === 503) {
        aiAvailable = false;
        return null;
      }

      if (!res.ok) return null;
      var data = await res.json();
      return data.reply || null;
    } catch(e) {
      return null;
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatAIResponse(text) {
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    safe = safe.replace(/\n/g, '<br>');
    safe = safe.replace(/\[([^\]]+)\]\(\/([\w\-\/]+)\)/g, '<a href="/$2">$1</a>');
    return safe;
  }

  function createWidget() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/ai-assistant.css';
    document.head.appendChild(link);

    var aiIconSVG = '<svg class="ab-ai-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.15)"/><path d="M12 3c1.5 0 2.7 1.2 2.7 2.7S13.5 8.4 12 8.4 9.3 7.2 9.3 5.7 10.5 3 12 3z" fill="#fff"/><path d="M7 10.5c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5v4c0 2.49-2.01 4.5-4.5 4.5h-1c-2.49 0-4.5-2.01-4.5-4.5v-4z" fill="#fff"/><circle cx="9.5" cy="12" r="1" fill="#667eea"/><circle cx="14.5" cy="12" r="1" fill="#667eea"/><path d="M10 15.5c0 0 .8 1 2 1s2-1 2-1" stroke="#667eea" stroke-width="0.8" stroke-linecap="round"/><path d="M5 8l-2-1M19 8l2-1M5 16l-2 1M19 16l2 1" stroke="#fff" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/></svg>';

    var bubble = document.createElement('button');
    bubble.id = 'abAiBubble';
    bubble.className = 'ab-ai-bubble';
    bubble.setAttribute('data-testid', 'button-ai-assistant');
    bubble.innerHTML = aiIconSVG + '<span class="ab-badge"></span>';
    document.body.appendChild(bubble);

    var _dragState = { dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false };
    function onDragStart(e) {
      var t = e.touches ? e.touches[0] : e;
      var rect = bubble.getBoundingClientRect();
      _dragState.dragging = true;
      _dragState.moved = false;
      _dragState.startX = t.clientX;
      _dragState.startY = t.clientY;
      _dragState.origX = rect.left;
      _dragState.origY = rect.top;
      bubble.style.transition = 'none';
    }
    function onDragMove(e) {
      if (!_dragState.dragging) return;
      var t = e.touches ? e.touches[0] : e;
      var dx = t.clientX - _dragState.startX;
      var dy = t.clientY - _dragState.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) _dragState.moved = true;
      if (!_dragState.moved) return;
      e.preventDefault();
      var nx = _dragState.origX + dx;
      var ny = _dragState.origY + dy;
      nx = Math.max(0, Math.min(window.innerWidth - 60, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 60, ny));
      bubble.style.left = nx + 'px';
      bubble.style.top = ny + 'px';
      bubble.style.right = 'auto';
      bubble.style.bottom = 'auto';
    }
    function onDragEnd() {
      if (!_dragState.dragging) return;
      _dragState.dragging = false;
      bubble.style.transition = '';
      var rect = bubble.getBoundingClientRect();
      var midX = rect.left + rect.width / 2;
      if (midX < window.innerWidth / 2) {
        bubble.style.left = '16px';
        bubble.style.right = 'auto';
      } else {
        bubble.style.left = 'auto';
        bubble.style.right = '16px';
      }
    }
    bubble.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    bubble.addEventListener('touchstart', onDragStart, { passive: true });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    var panel = document.createElement('div');
    panel.id = 'abAiPanel';
    panel.className = 'ab-ai-panel';
    panel.innerHTML =
      '<div class="ab-ai-header">' +
        '<div class="ab-ai-avatar">' + aiIconSVG + '</div>' +
        '<div class="ab-ai-header-info"><h4>AB Assistant</h4><span>AI-Powered • Always online</span></div>' +
        '<button class="ab-ai-close" data-testid="button-close-assistant"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="ab-ai-messages" id="abAiMessages"></div>' +
      '<div class="ab-ai-suggestions" id="abAiSuggestions"></div>' +
      '<div class="ab-ai-input-area">' +
        '<input type="text" id="abAiInput" placeholder="Ask me anything..." data-testid="input-ai-question" autocomplete="off" maxlength="500">' +
        '<button id="abAiSend" data-testid="button-send-question"><i class="fas fa-paper-plane"></i></button>' +
      '</div>';
    document.body.appendChild(panel);

    var messages = document.getElementById('abAiMessages');
    var suggestionsEl = document.getElementById('abAiSuggestions');
    var input = document.getElementById('abAiInput');
    var sendBtn = document.getElementById('abAiSend');
    var closeBtn = panel.querySelector('.ab-ai-close');
    var isOpen = false;
    var isSending = false;

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

    async function handleSend(text) {
      if (isSending) return;
      var q = text || input.value.trim();
      if (!q) return;
      input.value = '';
      isSending = true;
      sendBtn.disabled = true;
      addMessage(q, 'user');
      suggestionsEl.innerHTML = '';
      showTyping();

      conversationHistory.push({ role: 'user', content: q });

      try {
        var answer = null;
        try {
          answer = await getAIResponse(q);
        } catch(e) {}

        if (answer) {
          answer = formatAIResponse(answer);
        } else {
          answer = findKBAnswer(q);
        }

        if (!answer) {
          answer = (userName ? userName + ", I" : "I") + "'m not sure about that specific question, but I can help you with investing, deposits, withdrawals, referrals, and more! Try asking about any of these, or visit your <a href='/profile'>Profile page</a> to contact support directly.\n\n<b>Quick tip:</b> Have you checked out the latest <a href='/products'>investment products</a>? There might be a great opportunity waiting for you!";
        }

        hideTyping();
        addMessage(answer, 'bot');
        conversationHistory.push({ role: 'assistant', content: answer.replace(/<[^>]+>/g, '') });

        if (conversationHistory.length > 20) {
          conversationHistory = conversationHistory.slice(-12);
        }

        var followUp = ['How to invest', 'Build my referral team', 'Deposit funds', 'Earning strategy', 'Contact support'];
        var qLower = q.toLowerCase();
        var filtered = followUp.filter(function(s) { return qLower.indexOf(s.toLowerCase().split(' ')[0]) === -1; });
        showSuggestions(filtered.slice(0, 3));
      } finally {
        isSending = false;
        sendBtn.disabled = false;
      }
    }

    function togglePanel() {
      isOpen = !isOpen;
      if (isOpen) {
        panel.classList.add('visible');
        bubble.classList.add('open');
        bubble.querySelector('.ab-badge').style.display = 'none';
        if (!messages.children.length) {
          var welcome = getWelcome();
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

    bubble.addEventListener('click', function(e) {
      if (_dragState.moved) { _dragState.moved = false; return; }
      togglePanel();
    });
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

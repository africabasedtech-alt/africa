// Supabase code commented out for now. Using localStorage only.
// const supabaseUrl = 'https://dcbxjekrwgblxpyfhyat.supabase.co';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYnhqZWtyd2dibHhweWZoeWF0Iiwicm9zZSI6ImFub24iLCJpYXQiOjE3NjYwNDk5MjYsImV4cCI6MjA4MTYyNTkyNn0.5Y-REVsT3EzVtiHN6Sjfy8rIts4HRzOK82tHGBu1yyg';
// import { createClient } from 'https://unpkg.com/@supabase/supabase-js@2';
// const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize state
let currentMode = localStorage.getItem('activeDepositMode') || 'manual';
let channels = [];

// DOM Elements
const depositChannel = document.getElementById('depositChannel');
const depositMode = document.getElementById('depositMode');
const switchDepositBtn = document.getElementById('switchDepositBtn');
const addTillBtn = document.getElementById('addTillBtn');
const addBankBtn = document.getElementById('addBankBtn');
const addPaybillBtn = document.getElementById('addPaybillBtn');

// Initialize deposit channels
async function initializeDepositChannels() {
    // For now, use localStorage only
    try {
        let channelsLS = [];
        try { channelsLS = JSON.parse(localStorage.getItem('depositChannels') || '[]'); } catch {}
        channels = channelsLS;
        updateChannelSelect();
    } catch (error) {
        showNotification('Error loading deposit channels: ' + error.message);
    }
}

// Update channel select dropdown
function updateChannelSelect() {
    depositChannel.innerHTML = '';
    // Gather all accounts from localStorage
    let tills = [], paybills = [], banks = [];
    try { tills = JSON.parse(localStorage.getItem('depositTills') || '[]'); } catch {}
    try { paybills = JSON.parse(localStorage.getItem('depositPaybills') || '[]'); } catch {}
    try { banks = JSON.parse(localStorage.getItem('depositBanks') || '[]'); } catch {}

    // Add tills
    tills.forEach(till => {
        const option = document.createElement('option');
        option.value = 'till:' + till.till;
        option.textContent = 'Mpesa Till: ' + till.till + (till.businessName ? ' (' + till.businessName + ')' : '');
        depositChannel.appendChild(option);
    });
    // Add paybills
    paybills.forEach(paybill => {
        const option = document.createElement('option');
        option.value = 'paybill:' + paybill.paybillNum;
        option.textContent = 'Paybill: ' + paybill.paybillNum + (paybill.accName ? ' (' + paybill.accName + ')' : '');
        depositChannel.appendChild(option);
    });
    // Add banks
    banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = 'bank:' + bank.accountNumber;
        option.textContent = 'Bank: ' + bank.bankName + ' (' + bank.accountNumber + ')';
        depositChannel.appendChild(option);
    });
    // If nothing, show a placeholder
    if (!depositChannel.children.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No deposit channels/accounts saved';
        depositChannel.appendChild(option);
    }
}
}

// Switch deposit mode and save selected channel for manual-deposit page
async function switchDepositMode() {
    const newMode = depositMode.value;
    const selectedChannel = depositChannel.value;

    // Save selected channel and mode for manual-deposit page
    localStorage.setItem('manualDepositMode', newMode);
    // Save channel type and value
    if (selectedChannel) {
        localStorage.setItem('manualDepositChannel', selectedChannel);
    }

    currentMode = newMode;
    localStorage.setItem('activeDepositMode', newMode);
    showNotification(`Successfully switched to ${newMode} mode`);
    updateUIForMode(newMode);
}

// Save Till Number
async function saveTill() {
    const tillData = {
        number: document.getElementById('tillNum').value,
        business_name: document.getElementById('tillBusinessName').value,
        shortcode: document.getElementById('tillShortcode').value,
        api_key: document.getElementById('tillApiKey').value,
        client_id: document.getElementById('tillClientId').value,
        client_secret: document.getElementById('tillClientSecret').value,
        callback_url: document.getElementById('tillCallback').value
    };

    try {
        // Validate required fields
        if (!tillData.number || !tillData.business_name || !tillData.shortcode) {
            showNotification('Please fill in all required Mpesa Till fields.');
            return;
        }
        let tills = [];
        try { tills = JSON.parse(localStorage.getItem('depositTills') || '[]'); } catch {}
        // Prevent duplicate till number
        if (tills.some(t => t.till === tillData.number)) {
            showNotification('This till number already exists.');
            return;
        }
        tills.push({
            till: tillData.number,
            businessName: tillData.business_name,
            shortcode: tillData.shortcode
        });
        localStorage.setItem('depositTills', JSON.stringify(tills));

        showNotification('Till number added successfully');
        document.getElementById('addTillForm').style.display = 'none';
        updateTillList();
    } catch (error) {
        showNotification('Error saving till: ' + error.message);
    }
}

// Save Bank Account
async function saveBank() {
    const bankData = {
        name: document.getElementById('bankName').value,
        account_number: document.getElementById('bankAcc').value,
        account_name: document.getElementById('bankAccName').value,
        api_key: document.getElementById('bankApiKey').value,
        client_id: document.getElementById('bankClientId').value,
        client_secret: document.getElementById('bankClientSecret').value,
        callback_url: document.getElementById('bankCallback').value
    };

    try {
        // Validate required fields
        if (!bankData.name || !bankData.account_number || !bankData.account_name) {
            showNotification('Please fill in all required Bank Account fields.');
            return;
        }
        let banks = [];
        try { banks = JSON.parse(localStorage.getItem('depositBanks') || '[]'); } catch {}
        // Prevent duplicate account number
        if (banks.some(b => b.accountNumber === bankData.account_number)) {
            showNotification('This bank account number already exists.');
            return;
        }
        banks.push({
            bankName: bankData.name,
            accountNumber: bankData.account_number,
            accountName: bankData.account_name
        });
        localStorage.setItem('depositBanks', JSON.stringify(banks));

        showNotification('Bank account added successfully');
        document.getElementById('addBankForm').style.display = 'none';
        updateBankList();
    } catch (error) {
        showNotification('Error saving bank account: ' + error.message);
    }
}

// Save Paybill
async function savePaybill() {
    const paybillData = {
        number: document.getElementById('paybillNum').value,
        account_number: document.getElementById('paybillAccNum').value,
        account_name: document.getElementById('paybillAccName').value,
        api_key: document.getElementById('paybillApiKey').value,
        client_id: document.getElementById('paybillClientId').value,
        client_secret: document.getElementById('paybillClientSecret').value,
        callback_url: document.getElementById('paybillCallback').value
    };

    try {
        // Validate required fields
        if (!paybillData.number || !paybillData.account_number || !paybillData.account_name) {
            showNotification('Please fill in all required Paybill fields.');
            return;
        }
        let paybills = [];
        try { paybills = JSON.parse(localStorage.getItem('depositPaybills') || '[]'); } catch {}
        // Prevent duplicate paybill number
        if (paybills.some(p => p.paybillNum === paybillData.number)) {
            showNotification('This paybill number already exists.');
            return;
        }
        paybills.push({
            paybillNum: paybillData.number,
            accNum: paybillData.account_number,
            accName: paybillData.account_name
        });
        localStorage.setItem('depositPaybills', JSON.stringify(paybills));

        showNotification('Paybill added successfully');
        document.getElementById('addPaybillForm').style.display = 'none';
        updatePaybillList();
    } catch (error) {
        showNotification('Error saving paybill: ' + error.message);
    }
}

// Show notification
function showNotification(message) {
    const notificationList = document.getElementById('adminNotificationList');
    const notification = document.createElement('li');
    notification.textContent = message;
    notificationList.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Update UI based on mode
function updateUIForMode(mode) {
    const autoDepositTable = document.getElementById('autoDepositTableWrap');
    const manualDepositTable = document.getElementById('depositTableWrap');

    if (mode === 'auto') {
        autoDepositTable.style.display = 'block';
        manualDepositTable.style.display = 'none';
    } else {
        autoDepositTable.style.display = 'none';
        manualDepositTable.style.display = 'block';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeDepositChannels();
    updateUIForMode(currentMode);

    // Set initial mode
    depositMode.value = currentMode;

    // Set initial channel from localStorage if available
    const savedChannel = localStorage.getItem('manualDepositChannel');
    if (savedChannel) {
        for (let i = 0; i < depositChannel.options.length; i++) {
            if (depositChannel.options[i].value === savedChannel) {
                depositChannel.selectedIndex = i;
                break;
            }
        }
    }

    // Mode switch button
    switchDepositBtn.addEventListener('click', switchDepositMode);

    // Channel dropdown change: save to localStorage for manual-deposit page
    depositChannel.addEventListener('change', function() {
        localStorage.setItem('manualDepositChannel', depositChannel.value);
    });

    // Till management
    addTillBtn.addEventListener('click', () => {
        document.getElementById('addTillForm').style.display = 'block';
    });
    document.getElementById('saveTillBtn').addEventListener('click', saveTill);
    document.getElementById('cancelTillBtn').addEventListener('click', () => {
        document.getElementById('addTillForm').style.display = 'none';
    });

    // Bank management
    addBankBtn.addEventListener('click', () => {
        document.getElementById('addBankForm').style.display = 'block';
    });
    document.getElementById('saveBankBtn').addEventListener('click', saveBank);
    document.getElementById('cancelBankBtn').addEventListener('click', () => {
        document.getElementById('addBankForm').style.display = 'none';
    });

    // Paybill management
    addPaybillBtn.addEventListener('click', () => {
        document.getElementById('addPaybillForm').style.display = 'block';
    });
    document.getElementById('savePaybillBtn').addEventListener('click', savePaybill);
    document.getElementById('cancelPaybillBtn').addEventListener('click', () => {
        document.getElementById('addPaybillForm').style.display = 'none';
    });
});

// Update lists
async function updateTillList() {
    // Show from localStorage for instant feedback
    let tills = [];
    try { tills = JSON.parse(localStorage.getItem('depositTills') || '[]'); } catch {}
    const tillList = document.getElementById('tillList');
    tillList.innerHTML = tills.map(till => `
        <div>Till Number: ${till.till}<br>Business: ${till.businessName}</div>
    `).join('');
}

async function updateBankList() {
    let banks = [];
    try { banks = JSON.parse(localStorage.getItem('depositBanks') || '[]'); } catch {}
    const bankList = document.getElementById('bankList');
    bankList.innerHTML = banks.map(bank => `
        <div>Bank: ${bank.bankName}<br>Account: ${bank.accountNumber}</div>
    `).join('');
}

async function updatePaybillList() {
    let paybills = [];
    try { paybills = JSON.parse(localStorage.getItem('depositPaybills') || '[]'); } catch {}
    const paybillList = document.getElementById('paybillList');
    paybillList.innerHTML = paybills.map(paybill => `
        <div>Paybill: ${paybill.paybillNum}<br>Account: ${paybill.accNum}</div>
    `).join('');
}

// Initial update of lists
updateTillList();
updateBankList();
updatePaybillList();

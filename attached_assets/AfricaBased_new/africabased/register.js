// js/register.js
// Registration logic for AfricaBased registration page
import { supabase } from './supabaseClient.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerForm = document.getElementById('registerForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    let isValid = true;

    // Reset error messages
    document.querySelectorAll('.error-message').forEach(elem => {
        elem.style.display = 'none';
    });
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get form values
    const username = document.getElementById('username').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate username
    if (!username) {
        document.getElementById('usernameError').textContent = 'Please enter a username';
        document.getElementById('usernameError').style.display = 'block';
        isValid = false;
    }

    // Validate phone (Kenyan formats: +2547XXXXXXXX, 07XXXXXXXX, 01XXXXXXXX)
    const phoneRegex = /^(\+2547\d{8}|07\d{8}|01\d{8})$/;
    if (!phone) {
        document.getElementById('phoneError').textContent = 'Please enter your phone number';
        document.getElementById('phoneError').style.display = 'block';
        isValid = false;
    } else if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').textContent = 'Please enter a valid Kenyan phone number (e.g. +254700000000, 0700000000, 0100000000)';
        document.getElementById('phoneError').style.display = 'block';
        isValid = false;
    }

    // Validate email
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address';
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    }

    // Validate password
    if (password.length < 8) {
        document.getElementById('passwordError').textContent = 'Password must be at least 8 characters long';
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    }

    // Validate password match
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        document.getElementById('confirmPasswordError').style.display = 'block';
        isValid = false;
    }

    if (!document.getElementById('terms').checked) {
        errorMessage.textContent = 'Please accept the Terms and Conditions';
        errorMessage.style.display = 'block';
        isValid = false;
    }

    if (!isValid) return;

    try {
        // Check if email or phone already exists
        let { data: users, error: userError } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},phone.eq.${phone}`)
            .limit(1);

        if (userError) {
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
            return;
        }
        if (users && users.length > 0) {
            errorMessage.textContent = 'Account already exists. Please login.';
            errorMessage.style.display = 'block';
            return;
        }

        // Register user with Supabase, include username and phone in user_metadata
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    phone: phone
                }
            }
        });

        if (error) {
            if (error.message && error.message.toLowerCase().includes('already registered')) {
                errorMessage.textContent = 'Account already exists. Please login.';
            } else {
                errorMessage.textContent = error.message || 'Registration failed. Please try again.';
            }
            errorMessage.style.display = 'block';
            return;
        }

        // Show success message
        successMessage.style.display = 'block';
        successMessage.textContent = 'Registration successful! Please check your email to verify your account. Redirecting to login...';
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 4000);
    } catch (err) {
        console.error('Registration error:', err);
        errorMessage.textContent = 'An unexpected error occurred. Please try again.';
        errorMessage.style.display = 'block';
    }
});

// Social login handlers
function handleOAuthSignIn(provider) {
    supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin + '/login.html'
        }
    }).then(({ error }) => {
        if (error) {
            errorMessage.textContent = provider.charAt(0).toUpperCase() + 
                provider.slice(1) + ' sign-in failed: ' + error.message;
            errorMessage.style.display = 'block';
        }
    });
}

document.getElementById('googleSignInBtn').addEventListener('click', () => handleOAuthSignIn('google'));
document.getElementById('twitterSignInBtn').addEventListener('click', () => handleOAuthSignIn('twitter'));
// Instagram button removed

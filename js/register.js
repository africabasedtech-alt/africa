// register.js — Uses Replit database API for registration.
// To switch back to Supabase, restore the supabaseClient.js import and signUp call.
import { signUp } from './api-auth.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const registerForm = document.getElementById('registerForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isValid = true;

        document.querySelectorAll('.error-message').forEach(elem => { elem.style.display = 'none'; });
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';

        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!username) {
            const err = document.getElementById('usernameError');
            if (err) { err.textContent = 'Please enter a username'; err.style.display = 'block'; }
            isValid = false;
        }

        const phoneRegex = /^(\+2547\d{8}|07\d{8}|01\d{8})$/;
        if (!phone) {
            const err = document.getElementById('phoneError');
            if (err) { err.textContent = 'Please enter your phone number'; err.style.display = 'block'; }
            isValid = false;
        } else if (!phoneRegex.test(phone)) {
            const err = document.getElementById('phoneError');
            if (err) { err.textContent = 'Please enter a valid Kenyan phone number (e.g. +254700000000, 0700000000)'; err.style.display = 'block'; }
            isValid = false;
        }

        if (!emailRegex.test(email)) {
            const err = document.getElementById('emailError');
            if (err) { err.textContent = 'Please enter a valid email address'; err.style.display = 'block'; }
            isValid = false;
        }

        if (password.length < 8) {
            const err = document.getElementById('passwordError');
            if (err) { err.textContent = 'Password must be at least 8 characters long'; err.style.display = 'block'; }
            isValid = false;
        }

        if (password !== confirmPassword) {
            const err = document.getElementById('confirmPasswordError');
            if (err) { err.textContent = 'Passwords do not match'; err.style.display = 'block'; }
            isValid = false;
        }

        if (!document.getElementById('terms').checked) {
            if (errorMessage) { errorMessage.textContent = 'Please accept the Terms and Conditions'; errorMessage.style.display = 'block'; }
            isValid = false;
        }

        if (!isValid) return;

        const btn = registerForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }

        try {
            const refCode = new URLSearchParams(window.location.search).get('ref') || '';
            const { data, error } = await signUp(username, phone, email, password, refCode || undefined);

            if (error) {
                if (errorMessage) {
                    errorMessage.textContent = error.message || 'Registration failed. Please try again.';
                    errorMessage.style.display = 'block';
                }
                if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
                return;
            }

            // Account created — token is already stored, redirect to home
            if (successMessage) {
                successMessage.style.display = 'block';
                successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Account created successfully! Redirecting...';
            }
            setTimeout(function() {
                window.location.href = 'home.html';
            }, 1500);

        } catch (err) {
            console.error('Registration error:', err);
            if (errorMessage) {
                errorMessage.textContent = 'An unexpected error occurred. Please try again.';
                errorMessage.style.display = 'block';
            }
            if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
        }
    });
}

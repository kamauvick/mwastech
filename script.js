// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'linear-gradient(90deg, rgba(255, 182, 193, 0.98) 0%, rgba(135, 206, 235, 0.98) 25%, rgba(224, 246, 255, 0.98) 50%, rgba(152, 251, 152, 0.98) 75%, rgba(255, 228, 181, 0.98) 100%)';
        navbar.style.boxShadow = '0 4px 25px rgba(0, 0, 0, 0.15)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.background = 'linear-gradient(90deg, rgba(255, 182, 193, 0.95) 0%, rgba(135, 206, 235, 0.95) 25%, rgba(224, 246, 255, 0.95) 50%, rgba(152, 251, 152, 0.95) 75%, rgba(255, 228, 181, 0.95) 100%)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        navbar.style.backdropFilter = 'blur(15px)';
    }
});

// Modal functionality
const modal = document.getElementById('inquiryModal');
const inquiryBtns = document.querySelectorAll('.inquiry-btn');
const closeBtn = document.querySelector('.close');
const inquiryForm = document.getElementById('inquiryForm');
const inquiryProduct = document.getElementById('inquiryProduct');

// Open modal when clicking inquiry buttons
inquiryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productName = btn.getAttribute('data-product');
        inquiryProduct.value = productName;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
});

// Close modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Form submissions
const contactForm = document.getElementById('contactForm');

function showMessage(form, message, isSuccess = true) {
    // Remove existing messages
    const existingMessage = form.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = isSuccess ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    form.appendChild(messageDiv);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateForm(formData) {
    const errors = [];
    
    if (!formData.get('name') || formData.get('name').trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!formData.get('email') || !validateEmail(formData.get('email'))) {
        errors.push('Please enter a valid email address');
    }
    
    return errors;
}

// Contact form submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        showMessage(contactForm, errors[0], false);
        return;
    }
    
    // Add loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    contactForm.classList.add('loading');
    
    try {
        // Simulate form submission (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showMessage(contactForm, 'Thank you for your inquiry! We will contact you soon.');
        contactForm.reset();
    } catch (error) {
        showMessage(contactForm, 'There was an error sending your message. Please try again.', false);
    } finally {
        // Remove loading state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        contactForm.classList.remove('loading');
    }
});

// Inquiry form submission
inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(inquiryForm);
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        showMessage(inquiryForm, errors[0], false);
        return;
    }
    
    // Add loading state
    const submitBtn = inquiryForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    inquiryForm.classList.add('loading');
    
    try {
        // Simulate form submission (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showMessage(inquiryForm, 'Thank you for your inquiry! We will contact you soon.');
        inquiryForm.reset();
        
        // Close modal after successful submission
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 2000);
        
    } catch (error) {
        showMessage(inquiryForm, 'There was an error sending your message. Please try again.', false);
    } finally {
        // Remove loading state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        inquiryForm.classList.remove('loading');
    }
});

// Scroll animations
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.feature-card, .product-card');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

// Initial styles for scroll animation
document.querySelectorAll('.feature-card, .product-card').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

// Run animation on page load
document.addEventListener('DOMContentLoaded', () => {
    animateOnScroll();
});

// Auto-populate contact form from URL parameters
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const product = urlParams.get('product');
    
    if (product) {
        const productSelect = document.getElementById('product');
        if (productSelect) {
            productSelect.value = product;
        }
    }
});

// Keyboard accessibility for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Focus management for modal
const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Keep Tab focus inside the modal while it is open (registered once)
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || modal.style.display !== 'block') return;

    const focusableContent = modal.querySelectorAll(focusableElements);
    const firstFocusableElement = focusableContent[0];
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
        }
    }
});

// Move focus into the modal when it opens
inquiryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(() => {
            document.getElementById('inquiryName').focus();
        }, 100);
    });
});

// Performance optimization: run scroll animations at most once per frame
let animateScheduled = false;
window.addEventListener('scroll', () => {
    if (animateScheduled) return;
    animateScheduled = true;
    requestAnimationFrame(() => {
        animateScheduled = false;
        animateOnScroll();
    });
});

// Add loading states to navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.getAttribute('href').startsWith('#')) {
            // Add active state briefly
            this.style.color = '#2563eb';
            setTimeout(() => {
                this.style.color = '';
            }, 500);
        }
    });
});

console.log('MWASTECH TECHNOLOGIES website loaded successfully!');

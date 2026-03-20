// Storage keys for consistency
const STORAGE_KEYS = {
    SECTORS: 'africabased_sectors',
    OPPORTUNITIES: 'africabased_opportunities',
    TESTIMONIALS: 'africabased_testimonials'
};

// Helper function to handle rendering errors
function handleRenderError(error, container, componentName) {
    console.error(`Error rendering ${componentName}:`, error);
    
    if (container) {
        const errorMessage = document.createElement('div');
        errorMessage.style.color = '#ff6b6b';
        errorMessage.style.padding = '1rem';
        errorMessage.style.textAlign = 'center';
        errorMessage.innerHTML = `
            <p>Sorry, there was an error loading the ${componentName}.</p>
            <button onclick="location.reload()" 
                    style="background:#4ecdc4; color:#fff; border:none; 
                           padding:0.5rem 1rem; border-radius:4px; cursor:pointer;">
                Retry
            </button>
        `;
        container.innerHTML = '';
        container.appendChild(errorMessage);
    }
}

// Function to safely get data from localStorage with validation
function getStorageData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            console.log(`No data found for ${key}, using default value`);
            localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (parseError) {
            console.error(`Invalid JSON data for ${key}:`, parseError);
            console.log('Resetting to default value');
            localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }

        // Validate data structure
        if (!Array.isArray(parsedData)) {
            console.error(`Invalid data format for ${key}: expected array, got ${typeof parsedData}`);
            console.log('Resetting to default value');
            localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }

        console.log(`Loaded data for ${key}:`, parsedData);
        return parsedData;
    } catch (error) {
        console.error(`Error accessing localStorage for ${key}:`, error);
        return defaultValue;
    }
}

// Function to render sector buttons
function renderSectorButtons() {
    try {
        const sectorButtonsDiv = document.getElementById('sectorButtons');
        if (!sectorButtonsDiv) {
            console.warn('Sector buttons container not found');
            return;
        }

        // Get sectors from admin settings
        const sectors = getStorageData(STORAGE_KEYS.SECTORS);
        
        // Create buttons HTML
        let html = '<button class="category-btn active" data-category="all">All Opportunities</button>';
        sectors.forEach(sector => {
            if (!sector?.name) {
                console.warn('Invalid sector data:', sector);
                return;
            }
            html += `<button class="category-btn" data-category="${sector.name}">${sector.name}</button>`;
        });
        
        sectorButtonsDiv.innerHTML = html;

        // Add click handlers
        const buttons = sectorButtonsDiv.getElementsByClassName('category-btn');
        Array.from(buttons).forEach(button => {
            button.addEventListener('click', function() {
                try {
                    // Remove active class from all buttons
                    Array.from(buttons).forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    this.classList.add('active');
                    // Render products for selected category
                    renderProductGrid(this.getAttribute('data-category'));
                } catch (error) {
                    console.error('Error in sector button click handler:', error);
                }
            });
        });
    } catch (error) {
        handleRenderError(error, document.getElementById('sectorButtons'), 'sector buttons');
    }
}

// Function to render product grid
function renderProductGrid(category = 'all') {
    try {
        const productGrid = document.getElementById('productGrid');
        if (!productGrid) {
            console.warn('Product grid container not found');
            return;
        }

        // Get opportunities from admin settings
        const opportunities = getStorageData(STORAGE_KEYS.OPPORTUNITIES);
        
        // Filter opportunities by category if not 'all'
        const filtered = category === 'all' 
            ? opportunities 
            : opportunities.filter(opp => opp.category === category);

        if (!filtered.length) {
            productGrid.innerHTML = `
                <div style="color:#fff;text-align:center;font-size:1.2rem;grid-column:1/-1;padding:2rem;">
                    No opportunities available in this category.
                    ${category !== 'all' ? '<br><small>Try selecting a different category.</small>' : ''}
                </div>`;
            return;
        }

        // Create product cards
        const html = filtered.map(opp => {
            if (!opp?.name) {
                console.warn('Invalid opportunity data:', opp);
                return '';
            }
            
            try {
                return `
                    <div class="product-card${opp.featured ? ' featured' : ''}" 
                         style="background:rgba(255,255,255,0.05); border-radius:16px; padding:0; overflow:hidden;
                                box-shadow:0 8px 32px rgba(0,0,0,0.2); transition:all 0.3s ease;">
                        <img src="${opp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(opp.name)}&background=4ecdc4&color=fff&size=300`}" 
                             alt="${opp.name}"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(opp.name)}&background=4ecdc4&color=fff&size=300'"
                             style="width:100%; height:200px; object-fit:cover;">
                        <div style="padding:1.5rem;">
                            <h3 style="margin:0 0 1rem; color:#4ecdc4;">${opp.name}</h3>
                            <p style="margin:0 0 1rem; color:rgba(255,255,255,0.8); font-size:0.9rem;">
                                ${opp.description || 'No description available'}
                            </p>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:#ff6b6b; font-weight:600;">
                                    KSH ${opp.price?.toLocaleString() || 'Contact for Price'}
                                </span>
                                <a href="products.html" class="invest-btn" style="background:var(--accent-gradient); 
                                   color:#fff; text-decoration:none; padding:0.5rem 1rem; border-radius:6px;
                                   font-weight:600; transition:all 0.3s ease;">
                                    Invest Now
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            } catch (cardError) {
                console.error('Error creating product card:', cardError);
                return '';
            }
        }).join('');

        productGrid.innerHTML = html;
    } catch (error) {
        handleRenderError(error, productGrid, 'product grid');
    }
}


// Function to render testimonials
function renderTestimonials() {
    try {
        const testimonialsContainer = document.querySelector('.swiper-wrapper');
        if (!testimonialsContainer) {
            console.warn('Testimonials container not found');
            return;
        }

        // Get testimonials from admin settings
        const testimonials = getStorageData(STORAGE_KEYS.TESTIMONIALS);

        if (!testimonials.length) {
            testimonialsContainer.innerHTML = `
                <div class="swiper-slide">
                    <div style="color:#fff;text-align:center;font-size:1.2rem;padding:2rem;
                                background:rgba(255,255,255,0.05); border-radius:16px;
                                margin:1rem; box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                        No testimonials available yet.
                        <br><small style="font-size:0.9rem;">Check back later!</small>
                    </div>
                </div>`;
            return;
        }

        // Create testimonial slides
        const html = testimonials.map(testimonial => {
            if (!testimonial?.name) {
                console.warn('Invalid testimonial data:', testimonial);
                return '';
            }

            try {
                return `
                    <div class="swiper-slide">
                        <div style="background:rgba(255,255,255,0.05); border-radius:16px; padding:2rem;
                                    margin:1rem; box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                            <div style="display:flex; align-items:center; margin-bottom:1rem;">
                                <img src="${testimonial.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=4ecdc4&color=fff&size=100`}" 
                                     alt="${testimonial.name}"
                                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=4ecdc4&color=fff&size=100'"
                                     style="width:60px; height:60px; border-radius:50%; margin-right:1rem;">
                                <div>
                                    <h4 style="margin:0; color:#4ecdc4;">${testimonial.name}</h4>
                                    <p style="margin:0; color:rgba(255,255,255,0.6); font-size:0.9rem;">
                                        ${testimonial.role || 'Customer'} ${testimonial.location ? `- ${testimonial.location}` : ''}
                                    </p>
                                </div>
                            </div>
                            <p style="margin:0; color:rgba(255,255,255,0.8);">
                                "${testimonial.text || 'Great experience!'}"
                            </p>
                        </div>
                    </div>
                `;
            } catch (slideError) {
                console.error('Error creating testimonial slide:', slideError);
                return '';
            }
        }).join('');

        testimonialsContainer.innerHTML = html;
        
        // Reinitialize Swiper if it exists
        if (window.Swiper) {
            try {
                new window.Swiper('.testimonials-slider', {
                    slidesPerView: 1,
                    spaceBetween: 20,
                    loop: true,
                    autoplay: {
                        delay: 5000,
                        disableOnInteraction: false,
                    },
                    breakpoints: {
                        640: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 }
                    }
                });
            } catch (swiperError) {
                console.error('Error initializing Swiper:', swiperError);
            }
        }
    } catch (error) {
        handleRenderError(error, document.querySelector('.testimonials-slider'), 'testimonials');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing home content...');
        const initialState = {
            sectors: getStorageData(STORAGE_KEYS.SECTORS),
            opportunities: getStorageData(STORAGE_KEYS.OPPORTUNITIES),
            testimonials: getStorageData(STORAGE_KEYS.TESTIMONIALS)
        };
        console.log('Initial state:', initialState);
        
        if (!initialState.sectors?.length) {
            console.warn('No sectors found in storage');
        }
        if (!initialState.opportunities?.length) {
            console.warn('No opportunities found in storage');
        }
        if (!initialState.testimonials?.length) {
            console.warn('No testimonials found in storage');
        }

        renderSectorButtons();
        renderProductGrid('all');
        renderTestimonials();
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
        // Show a user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger';
        errorContainer.textContent = 'There was an error loading the content. Please try refreshing the page.';
        document.body.insertBefore(errorContainer, document.body.firstChild);
    }
});

// Listen for changes in localStorage (when admin makes updates)
window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEYS.SECTORS) {
        renderSectorButtons();
        renderProductGrid('all');
    } else if (event.key === STORAGE_KEYS.OPPORTUNITIES) {
        renderProductGrid('all');
    } else if (event.key === STORAGE_KEYS.TESTIMONIALS) {
        renderTestimonials();
    }
});

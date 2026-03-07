// Store data in localStorage with proper event dispatch
const STORAGE_KEYS = {
    SECTORS: 'africabased_sectors',
    OPPORTUNITIES: 'africabased_opportunities',
    TESTIMONIALS: 'africabased_testimonials'
};

// Function to save data and trigger update event
function saveToStorageWithEvent(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch storage event for real-time updates
    window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(data),
        oldValue: null,
        storageArea: localStorage
    }));
}

// Utility functions
function saveToStorage(key, data) {
    saveToStorageWithEvent(key, data);
}

function getFromStorage(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
}


// Unified Category Management
function setupCategoryManagement() {
    const categoryList = document.getElementById('categoryList');
    const addForm = document.getElementById('addCategoryForm');
    const addBtn = document.getElementById('addCategoryBtn');
    const saveBtn = document.getElementById('saveCategoryBtn');
    const cancelBtn = document.getElementById('cancelCategoryBtn');

    function renderCategories() {
        const categories = getFromStorage(STORAGE_KEYS.SECTORS);
        categoryList.innerHTML = categories.map((cat, index) => `
            <div>
                <h4>${cat.name}</h4>
                <img src="${cat.image || ''}" alt="${cat.name}" style="max-width:120px;max-height:60px;display:block;margin-bottom:0.5rem;">
                <p>${cat.description}</p>
                <div style="display:flex;gap:10px;">
                    <button class="settings-action-btn" onclick="editCategory(${index})">Edit</button>
                    <button class="settings-action-btn delete" onclick="deleteCategory(${index})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    addBtn.addEventListener('click', () => {
        addForm.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        addForm.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('categoryName').value;
        const img = document.getElementById('categoryImg').value;
        const desc = document.getElementById('categoryDesc').value;
        if (!name || !img || !desc) {
            alert('Please fill in all required fields');
            return;
        }
        const categories = getFromStorage(STORAGE_KEYS.SECTORS);
        categories.push({ name, image: img, description: desc });
        saveToStorage(STORAGE_KEYS.SECTORS, categories);
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryImg').value = '';
        document.getElementById('categoryDesc').value = '';
        addForm.style.display = 'none';
        renderCategories();
        updateCategorySelect();
    });

    // Initial render
    renderCategories();
}


// Opportunities Management (uses categories)
function setupOpportunitiesManagement() {
    const opportunitiesList = document.getElementById('opportunityList');
    const addForm = document.getElementById('addOpportunityForm');
    const addBtn = document.getElementById('addOpportunityBtn');
    const saveBtn = document.getElementById('saveOpportunityBtn');
    const cancelBtn = document.getElementById('cancelOpportunityBtn');
    const categorySelect = document.getElementById('opportunityCategory');

    let currentCategoryFilter = 'all';
    // Render category filter buttons above opportunities
    function renderCategoryFilterButtons() {
        const categories = getFromStorage(STORAGE_KEYS.SECTORS);
        let html = `<button class="settings-action-btn${currentCategoryFilter==='all' ? ' active' : ''}" data-category="all">All Categories</button>`;
        categories.forEach(cat => {
            html += `<button class="settings-action-btn${currentCategoryFilter===cat.name ? ' active' : ''}" data-category="${cat.name}">${cat.name}</button>`;
        });
        const filterDiv = document.getElementById('categoryFilterButtons');
        if (filterDiv) {
            filterDiv.innerHTML = html;
            Array.from(filterDiv.querySelectorAll('button')).forEach(btn => {
                btn.onclick = function() {
                    currentCategoryFilter = this.getAttribute('data-category');
                    renderCategoryFilterButtons();
                    renderOpportunities();
                };
            });
        }
    }

    function renderOpportunities() {
        const opportunities = getFromStorage(STORAGE_KEYS.OPPORTUNITIES);
        let filtered = opportunities;
        if (currentCategoryFilter !== 'all') {
            filtered = opportunities.filter(opp => opp.category === currentCategoryFilter);
        }
        opportunitiesList.innerHTML = filtered.length ? filtered.map((opp, index) => `
            <div>
                <h4>${opp.name}</h4>
                <img src="${opp.image || ''}" alt="${opp.name}" style="max-width:120px;max-height:60px;display:block;margin-bottom:0.5rem;">
                <p>${opp.description}</p>
                <p>Category: ${opp.category}</p>
                <p>Price: KSH ${opp.price ? Number(opp.price).toLocaleString() : '0'}</p>
                <div style="display:flex;gap:10px;">
                    <button class="settings-action-btn" onclick="editOpportunity(${index})">Edit</button>
                    <button class="settings-action-btn delete" onclick="deleteOpportunity(${index})">Delete</button>
                </div>
            </div>
        `).join('') : `<div style="color:#fff;text-align:center;">No opportunities in this category.</div>`;
    }

    // Populate category select with categories
    function updateCategorySelect() {
        const categories = getFromStorage(STORAGE_KEYS.SECTORS);
        categorySelect.innerHTML = categories.map(cat => 
            `<option value="${cat.name}">${cat.name}</option>`
        ).join('');
    }

    addBtn.addEventListener('click', () => {
        updateCategorySelect();
        addForm.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        addForm.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('opportunityName').value;
        const img = document.getElementById('opportunityImg').value;
        const desc = document.getElementById('opportunityDesc').value;
        const category = categorySelect.value;
        const price = parseFloat(document.getElementById('opportunityPrice').value);
        const featured = document.getElementById('opportunityFeatured').checked;

        if (!name || !desc || isNaN(price)) {
            alert('Please fill in all required fields');
            return;
        }

        const opportunities = getFromStorage(STORAGE_KEYS.OPPORTUNITIES);
        opportunities.push({ 
            name, 
            image: img, 
            description: desc, 
            category,
            price,
            featured
        });
        saveToStorage(STORAGE_KEYS.OPPORTUNITIES, opportunities);

        // Clear form
        document.getElementById('opportunityName').value = '';
        document.getElementById('opportunityImg').value = '';
        document.getElementById('opportunityDesc').value = '';
        document.getElementById('opportunityPrice').value = '';
        document.getElementById('opportunityFeatured').checked = false;
        addForm.style.display = 'none';

        renderCategoryFilterButtons();
        renderOpportunities();
    });

    // Initial render
    renderCategoryFilterButtons();
    renderOpportunities();
}

// Testimonials Management
function setupTestimonialsManagement() {
    const testimonialsList = document.getElementById('testimonialList');
    const addForm = document.getElementById('addTestimonialForm');
    const addBtn = document.getElementById('addTestimonialBtn');
    const saveBtn = document.getElementById('saveTestimonialBtn');
    const cancelBtn = document.getElementById('cancelTestimonialBtn');

    function renderTestimonials() {
        const testimonials = getFromStorage(STORAGE_KEYS.TESTIMONIALS);
        testimonialsList.innerHTML = testimonials.map((testimonial, index) => `
            <div>
                <h4>${testimonial.name}</h4>
                <p>${testimonial.role} - ${testimonial.location}</p>
                <p>${testimonial.text}</p>
                <div style="display:flex;gap:10px;">
                    <button class="settings-action-btn" onclick="editTestimonial(${index})">Edit</button>
                    <button class="settings-action-btn delete" onclick="deleteTestimonial(${index})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    addBtn.addEventListener('click', () => {
        addForm.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        addForm.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const name = document.getElementById('testimonialName').value;
        const role = document.getElementById('testimonialRole').value;
        const location = document.getElementById('testimonialLocation').value;
        const img = document.getElementById('testimonialImg').value;
        const text = document.getElementById('testimonialText').value;

        if (!name || !role || !location || !text) {
            alert('Please fill in all required fields');
            return;
        }

        const testimonials = getFromStorage(STORAGE_KEYS.TESTIMONIALS);
        testimonials.push({ name, role, location, image: img, text });
        saveToStorage(STORAGE_KEYS.TESTIMONIALS, testimonials);

        // Clear form
        document.getElementById('testimonialName').value = '';
        document.getElementById('testimonialRole').value = '';
        document.getElementById('testimonialLocation').value = '';
        document.getElementById('testimonialImg').value = '';
        document.getElementById('testimonialText').value = '';
        addForm.style.display = 'none';

        renderTestimonials();
    });

    // Initial render
    renderTestimonials();
}

// Delete functions (defined globally for onclick access)
window.deleteSector = function(index) {
    if (confirm('Are you sure you want to delete this sector?')) {
        const sectors = getFromStorage(STORAGE_KEYS.SECTORS);
        sectors.splice(index, 1);
        saveToStorage(STORAGE_KEYS.SECTORS, sectors);
        setupSectorsManagement();
    }
};

window.deleteOpportunity = function(index) {
    if (confirm('Are you sure you want to delete this opportunity?')) {
        const opportunities = getFromStorage(STORAGE_KEYS.OPPORTUNITIES);
        opportunities.splice(index, 1);
        saveToStorage(STORAGE_KEYS.OPPORTUNITIES, opportunities);
        setupOpportunitiesManagement();
    }
};

window.deleteTestimonial = function(index) {
    if (confirm('Are you sure you want to delete this testimonial?')) {
        const testimonials = getFromStorage(STORAGE_KEYS.TESTIMONIALS);
        testimonials.splice(index, 1);
        saveToStorage(STORAGE_KEYS.TESTIMONIALS, testimonials);
        setupTestimonialsManagement();
    }
};

// Edit functions (defined globally for onclick access)
window.editSector = function(index) {
    const sectors = getFromStorage(STORAGE_KEYS.SECTORS);
    const sector = sectors[index];
    
    document.getElementById('sectorName').value = sector.name;
    document.getElementById('sectorImg').value = sector.image;
    document.getElementById('sectorVideo').value = sector.video || '';
    document.getElementById('sectorDesc').value = sector.description;
    
    document.getElementById('addSectorForm').style.display = 'block';
    document.getElementById('saveSectorBtn').onclick = () => {
        sectors[index] = {
            name: document.getElementById('sectorName').value,
            image: document.getElementById('sectorImg').value,
            video: document.getElementById('sectorVideo').value,
            description: document.getElementById('sectorDesc').value
        };
        saveToStorage(STORAGE_KEYS.SECTORS, sectors);
        setupSectorsManagement();
    };
};

window.editOpportunity = function(index) {
    const opportunities = getFromStorage(STORAGE_KEYS.OPPORTUNITIES);
    const opportunity = opportunities[index];
    
    document.getElementById('opportunityName').value = opportunity.name;
    document.getElementById('opportunityImg').value = opportunity.image || '';
    document.getElementById('opportunityDesc').value = opportunity.description;
    document.getElementById('opportunityPrice').value = opportunity.price;
    document.getElementById('opportunityFeatured').checked = opportunity.featured;
    
    document.getElementById('addOpportunityForm').style.display = 'block';
    document.getElementById('saveOpportunityBtn').onclick = () => {
        opportunities[index] = {
            name: document.getElementById('opportunityName').value,
            image: document.getElementById('opportunityImg').value,
            description: document.getElementById('opportunityDesc').value,
            category: document.getElementById('opportunityCategory').value,
            price: parseFloat(document.getElementById('opportunityPrice').value),
            featured: document.getElementById('opportunityFeatured').checked
        };
        saveToStorage(STORAGE_KEYS.OPPORTUNITIES, opportunities);
        setupOpportunitiesManagement();
    };
};

window.editTestimonial = function(index) {
    const testimonials = getFromStorage(STORAGE_KEYS.TESTIMONIALS);
    const testimonial = testimonials[index];
    
    document.getElementById('testimonialName').value = testimonial.name;
    document.getElementById('testimonialRole').value = testimonial.role;
    document.getElementById('testimonialLocation').value = testimonial.location;
    document.getElementById('testimonialImg').value = testimonial.image || '';
    document.getElementById('testimonialText').value = testimonial.text;
    
    document.getElementById('addTestimonialForm').style.display = 'block';
    document.getElementById('saveTestimonialBtn').onclick = () => {
        testimonials[index] = {
            name: document.getElementById('testimonialName').value,
            role: document.getElementById('testimonialRole').value,
            location: document.getElementById('testimonialLocation').value,
            image: document.getElementById('testimonialImg').value,
            text: document.getElementById('testimonialText').value
        };
        saveToStorage(STORAGE_KEYS.TESTIMONIALS, testimonials);
        setupTestimonialsManagement();
    };
};

// Edit and delete functions for categories
window.deleteCategory = function(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        const categories = getFromStorage(STORAGE_KEYS.SECTORS);
        categories.splice(index, 1);
        saveToStorage(STORAGE_KEYS.SECTORS, categories);
        setupCategoryManagement();
        updateCategorySelect && updateCategorySelect();
    }
};
window.editCategory = function(index) {
    const categories = getFromStorage(STORAGE_KEYS.SECTORS);
    const cat = categories[index];
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryImg').value = cat.image || '';
    document.getElementById('categoryDesc').value = cat.description;
    document.getElementById('addCategoryForm').style.display = 'block';
    document.getElementById('saveCategoryBtn').onclick = () => {
        categories[index] = {
            name: document.getElementById('categoryName').value,
            image: document.getElementById('categoryImg').value,
            description: document.getElementById('categoryDesc').value
        };
        saveToStorage(STORAGE_KEYS.SECTORS, categories);
        setupCategoryManagement();
        updateCategorySelect && updateCategorySelect();
    };
};

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupCategoryManagement();
    setupOpportunitiesManagement();
    setupTestimonialsManagement();
});

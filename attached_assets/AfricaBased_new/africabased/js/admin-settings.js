const ADMIN_KEY = '1540568e';

const api = {
  headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
  async get(url) {
    const r = await fetch(url, { headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(url, body) {
    const r = await fetch(url, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async put(url, body) {
    const r = await fetch(url, { method: 'PUT', headers: this.headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(url) {
    const r = await fetch(url, { method: 'DELETE', headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
};

function toast(msg, ok = true) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = ok ? '#4ecdc4' : '#ff6b6b';
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
let categories = [];
let editingCategoryId = null;

async function loadCategories() {
  categories = await api.get('/api/homepage/categories');
  renderCategories();
  refreshCategorySelect();
}

function renderCategories() {
  const el = document.getElementById('categoryList');
  if (!categories.length) { el.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No categories yet.</p>'; return; }
  el.innerHTML = categories.map(c => `
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width:72px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : ''}
      <div style="flex:1;min-width:160px;">
        <strong style="color:#fff;">${c.name}</strong>
        <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin:2px 0 0;">${c.description}</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="settings-action-btn" onclick="startEditCategory(${c.id})"><i class="fas fa-pen"></i> Edit</button>
        <button class="settings-action-btn" style="background:linear-gradient(45deg,#ff6b6b,#ee5253);" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  `).join('');
}

window.startEditCategory = function(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  editingCategoryId = id;
  document.getElementById('categoryName').value = c.name;
  document.getElementById('categoryImg').value = c.image || '';
  document.getElementById('categoryDesc').value = c.description;
  document.getElementById('saveCategoryBtn').textContent = 'Update Category';
  document.getElementById('addCategoryForm').style.display = 'block';
  document.getElementById('addCategoryForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.deleteCategory = async function(id) {
  if (!confirm('Delete this category?')) return;
  try {
    await api.del('/api/admin/homepage/categories/' + id);
    toast('Category deleted.');
    await loadCategories();
    await loadOpportunities();
  } catch (e) { toast('Failed to delete.', false); }
};

function setupCategories() {
  document.getElementById('addCategoryBtn').onclick = () => {
    editingCategoryId = null;
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryImg').value = '';
    document.getElementById('categoryDesc').value = '';
    document.getElementById('saveCategoryBtn').textContent = 'Save Category';
    document.getElementById('addCategoryForm').style.display = 'block';
  };

  document.getElementById('cancelCategoryBtn').onclick = () => {
    document.getElementById('addCategoryForm').style.display = 'none';
    editingCategoryId = null;
  };

  document.getElementById('saveCategoryBtn').onclick = async () => {
    const name = document.getElementById('categoryName').value.trim();
    const image = document.getElementById('categoryImg').value.trim();
    const description = document.getElementById('categoryDesc').value.trim();
    if (!name || !description) { toast('Name and description are required.', false); return; }
    try {
      if (editingCategoryId != null) {
        await api.put('/api/admin/homepage/categories/' + editingCategoryId, { name, image, description });
        toast('Category updated.');
      } else {
        await api.post('/api/admin/homepage/categories', { name, image, description });
        toast('Category added.');
      }
      document.getElementById('addCategoryForm').style.display = 'none';
      editingCategoryId = null;
      await loadCategories();
    } catch (e) { toast('Failed to save.', false); }
  };
}

// ════════════════════════════════════════════════════════════
//  OPPORTUNITIES
// ════════════════════════════════════════════════════════════
let opportunities = [];
let editingOpportunityId = null;

function refreshCategorySelect() {
  const dl = document.getElementById('opportunityCategoryList');
  if (!dl) return;
  dl.innerHTML = categories.map(c => `<option value="${c.name}">`).join('');
}

async function loadOpportunities() {
  opportunities = await api.get('/api/homepage/opportunities');
  renderOpportunities();
}

function renderOpportunities() {
  const el = document.getElementById('opportunityList');
  if (!opportunities.length) { el.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No opportunities yet.</p>'; return; }
  el.innerHTML = opportunities.map(o => `
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      ${o.image ? `<img src="${o.image}" alt="${o.name}" style="width:72px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : ''}
      <div style="flex:1;min-width:160px;">
        <strong style="color:#fff;">${o.name}</strong>
        ${o.featured ? '<span style="background:#ffc107;color:#000;font-size:0.7rem;border-radius:3px;padding:1px 6px;margin-left:6px;font-weight:700;">FEATURED</span>' : ''}
        <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin:2px 0 0;">${o.category || ''}</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="settings-action-btn" onclick="startEditOpportunity(${o.id})"><i class="fas fa-pen"></i> Edit</button>
        <button class="settings-action-btn" style="background:linear-gradient(45deg,#ff6b6b,#ee5253);" onclick="deleteOpportunity(${o.id})"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  `).join('');
}

window.startEditOpportunity = function(id) {
  const o = opportunities.find(x => x.id === id);
  if (!o) return;
  editingOpportunityId = id;
  refreshCategorySelect();
  document.getElementById('opportunityName').value = o.name;
  document.getElementById('opportunityImg').value = o.image || '';
  document.getElementById('opportunityDesc').value = o.description;
  document.getElementById('opportunityFeatured').checked = o.featured || false;
  const sel = document.getElementById('opportunityCategory');
  if (sel) sel.value = o.category;
  document.getElementById('saveOpportunityBtn').textContent = 'Update Opportunity';
  document.getElementById('addOpportunityForm').style.display = 'block';
  document.getElementById('addOpportunityForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.deleteOpportunity = async function(id) {
  if (!confirm('Delete this opportunity?')) return;
  try {
    await api.del('/api/admin/homepage/opportunities/' + id);
    toast('Opportunity deleted.');
    await loadOpportunities();
  } catch (e) { toast('Failed to delete.', false); }
};

function setupOpportunities() {
  document.getElementById('addOpportunityBtn').onclick = () => {
    editingOpportunityId = null;
    refreshCategorySelect();
    document.getElementById('opportunityName').value = '';
    document.getElementById('opportunityImg').value = '';
    document.getElementById('opportunityDesc').value = '';
    document.getElementById('opportunityCategory').value = '';
    document.getElementById('opportunityFeatured').checked = false;
    document.getElementById('saveOpportunityBtn').textContent = 'Save Opportunity';
    document.getElementById('addOpportunityForm').style.display = 'block';
  };

  document.getElementById('cancelOpportunityBtn').onclick = () => {
    document.getElementById('addOpportunityForm').style.display = 'none';
    editingOpportunityId = null;
  };

  document.getElementById('saveOpportunityBtn').onclick = async () => {
    const name = document.getElementById('opportunityName').value.trim();
    const image = document.getElementById('opportunityImg').value.trim();
    const description = document.getElementById('opportunityDesc').value.trim();
    const category = document.getElementById('opportunityCategory').value;
    const featured = document.getElementById('opportunityFeatured').checked;
    if (!name || !description) { toast('Name and description are required.', false); return; }
    const body = { name, image, description, category, price: 0, featured };
    try {
      if (editingOpportunityId != null) {
        await api.put('/api/admin/homepage/opportunities/' + editingOpportunityId, body);
        toast('Opportunity updated.');
      } else {
        await api.post('/api/admin/homepage/opportunities', body);
        toast('Opportunity added.');
      }
      document.getElementById('addOpportunityForm').style.display = 'none';
      editingOpportunityId = null;
      await loadOpportunities();
    } catch (e) { toast('Failed to save.', false); }
  };
}

// ════════════════════════════════════════════════════════════
//  TESTIMONIALS
// ════════════════════════════════════════════════════════════
let testimonials = [];
let editingTestimonialId = null;

async function loadTestimonials() {
  testimonials = await api.get('/api/homepage/testimonials');
  renderTestimonials();
}

function renderTestimonials() {
  const el = document.getElementById('testimonialList');
  if (!testimonials.length) { el.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No testimonials yet.</p>'; return; }
  el.innerHTML = testimonials.map(t => `
    <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;">
      ${t.image ? `<img src="${t.image}" alt="${t.name}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0;">` : '<div style="width:52px;height:52px;border-radius:50%;background:rgba(78,205,196,0.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">👤</div>'}
      <div style="flex:1;min-width:160px;">
        <strong style="color:#fff;">${t.name}</strong>
        <span style="color:rgba(255,255,255,0.5);font-size:0.85rem;"> — ${t.role}, ${t.location}</span>
        <p style="color:rgba(255,255,255,0.7);font-size:0.9rem;margin:4px 0 0;font-style:italic;">"${t.text}"</p>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="settings-action-btn" onclick="startEditTestimonial(${t.id})"><i class="fas fa-pen"></i> Edit</button>
        <button class="settings-action-btn" style="background:linear-gradient(45deg,#ff6b6b,#ee5253);" onclick="deleteTestimonial(${t.id})"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  `).join('');
}

window.startEditTestimonial = function(id) {
  const t = testimonials.find(x => x.id === id);
  if (!t) return;
  editingTestimonialId = id;
  document.getElementById('testimonialName').value = t.name;
  document.getElementById('testimonialRole').value = t.role;
  document.getElementById('testimonialLocation').value = t.location;
  document.getElementById('testimonialImg').value = t.image || '';
  document.getElementById('testimonialText').value = t.text;
  document.getElementById('saveTestimonialBtn').textContent = 'Update Testimonial';
  document.getElementById('addTestimonialForm').style.display = 'block';
  document.getElementById('addTestimonialForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.deleteTestimonial = async function(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await api.del('/api/admin/homepage/testimonials/' + id);
    toast('Testimonial deleted.');
    await loadTestimonials();
  } catch (e) { toast('Failed to delete.', false); }
};

function setupTestimonials() {
  document.getElementById('addTestimonialBtn').onclick = () => {
    editingTestimonialId = null;
    document.getElementById('testimonialName').value = '';
    document.getElementById('testimonialRole').value = '';
    document.getElementById('testimonialLocation').value = '';
    document.getElementById('testimonialImg').value = '';
    document.getElementById('testimonialText').value = '';
    document.getElementById('saveTestimonialBtn').textContent = 'Save Testimonial';
    document.getElementById('addTestimonialForm').style.display = 'block';
  };

  document.getElementById('cancelTestimonialBtn').onclick = () => {
    document.getElementById('addTestimonialForm').style.display = 'none';
    editingTestimonialId = null;
  };

  document.getElementById('saveTestimonialBtn').onclick = async () => {
    const name = document.getElementById('testimonialName').value.trim();
    const role = document.getElementById('testimonialRole').value.trim();
    const location = document.getElementById('testimonialLocation').value.trim();
    const image = document.getElementById('testimonialImg').value.trim();
    const text = document.getElementById('testimonialText').value.trim();
    if (!name || !role || !location || !text) { toast('Name, role, location and text are required.', false); return; }
    const body = { name, role, location, image, text };
    try {
      if (editingTestimonialId != null) {
        await api.put('/api/admin/homepage/testimonials/' + editingTestimonialId, body);
        toast('Testimonial updated.');
      } else {
        await api.post('/api/admin/homepage/testimonials', body);
        toast('Testimonial added.');
      }
      document.getElementById('addTestimonialForm').style.display = 'none';
      editingTestimonialId = null;
      await loadTestimonials();
    } catch (e) { toast('Failed to save.', false); }
  };
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  setupCategories();
  setupOpportunities();
  setupTestimonials();
  await loadCategories();
  await loadOpportunities();
  await loadTestimonials();
});

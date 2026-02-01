// Configuration
const API_BASE_URL = 'http://localhost:3000';
let currentPage = 1;
let totalPages = 1;
let currentEditUid = null;
const ITEMS_PER_PAGE = 10;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('create-form').addEventListener('submit', handleCreate);
    document.getElementById('edit-form').addEventListener('submit', handleUpdate);

    // Bottom pagination
    document.getElementById('prev-btn').addEventListener('click', () => changePage(currentPage - 1));
    document.getElementById('next-btn').addEventListener('click', () => changePage(currentPage + 1));

    // Top pagination
    document.getElementById('prev-btn-top').addEventListener('click', () => changePage(currentPage - 1));
    document.getElementById('next-btn-top').addEventListener('click', () => changePage(currentPage + 1));
}

// Show alert message
function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Load settings from API
async function loadSettings() {
    try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const response = await fetch(`${API_BASE_URL}/settings?limit=${ITEMS_PER_PAGE}&offset=${offset}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displaySettings(data.items);
        updatePagination(data.pagination);
        updateStats(data.pagination);
    } catch (error) {
        console.error('Error loading settings:', error);
        document.getElementById('settings-container').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">!</div>
                        <h3>Error loading settings</h3>
                        <p>${error.message}</p>
                        <p style="margin-top: 10px; font-size: 14px;">Make sure the API server is running on ${API_BASE_URL}</p>
                    </div>
                `;
    }
}

// Display settings in the UI
function displaySettings(settings) {
    const container = document.getElementById('settings-container');

    if (settings.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">-</div>
                        <h3>No settings yet</h3>
                        <p>Create your first setting using the form above</p>
                    </div>
                `;
        return;
    }

    const html = `
                <div class="settings-grid">
                    ${settings.map(setting => `
                        <div class="setting-item">
                            <div class="setting-header">
                                <span class="setting-uid">${setting.uid}</span>
                                <div class="setting-actions">
                                    <button class="btn-small btn-edit" onclick="openEditModal('${setting.uid}')">Edit</button>
                                    <button class="btn-small btn-delete" onclick="deleteSetting('${setting.uid}')">Delete</button>
                                </div>
                            </div>
                            <div class="setting-data">${formatSettingData(setting)}</div>
                            <div class="setting-metadata">
                                <span>Created: ${formatDate(setting._metadata.created_at)}</span>
                                <span>Updated: ${formatDate(setting._metadata.updated_at)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

    container.innerHTML = html;
}

// Format setting data (exclude uid and _metadata)
function formatSettingData(setting) {
    const { uid, _metadata, ...data } = setting;
    return JSON.stringify(data, null, 2);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Update pagination controls
function updatePagination(pagination) {
    totalPages = pagination.totalPages;
    currentPage = pagination.currentPage;

    // Update bottom pagination
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-btn').disabled = !pagination.hasPrevious;
    document.getElementById('next-btn').disabled = !pagination.hasNext;

    // Update top pagination
    document.getElementById('page-info-top').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-btn-top').disabled = !pagination.hasPrevious;
    document.getElementById('next-btn-top').disabled = !pagination.hasNext;

    const paginationControls = document.getElementById('pagination-controls');
    const paginationControlsTop = document.getElementById('pagination-controls-top');
    const showPagination = totalPages > 1;

    paginationControls.style.display = showPagination ? 'flex' : 'none';
    paginationControlsTop.style.display = showPagination ? 'flex' : 'none';
}

// Update stats
function updateStats(pagination) {
    document.getElementById('total-settings').textContent = pagination.total;
}

// Change page
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadSettings();
    }
}

// Handle create form submission
async function handleCreate(e) {
    e.preventDefault();

    const jsonInput = document.getElementById('json-input');
    const createBtn = document.getElementById('create-btn');

    try {
        const data = JSON.parse(jsonInput.value);

        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';

        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create setting');
        }

        showAlert('Setting created successfully!');
        jsonInput.value = '';
        loadSettings();
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Setting';
    }
}

// Open edit modal
async function openEditModal(uid) {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/${uid}`);

        if (!response.ok) {
            throw new Error('Failed to load setting');
        }

        const setting = await response.json();
        const { uid: settingUid, _metadata, ...data } = setting;

        currentEditUid = uid;
        document.getElementById('edit-uid').textContent = uid;
        document.getElementById('edit-json-input').value = JSON.stringify(data, null, 2);
        document.getElementById('edit-modal').classList.add('active');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    currentEditUid = null;
}

// Handle update form submission
async function handleUpdate(e) {
    e.preventDefault();

    const jsonInput = document.getElementById('edit-json-input');

    try {
        const data = JSON.parse(jsonInput.value);

        const response = await fetch(`${API_BASE_URL}/settings/${currentEditUid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update setting');
        }

        showAlert('Setting updated successfully!');
        closeEditModal();
        loadSettings();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Delete setting
async function deleteSetting(uid) {
    if (!confirm('Are you sure you want to delete this setting? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/settings/${uid}`, {
            method: 'DELETE'
        });

        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to delete setting');
        }

        showAlert('Setting deleted successfully!');
        loadSettings();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Close modal when clicking outside
document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') {
        closeEditModal();
    }
});
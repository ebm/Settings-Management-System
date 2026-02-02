// Configuration
const API_BASE_URL = 'http://localhost:3000';
let currentPage = 1;
let totalPages = 1;
let currentEditUid: string | null = null;
const ITEMS_PER_PAGE = 5;

// Types
interface SettingMetadata {
    created_at: string;
    updated_at: string;
}

interface Setting {
    uid: string;
    _metadata: SettingMetadata;
    [key: string]: unknown;
}

interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

interface SettingsResponse {
    items: Setting[];
    pagination: Pagination;
}

interface ApiError {
    message?: string;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
});

function setupEventListeners(): void {
    const createForm = document.getElementById('create-form') as HTMLFormElement;
    const editForm = document.getElementById('edit-form') as HTMLFormElement;

    createForm.addEventListener('submit', handleCreate);
    editForm.addEventListener('submit', handleUpdate);

    // Bottom pagination
    (document.getElementById('prev-btn') as HTMLButtonElement).addEventListener('click', () => changePage(currentPage - 1));
    (document.getElementById('next-btn') as HTMLButtonElement).addEventListener('click', () => changePage(currentPage + 1));

    // Top pagination
    (document.getElementById('prev-btn-top') as HTMLButtonElement).addEventListener('click', () => changePage(currentPage - 1));
    (document.getElementById('next-btn-top') as HTMLButtonElement).addEventListener('click', () => changePage(currentPage + 1));
}

// Show alert message
function showAlert(message: string, type: 'success' | 'error' = 'success'): void {
    const container = document.getElementById('alert-container') as HTMLDivElement;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Load settings from API
async function loadSettings(): Promise<void> {
    try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const response = await fetch(`${API_BASE_URL}/settings?limit=${ITEMS_PER_PAGE}&offset=${offset}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SettingsResponse = await response.json();
        displaySettings(data.items);
        updatePagination(data.pagination);
        updateStats(data.pagination);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error loading settings:', error);
        const container = document.getElementById('settings-container') as HTMLDivElement;
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">!</div>
                <h3>Error loading settings</h3>
                <p>${errorMessage}</p>
                <p style="margin-top: 10px; font-size: 14px;">Make sure the API server is running on ${API_BASE_URL}</p>
            </div>
        `;
    }
}

// Display settings in the UI
function displaySettings(settings: Setting[]): void {
    const container = document.getElementById('settings-container') as HTMLDivElement;

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
function formatSettingData(setting: Setting): string {
    const { uid, _metadata, ...data } = setting;
    return JSON.stringify(data, null, 2);
}

// Format date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Update pagination controls
function updatePagination(pagination: Pagination): void {
    totalPages = pagination.totalPages;
    currentPage = pagination.currentPage;

    // Update bottom pagination
    (document.getElementById('page-info') as HTMLSpanElement).textContent = `Page ${currentPage} of ${totalPages}`;
    (document.getElementById('prev-btn') as HTMLButtonElement).disabled = !pagination.hasPrevious;
    (document.getElementById('next-btn') as HTMLButtonElement).disabled = !pagination.hasNext;

    // Update top pagination
    (document.getElementById('page-info-top') as HTMLSpanElement).textContent = `Page ${currentPage} of ${totalPages}`;
    (document.getElementById('prev-btn-top') as HTMLButtonElement).disabled = !pagination.hasPrevious;
    (document.getElementById('next-btn-top') as HTMLButtonElement).disabled = !pagination.hasNext;

    const paginationControls = document.getElementById('pagination-controls') as HTMLDivElement;
    const paginationControlsTop = document.getElementById('pagination-controls-top') as HTMLDivElement;
    const showPagination = totalPages > 1;

    paginationControls.style.display = showPagination ? 'flex' : 'none';
    paginationControlsTop.style.display = showPagination ? 'flex' : 'none';
}

// Update stats
function updateStats(pagination: Pagination): void {
    (document.getElementById('total-settings') as HTMLSpanElement).textContent = String(pagination.total);
}

// Change page
function changePage(page: number): void {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadSettings();
    }
}

// Handle create form submission
async function handleCreate(e: Event): Promise<void> {
    e.preventDefault();

    const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement;
    const createBtn = document.getElementById('create-btn') as HTMLButtonElement;

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
            const error: ApiError = await response.json();
            throw new Error(error.message || 'Failed to create setting');
        }

        showAlert('Setting created successfully!');
        jsonInput.value = '';
        loadSettings();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showAlert(errorMessage, 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Setting';
    }
}

// Open edit modal
async function openEditModal(uid: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/${uid}`);

        if (!response.ok) {
            throw new Error('Failed to load setting');
        }

        const setting: Setting = await response.json();
        const { uid: settingUid, _metadata, ...data } = setting;

        currentEditUid = uid;
        (document.getElementById('edit-uid') as HTMLSpanElement).textContent = uid;
        (document.getElementById('edit-json-input') as HTMLTextAreaElement).value = JSON.stringify(data, null, 2);
        (document.getElementById('edit-modal') as HTMLDivElement).classList.add('active');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showAlert(errorMessage, 'error');
    }
}

// Close edit modal
function closeEditModal(): void {
    (document.getElementById('edit-modal') as HTMLDivElement).classList.remove('active');
    currentEditUid = null;
}

// Handle update form submission
async function handleUpdate(e: Event): Promise<void> {
    e.preventDefault();

    const jsonInput = document.getElementById('edit-json-input') as HTMLTextAreaElement;

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
            const error: ApiError = await response.json();
            throw new Error(error.message || 'Failed to update setting');
        }

        showAlert('Setting updated successfully!');
        closeEditModal();
        loadSettings();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showAlert(errorMessage, 'error');
    }
}

// Delete setting
async function deleteSetting(uid: string): Promise<void> {
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showAlert(errorMessage, 'error');
    }
}

// Close modal when clicking outside
(document.getElementById('edit-modal') as HTMLDivElement).addEventListener('click', (e: MouseEvent) => {
    if ((e.target as HTMLElement).id === 'edit-modal') {
        closeEditModal();
    }
});

// Expose functions to global scope for onclick handlers
(window as any).openEditModal = openEditModal;
(window as any).deleteSetting = deleteSetting;
(window as any).closeEditModal = closeEditModal;

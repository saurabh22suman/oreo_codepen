/**
 * Oreo CodePen - Frontend Application
 * Simplified for static file hosting
 */

// State
let currentProjectId = null;
let isAdmin = false;

// Elements - Public Page
const publicPage = document.getElementById('public-page');
const adminLoginBtn = document.getElementById('admin-login-btn');
const publicProjectsList = document.getElementById('public-projects-list');
const publicEmptyState = document.getElementById('public-empty-state');

// Elements - Login Modal
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Elements - Dashboard
const dashboardPage = document.getElementById('dashboard-page');
const logoutBtn = document.getElementById('logout-btn');
const viewPublicBtn = document.getElementById('view-public-btn');
const newProjectBtn = document.getElementById('new-project-btn');
const projectsList = document.getElementById('projects-list');
const emptyState = document.getElementById('empty-state');

// Modals
const newProjectModal = document.getElementById('new-project-modal');
const editProjectModal = document.getElementById('edit-project-modal');
const uploadModal = document.getElementById('upload-modal');
const newProjectForm = document.getElementById('new-project-form');
const editProjectForm = document.getElementById('edit-project-form');
const uploadForm = document.getElementById('upload-form');
const fileUpload = document.getElementById('file-upload');
const fileList = document.getElementById('file-list');

// Initialize
init();

async function init() {
  loadPublicProjects();

  const authStatus = await checkAuth();
  if (authStatus) {
    isAdmin = true;
    showDashboard();
    loadProjects();
  }

  setupEventListeners();
}

function setupEventListeners() {
  adminLoginBtn.addEventListener('click', () => showModal(loginModal));
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  viewPublicBtn.addEventListener('click', showPublicPage);
  newProjectBtn.addEventListener('click', () => {
    resetNewProjectForm();
    showModal(newProjectModal);
  });

  newProjectForm.addEventListener('submit', handleCreateProject);
  editProjectForm.addEventListener('submit', handleEditProject);
  uploadForm.addEventListener('submit', handleUploadFiles);
  fileUpload.addEventListener('change', updateFileList);

  const typeRadios = document.querySelectorAll('input[name="type"]');
  typeRadios.forEach(radio => {
    radio.addEventListener('change', toggleExternalUrlField);
  });

  document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModals();
    }
  });

  setupFileDropZone();
}

function setupFileDropZone() {
  const dropZone = document.querySelector('.file-drop-zone');
  if (!dropZone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (fileUpload && files.length > 0) {
      fileUpload.files = files;
      updateFileList();
    }
  });
}

function toggleExternalUrlField() {
  const isExternal = document.querySelector('input[name="type"]:checked')?.value === 'external';
  const urlField = document.querySelector('.external-url-field');
  const urlInput = document.getElementById('project-url');

  if (isExternal) {
    urlField.classList.remove('hidden');
    urlInput.required = true;
  } else {
    urlField.classList.add('hidden');
    urlInput.required = false;
  }
}

function resetNewProjectForm() {
  newProjectForm.reset();
  document.querySelector('input[name="type"][value="hosted"]').checked = true;
  toggleExternalUrlField();
}

// Auth Functions
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const result = await response.json();
    return result.data?.authenticated || false;
  } catch (error) {
    return false;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';

  const formData = new FormData(loginForm);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      isAdmin = true;
      closeModals();
      showDashboard();
      loadProjects();
    } else {
      loginError.textContent = result.message || 'Invalid credentials';
    }
  } catch (error) {
    loginError.textContent = 'Login failed. Please try again.';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  }
  isAdmin = false;
  showPublicPage();
}

// Page Navigation
function showPublicPage() {
  publicPage.classList.add('active');
  publicPage.classList.remove('hidden');
  dashboardPage.classList.remove('active');
  dashboardPage.classList.add('hidden');
  loadPublicProjects();
}

function showDashboard() {
  publicPage.classList.remove('active');
  publicPage.classList.add('hidden');
  dashboardPage.classList.add('active');
  dashboardPage.classList.remove('hidden');
}

// Public Projects
async function loadPublicProjects() {
  try {
    const response = await fetch('/api/public/projects');
    const result = await response.json();
    const projects = result.data || {};

    publicProjectsList.innerHTML = '';
    const projectArray = Object.entries(projects);

    if (projectArray.length === 0) {
      publicEmptyState.classList.remove('hidden');
      publicProjectsList.classList.add('hidden');
    } else {
      publicEmptyState.classList.add('hidden');
      publicProjectsList.classList.remove('hidden');

      projectArray.forEach(([id, project]) => {
        const card = createPublicProjectCard(id, project);
        publicProjectsList.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

function createPublicProjectCard(id, project) {
  const card = document.createElement('div');
  card.className = 'project-card public-card';

  const isExternal = project.type === 'external';
  const typeIcon = isExternal ? '🔗' : '📦';
  const statusClass = 'live';
  const statusText = isExternal ? 'External Link' : 'Live';

  let actionButton;
  if (isExternal && project.externalUrl) {
    actionButton = `<a href="${escapeHtml(project.externalUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Visit Site ↗</a>`;
  } else if (project.publicHash) {
    actionButton = `<a href="/p/${project.publicHash}" target="_blank" class="btn btn-primary">View Project ↗</a>`;
  } else {
    actionButton = `<span class="project-offline">No files uploaded yet</span>`;
  }

  card.innerHTML = `
    <div class="card-header">
      <h3>${typeIcon} ${escapeHtml(project.name)}</h3>
    </div>
    <p class="card-description">${escapeHtml(project.description) || 'No description available'}</p>
    <div class="card-footer">
      ${actionButton}
    </div>
  `;

  return card;
}

// Admin Projects
async function loadProjects() {
  try {
    const response = await fetch('/api/projects');

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();
    const projects = result.data || {};

    projectsList.innerHTML = '';
    const projectArray = Object.entries(projects);

    if (projectArray.length === 0) {
      emptyState.classList.remove('hidden');
      projectsList.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      projectsList.classList.remove('hidden');

      projectArray.forEach(([id, project]) => {
        const card = createProjectCard(id, project);
        projectsList.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

function createProjectCard(id, project) {
  const card = document.createElement('div');
  card.className = 'project-card admin-card';

  const isExternal = project.type === 'external';
  const statusClass = isExternal ? 'external' : 'live';
  const statusText = isExternal ? 'External' : 'Live';
  const typeIcon = isExternal ? '🔗' : '📦';

  let urlHtml = '';
  if (isExternal && project.externalUrl) {
    urlHtml = `
      <div class="info-row">
        <span class="info-label">URL</span>
        <span class="project-url"><a href="${escapeHtml(project.externalUrl)}" target="_blank" rel="noopener noreferrer">Open ↗</a></span>
      </div>`;
  } else if (project.publicHash) {
    urlHtml = `
      <div class="info-row">
        <span class="info-label">URL</span>
        <span class="project-url"><a href="/p/${project.publicHash}" target="_blank">View ↗</a></span>
      </div>`;
  }

  // Build actions based on project type
  let actions = `<button class="btn btn-action btn-edit" onclick="openEditModal('${id}')" title="Edit">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  </button>`;

  if (!isExternal) {
    actions += `<button class="btn btn-action btn-files" onclick="openFilesModal('${id}')" title="Files">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>`;
  }

  actions += `<button class="btn btn-action btn-delete" onclick="deleteProject('${id}', '${escapeHtml(project.name)}')" title="Delete">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  </button>`;

  card.innerHTML = `
    <div class="card-type-badge ${isExternal ? 'external' : 'hosted'}">${typeIcon} ${isExternal ? 'External' : 'Hosted'}</div>
    <h3>${escapeHtml(project.name)}</h3>
    <p class="admin-description">${escapeHtml(project.description) || 'No description'}</p>
    <div class="project-info">
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          ${statusText}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">ID</span>
        <span class="project-hash">${(project.hash || id).substring(0, 8)}...</span>
      </div>
      ${urlHtml}
      <div class="info-row">
        <span class="info-label">Created</span>
        <span>${new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <div class="card-actions">
      ${actions}
    </div>
  `;

  return card;
}

// Project Actions
async function handleCreateProject(e) {
  e.preventDefault();

  const formData = new FormData(newProjectForm);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (result.success) {
      closeModals();
      newProjectForm.reset();
      loadProjects();
      showToast('Project created successfully!', 'success');
    } else {
      showToast(result.message || 'Failed to create project', 'error');
    }
  } catch (error) {
    showToast('Failed to create project', 'error');
  }
}

async function openEditModal(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}`);

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (!result.success) {
      showToast('Failed to load project', 'error');
      return;
    }

    const project = result.data;
    currentProjectId = projectId;

    document.getElementById('edit-project-id').value = projectId;
    document.getElementById('edit-project-type').value = project.type || 'hosted';
    document.getElementById('edit-project-name').value = project.name || '';
    document.getElementById('edit-project-description').value = project.description || '';

    const urlField = document.querySelector('.edit-external-url-field');
    const urlInput = document.getElementById('edit-project-url');

    if (project.type === 'external') {
      urlField.classList.remove('hidden');
      urlInput.value = project.externalUrl || '';
    } else {
      urlField.classList.add('hidden');
      urlInput.value = '';
    }

    showModal(editProjectModal);
  } catch (error) {
    showToast('Failed to load project', 'error');
  }
}

async function handleEditProject(e) {
  e.preventDefault();

  const projectId = document.getElementById('edit-project-id').value;
  const name = document.getElementById('edit-project-name').value;
  const description = document.getElementById('edit-project-description').value;
  const externalUrl = document.getElementById('edit-project-url').value;

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, externalUrl })
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (result.success) {
      closeModals();
      loadProjects();
      showToast('Project updated successfully!', 'success');
    } else {
      showToast(result.message || 'Failed to update project', 'error');
    }
  } catch (error) {
    showToast('Failed to update project', 'error');
  }
}

async function deleteProject(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (result.success) {
      loadProjects();
      showToast('Project deleted successfully!', 'success');
    } else {
      showToast(result.message || 'Failed to delete project', 'error');
    }
  } catch (error) {
    showToast('Failed to delete project', 'error');
  }
}

// File Upload
function openUploadModal(projectId) {
  currentProjectId = projectId;
  fileList.innerHTML = '';
  fileUpload.value = '';
  showModal(uploadModal);
}

function updateFileList() {
  const files = Array.from(fileUpload.files);
  fileList.innerHTML = '';

  if (files.length === 0) {
    fileList.innerHTML = '<p class="no-files">No files selected</p>';
    return;
  }

  files.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <span class="file-name">📄 ${escapeHtml(file.name)}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
    `;
    fileList.appendChild(fileItem);
  });
}

async function handleUploadFiles(e) {
  e.preventDefault();

  const files = fileUpload.files;
  if (!files || files.length === 0) {
    showToast('Please select files to upload', 'warning');
    return;
  }

  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await fetch(`/api/projects/${currentProjectId}/upload`, {
      method: 'POST',
      body: formData
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (result.success) {
      closeModals();
      showToast(`${result.data.filesUploaded} file(s) uploaded successfully!`, 'success');
      loadProjects();
    } else {
      showToast(result.message || 'Failed to upload files', 'error');
    }
  } catch (error) {
    showToast('Failed to upload files', 'error');
  }
}

// Session handling
function handleSessionExpired() {
  isAdmin = false;
  showToast('Session expired. Please login again.', 'warning');
  showPublicPage();
  showModal(loginModal);
}

// Modal Functions
function showModal(modal) {
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
  document.body.style.overflow = '';
  loginError.textContent = '';
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${getToastIcon(type)}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function getToastIcon(type) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
}

// Utility Functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File Manager
const filesModal = document.getElementById('files-modal');
const filesList = document.getElementById('files-list');
const filesEmpty = document.getElementById('files-empty');
const filesCount = document.querySelector('.files-count');
const addFilesBtn = document.getElementById('add-files-btn');
const renameModal = document.getElementById('rename-modal');
const renameForm = document.getElementById('rename-form');

// Setup file manager events
if (addFilesBtn) {
  addFilesBtn.addEventListener('click', () => {
    closeModals();
    openUploadModal(currentProjectId);
  });
}

if (renameForm) {
  renameForm.addEventListener('submit', handleRenameFile);
}

function openFilesModal(projectId) {
  currentProjectId = projectId;
  showModal(filesModal);
  loadProjectFiles(projectId);
}

async function loadProjectFiles(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}/files`);

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();
    const files = result.data || [];

    filesList.innerHTML = '';

    if (files.length === 0) {
      filesEmpty.classList.remove('hidden');
      filesList.classList.add('hidden');
      filesCount.textContent = '0 files';
    } else {
      filesEmpty.classList.add('hidden');
      filesList.classList.remove('hidden');
      filesCount.textContent = `${files.length} file${files.length > 1 ? 's' : ''}`;

      files.forEach(file => {
        const fileItem = createFileItem(file);
        filesList.appendChild(fileItem);
      });
    }
  } catch (error) {
    console.error('Failed to load files:', error);
    showToast('Failed to load files', 'error');
  }
}

function createFileItem(file) {
  const item = document.createElement('div');
  item.className = 'file-item-row';

  const icon = getFileIcon(file.name);
  const ext = file.name.split('.').pop().toLowerCase();

  item.innerHTML = `
    <div class="file-info">
      <div class="file-icon-wrapper ${ext}">${icon}</div>
      <div class="file-details">
        <span class="file-name-text">${escapeHtml(file.name)}</span>
        <span class="file-ext">.${ext.toUpperCase()}</span>
      </div>
    </div>
    <div class="file-meta">
      <span class="file-size">${formatFileSize(file.size)}</span>
    </div>
    <div class="file-actions">
      <button class="btn-file-action btn-rename" onclick="openRenameModal('${escapeHtml(file.name)}')" title="Rename">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="btn-file-action btn-delete-file" onclick="deleteFileConfirm('${escapeHtml(file.name)}')" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  return item;
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'html':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2l2 3 2-3h2"></path></svg>`;
    case 'css':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h8"></path><path d="M8 17h8"></path></svg>`;
    case 'js':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 12v6"></path><path d="M14 12v4a2 2 0 0 0 2 2"></path></svg>`;
    case 'json':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 16s1.5-2 4-2 4 2 4 2"></path></svg>`;
    case 'svg': case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    default:
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
  }
}

function openRenameModal(filename) {
  document.getElementById('rename-old-name').value = filename;
  document.getElementById('rename-new-name').value = filename;
  showModal(renameModal);
  document.getElementById('rename-new-name').select();
}

async function handleRenameFile(e) {
  e.preventDefault();

  const oldName = document.getElementById('rename-old-name').value;
  const newName = document.getElementById('rename-new-name').value.trim();

  if (!newName) {
    showToast('Please enter a filename', 'warning');
    return;
  }

  if (oldName === newName) {
    closeModals();
    showModal(filesModal);
    return;
  }

  try {
    const response = await fetch(`/api/projects/${currentProjectId}/files/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (result.success) {
      closeModals();
      showModal(filesModal);
      loadProjectFiles(currentProjectId);
      showToast('File renamed successfully', 'success');
    } else {
      showToast(result.message || 'Failed to rename file', 'error');
    }
  } catch (error) {
    showToast('Failed to rename file', 'error');
  }
}

async function deleteFileConfirm(filename) {
  if (!confirm(`Are you sure you want to delete "${filename}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/projects/${currentProjectId}/files/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });

    if (response.status === 401) {
      handleSessionExpired();
      return;
    }

    const result = await response.json();

    if (result.success) {
      loadProjectFiles(currentProjectId);
      showToast('File deleted successfully', 'success');
    } else {
      showToast(result.message || 'Failed to delete file', 'error');
    }
  } catch (error) {
    showToast('Failed to delete file', 'error');
  }
}


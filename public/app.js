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
  // Load public projects first
  loadPublicProjects();

  // Check if user is already authenticated
  const authStatus = await checkAuth();
  if (authStatus) {
    isAdmin = true;
    showDashboard();
    loadProjects();
  }

  setupEventListeners();
}

function setupEventListeners() {
  // Public page
  adminLoginBtn.addEventListener('click', () => showModal(loginModal));

  // Login
  loginForm.addEventListener('submit', handleLogin);

  // Dashboard
  logoutBtn.addEventListener('click', handleLogout);
  viewPublicBtn.addEventListener('click', showPublicPage);
  newProjectBtn.addEventListener('click', () => showModal(newProjectModal));

  // Forms
  newProjectForm.addEventListener('submit', handleCreateProject);
  editProjectForm.addEventListener('submit', handleEditProject);
  uploadForm.addEventListener('submit', handleUploadFiles);
  fileUpload.addEventListener('change', updateFileList);

  // Close modals
  document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModals();
    }
  });
}

// Auth Functions
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    return data.authenticated;
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

    if (response.ok) {
      isAdmin = true;
      closeModals();
      showDashboard();
      loadProjects();
      loginForm.reset();
    } else {
      loginError.textContent = 'Invalid username or password';
    }
  } catch (error) {
    loginError.textContent = 'Login failed. Please try again.';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    isAdmin = false;
    showPublicPage();
    loadPublicProjects();
  } catch (error) {
    console.error('Logout failed:', error);
  }
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
  dashboardPage.classList.add('active');
  dashboardPage.classList.remove('hidden');
  publicPage.classList.remove('active');
  publicPage.classList.add('hidden');
}

// Public Projects
async function loadPublicProjects() {
  try {
    const response = await fetch('/api/public/projects');
    const projects = await response.json();

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
    console.error('Failed to load public projects:', error);
  }
}

function createPublicProjectCard(id, project) {
  const card = document.createElement('div');
  card.className = 'project-card public-card';

  const isRunning = project.containerStatus === 'running';
  const statusClass = isRunning ? 'running' : 'stopped';
  const statusText = isRunning ? 'Live' : 'Offline';

  card.innerHTML = `
    <div class="card-header">
      <h3>${escapeHtml(project.name)}</h3>
      <span class="status-badge ${statusClass}">
        <span class="status-dot"></span>
        ${statusText}
      </span>
    </div>
    <p class="card-description">${escapeHtml(project.description) || 'No description available'}</p>
    <div class="card-footer">
      ${project.url && isRunning
      ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" class="btn btn-view-project">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
               <polyline points="15 3 21 3 21 9"></polyline>
               <line x1="10" y1="14" x2="21" y2="3"></line>
             </svg>
             Open Project
           </a>`
      : `<span class="project-offline">🔒 Project is currently offline</span>`
    }
    </div>
  `;

  return card;
}

// Admin Projects
async function loadProjects() {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();

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

  const statusClass = project.containerStatus === 'running' ? 'running' : 'stopped';
  const statusText = project.containerStatus === 'running' ? 'Running' : 'Stopped';

  const urlHtml = project.url
    ? `<div class="info-row">
         <span class="info-label">URL</span>
         <span class="project-url"><a href="${project.url}" target="_blank" rel="noopener noreferrer">Open App ↗</a></span>
       </div>`
    : '';

  card.innerHTML = `
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
        <span class="project-hash">${project.hash.substring(0, 8)}...</span>
      </div>
      ${urlHtml}
      <div class="info-row">
        <span class="info-label">Created</span>
        <span>${new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <div class="project-actions">
      <button class="btn btn-edit" onclick="openEditModal('${id}', '${escapeHtml(project.name)}', '${escapeHtml(project.description || '')}')">Edit</button>
      <button class="btn btn-upload" onclick="openUploadModal('${id}')">Upload</button>
      ${project.containerStatus === 'running'
      ? `<button class="btn btn-stop" onclick="stopProject('${id}')">Stop</button>`
      : `<button class="btn btn-start" onclick="startProject('${id}')">Start</button>`
    }
      <button class="btn btn-delete" onclick="deleteProject('${id}', '${escapeHtml(project.name)}')">Delete</button>
    </div>
  `;

  return card;
}

// Project CRUD Operations
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

    if (response.ok) {
      closeModals();
      newProjectForm.reset();
      loadProjects();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert('Failed to create project');
  }
}

function openEditModal(projectId, name, description) {
  currentProjectId = projectId;
  document.getElementById('edit-project-id').value = projectId;
  document.getElementById('edit-project-name').value = name;
  document.getElementById('edit-project-description').value = description;
  showModal(editProjectModal);
}

async function handleEditProject(e) {
  e.preventDefault();

  const projectId = document.getElementById('edit-project-id').value;
  const name = document.getElementById('edit-project-name').value;
  const description = document.getElementById('edit-project-description').value;

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    if (response.ok) {
      closeModals();
      loadProjects();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert('Failed to update project');
  }
}

function openUploadModal(projectId) {
  currentProjectId = projectId;
  fileUpload.value = '';
  fileList.innerHTML = '';
  showModal(uploadModal);
}

function updateFileList() {
  const files = Array.from(fileUpload.files);
  fileList.innerHTML = '';

  if (files.length > 0) {
    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-list-item';
      item.textContent = `📄 ${file.name} (${formatFileSize(file.size)})`;
      fileList.appendChild(item);
    });
  }
}

async function handleUploadFiles(e) {
  e.preventDefault();

  if (!currentProjectId) return;

  const files = fileUpload.files;
  if (files.length === 0) {
    alert('Please select files to upload');
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

    if (response.ok) {
      closeModals();
      alert('Files uploaded successfully!');
      loadProjects();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert('Failed to upload files');
  }
}

async function startProject(id) {
  try {
    const response = await fetch(`/api/projects/${id}/start`, {
      method: 'POST'
    });

    if (response.ok) {
      loadProjects();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert('Failed to start project');
  }
}

async function stopProject(id) {
  try {
    const response = await fetch(`/api/projects/${id}/stop`, {
      method: 'POST'
    });

    if (response.ok) {
      loadProjects();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert('Failed to stop project');
  }
}

async function deleteProject(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadProjects();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert('Failed to delete project');
  }
}

// Modal Functions
function showModal(modal) {
  modal.classList.remove('hidden');
}

function closeModals() {
  loginModal.classList.add('hidden');
  newProjectModal.classList.add('hidden');
  editProjectModal.classList.add('hidden');
  uploadModal.classList.add('hidden');
  currentProjectId = null;
  loginError.textContent = '';
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
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

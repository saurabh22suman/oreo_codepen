// State
let currentProjectId = null;

// Elements
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const newProjectBtn = document.getElementById('new-project-btn');
const projectsList = document.getElementById('projects-list');
const emptyState = document.getElementById('empty-state');

// Modals
const newProjectModal = document.getElementById('new-project-modal');
const uploadModal = document.getElementById('upload-modal');
const newProjectForm = document.getElementById('new-project-form');
const uploadForm = document.getElementById('upload-form');
const fileUpload = document.getElementById('file-upload');
const fileList = document.getElementById('file-list');

// Initialize
checkAuth();

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
newProjectBtn.addEventListener('click', () => showModal(newProjectModal));
newProjectForm.addEventListener('submit', handleCreateProject);
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

// Functions
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    if (data.authenticated) {
      showDashboard();
      loadProjects();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();
  }
}

function showLogin() {
  loginPage.classList.add('active');
  dashboardPage.classList.remove('active');
}

function showDashboard() {
  loginPage.classList.remove('active');
  dashboardPage.classList.remove('hidden');
  dashboardPage.classList.add('active');
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
    showLogin();
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

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
  card.className = 'project-card';

  const statusClass = project.containerStatus === 'running' ? 'running' : 'stopped';
  const statusText = project.containerStatus === 'running' ? 'Running' : 'Stopped';

  const urlHtml = project.url 
    ? `<div><strong>URL:</strong> <span class="project-url"><a href="${project.url}" target="_blank">${project.url}</a></span></div>`
    : '';

  card.innerHTML = `
    <h3>${escapeHtml(project.name)}</h3>
    <div class="project-info">
      <div><strong>Hash:</strong> <span class="project-hash">${project.hash}</span></div>
      <div><strong>Status:</strong> <span class="project-status ${statusClass}">${statusText}</span></div>
      ${urlHtml}
      <div><strong>Created:</strong> ${new Date(project.createdAt).toLocaleString()}</div>
    </div>
    <div class="project-actions">
      <button class="btn btn-warning" onclick="openUploadModal('${id}')">Upload</button>
      ${project.containerStatus === 'running'
        ? `<button class="btn btn-secondary" onclick="stopProject('${id}')">Stop</button>`
        : `<button class="btn btn-success" onclick="startProject('${id}')">Start</button>`
      }
      <button class="btn btn-danger" onclick="deleteProject('${id}', '${escapeHtml(project.name)}')">Delete</button>
    </div>
  `;

  return card;
}

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

function showModal(modal) {
  modal.classList.remove('hidden');
}

function closeModals() {
  newProjectModal.classList.add('hidden');
  uploadModal.classList.add('hidden');
  currentProjectId = null;
}

function escapeHtml(text) {
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

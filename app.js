// --- KONFIGURASI & INISIALISASI ---
const SUPABASE_URL = 'https://rbmtvddmrwfxndalaecr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXR2ZGRtcndmeG5kYWxhZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1MzYsImV4cCI6MjA3MDQ1NjUzNn0.1vpTH7F514LyyeOJL1fa-SViz-q-bCXryV0hFgeI4a8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STATE APLIKASI ---
let currentUser = null;
let currentProject = null;
let isRegisterMode = false;
const defaultVenueCategories = ["Panti Jompo", "Yayasan Disabilitas", "Yayasan Kanker", "Umum"];
const activityTypes = ["Edukasi", "Eksperimen", "Kreasi", "Games", "Ice Breaking"];
let budgetChartInstance = null;
let progressChartInstance = null;
let dashboardBudgetChartInstance = null;
let dashboardStatusChartInstance = null;
let ganttChartInstance = null; 

// --- ELEMEN DOM (Deklarasi Variabel) ---
let authPage, appPage, projectsListView, projectDetailView, dashboardContainer,
    dashboardKPIs, authForm, authTitle, authButton,
    switchAuthModeLink, authPromptText, authError, emailInput, passwordInput,
    userEmailEl, logoutButton, projectsContainer, addProjectButton,
    backToProjectsButton, detailProjectName, detailProjectDescription,
    detailInitialBudget, detailAdjustedBudget, detailCurrentBudget, detailTimeline,
    detailActivityType, detailVenueCategory,
    projectNotes, saveNotesButton, deleteProjectButton, exportExcelButton,
    tasksList, addTaskButton, projectModal, projectModalTitle, projectForm,
    cancelProjectModal, projectIdInput, projectNameInput, projectDescriptionInput,
    projectBudgetInput, projectStartDateInput, projectEndDateInput, taskModal,
    projectActivityTypeCheckboxes, projectVenueCategorySelect,
    taskModalTitle, taskForm, cancelTaskModal, 
    taskIdInput, taskNameInput, taskCostInput, taskStatusInput, addBudgetModal, addBudgetForm,
    cancelAddBudgetModal, addBudgetAmountInput, openAddBudgetButton, ganttChartSection;

// --- FUNGSI UTILITAS & AUTENTIKASI ---
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

const toggleAuthMode = () => {
    isRegisterMode = !isRegisterMode;
    authForm.reset();
    authError.textContent = '';
    if (isRegisterMode) {
        authTitle.textContent = 'Registrasi';
        authButton.textContent = 'Registrasi';
        authPromptText.textContent = 'Sudah punya akun?';
        switchAuthModeLink.textContent = 'Login';
    } else {
        authTitle.textContent = 'Login';
        authButton.textContent = 'Login';
        authPromptText.textContent = 'Belum punya akun?';
        switchAuthModeLink.textContent = 'Registrasi';
    }
};

const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';
    
    try {
        let response;
        if (isRegisterMode) {
            response = await supabaseClient.auth.signUp({ email, password });
            if (!response.error && response.data.user) {
                alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.');
                toggleAuthMode();
            }
        } else {
            response = await supabaseClient.auth.signInWithPassword({ email, password });
        }
        if (response.error) throw response.error;
    } catch (error) {
        console.error('Error:', error.message);
        authError.textContent = error.message;
    }
};

const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
};

const showAuthPage = () => {
    authPage.classList.remove('hidden');
    appPage.classList.add('hidden');
};

const showAppPage = () => {
    authPage.classList.add('hidden');
    appPage.classList.remove('hidden');
    showProjectsListView();
};

const showProjectsListView = () => {
    projectsListView.classList.remove('hidden');
    projectDetailView.classList.add('hidden');
    currentProject = null;
    fetchProjects();
};

const showProjectDetailView = (project) => {
    currentProject = project;
    projectsListView.classList.add('hidden');
    projectDetailView.classList.remove('hidden');
    renderProjectDetails();
};

// --- FUNGSI RENDER ---
const renderDashboard = (projects = []) => {
    if (projects.length === 0) {
        dashboardContainer.classList.add('hidden');
        projectsContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 bg-white rounded-lg shadow">Anda belum memiliki proyek. Silakan tambahkan proyek baru.</p>`;
        return;
    }

    dashboardContainer.classList.remove('hidden');
    
    const now = new Date();
    const totalBudget = projects.reduce((sum, p) => sum + (p.current_budget || p.initial_budget), 0);
    const inProgress = projects.filter(p => new Date(p.end_date) >= now).length;
    const nearingDeadline = projects.filter(p => {
        const endDate = new Date(p.end_date);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;

    dashboardKPIs.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow"><p class="text-sm text-gray-500">Total Proyek</p><p class="text-2xl font-bold">${projects.length}</p></div>
        <div class="bg-white p-4 rounded-lg shadow"><p class="text-sm text-gray-500">Total Budget</p><p class="text-2xl font-bold kpi-value">${formatCurrency(totalBudget)}</p></div>
        <div class="bg-white p-4 rounded-lg shadow"><p class="text-sm text-gray-500">Sedang Berjalan</p><p class="text-2xl font-bold">${inProgress}</p></div>
        <div class="bg-white p-4 rounded-lg shadow"><p class="text-sm text-gray-500">Deadline < 7 Hari</p><p class="text-2xl font-bold">${nearingDeadline}</p></div>
    `;
    renderDashboardCharts(projects);
};

const renderProjects = (projects) => {
    renderDashboard(projects);
    renderGanttChart(projects);
    if (projects.length > 0) {
        projectsContainer.innerHTML = '';
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'bg-white p-5 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer';
            const activityBadges = (project.activity_type || []).map(type => `<span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">${type}</span>`).join(' ');
            card.innerHTML = `
                <div class="flex flex-wrap gap-2 mb-2">
                    ${activityBadges}
                    ${project.venue_category ? `<span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">${project.venue_category}</span>` : ''}
                </div>
                <h3 class="font-bold text-lg text-gray-800">${project.name}</h3>
                <p class="text-gray-600 text-sm mt-1 mb-3 truncate">${project.description || 'Tidak ada deskripsi'}</p>
                <p><strong>Deadline:</strong> ${formatDate(project.end_date)}</p>
            `;
            card.addEventListener('click', () => showProjectDetailView(project));
            projectsContainer.appendChild(card);
        });
    }
};


const renderProjectDetails = async () => {
    if (!currentProject) return;
    detailProjectName.textContent = currentProject.name;
    detailProjectDescription.textContent = currentProject.description || '';
    
    const activityBadges = (currentProject.activity_type || []).map(type => `<span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">${type}</span>`).join(' ');
    detailActivityType.innerHTML = activityBadges || `<span class="text-xs text-gray-500">N/A</span>`;
    detailVenueCategory.textContent = currentProject.venue_category || 'N/A';
    
    detailInitialBudget.textContent = formatCurrency(currentProject.initial_budget);
    detailAdjustedBudget.textContent = formatCurrency(currentProject.current_budget || currentProject.initial_budget);
    detailTimeline.textContent = `${formatDate(currentProject.start_date)} - ${formatDate(currentProject.end_date)}`;
    projectNotes.value = currentProject.notes || '';
    
    const tasks = await fetchTasks(currentProject.id);
    renderTasks(tasks);
    updateDetailCharts(tasks);
};

const renderTasks = (tasks) => {
    tasksList.innerHTML = '';
    let totalCost = 0;
    if (tasks.length > 0) {
        tasks.forEach(task => {
            totalCost += task.cost;
            const taskEl = document.createElement('div');
            taskEl.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-md';
            taskEl.innerHTML = `
                <div><p class="font-medium">${task.name}</p><p class="text-sm text-gray-500">${formatCurrency(task.cost)}</p></div>
                <div class="flex items-center gap-2"><span class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200">${task.status}</span><button data-task-id="${task.id}" class="edit-task-btn text-blue-600">Edit</button><button data-task-id="${task.id}" class="delete-task-btn text-red-600">Hapus</button></div>
            `;
            tasksList.appendChild(taskEl);
        });
    } else {
        tasksList.innerHTML = `<p class="text-gray-500 text-center p-4">Belum ada tugas.</p>`;
    }

    const currentBudget = currentProject.current_budget || currentProject.initial_budget;
    detailCurrentBudget.textContent = formatCurrency(currentBudget - totalCost);

    document.querySelectorAll('.edit-task-btn').forEach(btn => btn.addEventListener('click', handleEditTaskClick));
    document.querySelectorAll('.delete-task-btn').forEach(btn => btn.addEventListener('click', handleDeleteTaskClick));
};


// --- FUNGSI CHART ---
const renderGanttChart = (projects) => {
    const ganttCtx = document.getElementById('gantt-chart').getContext('2d');
    if (ganttChartInstance) ganttChartInstance.destroy();

    const validProjects = projects.filter(p => p.start_date && p.end_date);
    if (validProjects.length === 0) {
        ganttChartSection.style.display = 'none';
        return;
    }
    ganttChartSection.style.display = 'block';

    ganttChartInstance = new Chart(ganttCtx, {
        type: 'bar',
        data: {
            labels: validProjects.map(p => p.name),
            datasets: [{
                label: 'Durasi Proyek',
                data: validProjects.map(p => [new Date(p.start_date), new Date(p.end_date)]),
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
            }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: 'day' } } } }
    });
};

const renderDashboardCharts = (projects) => {
    const budgetCtx = document.getElementById('dashboard-budget-chart').getContext('2d');
    if (dashboardBudgetChartInstance) dashboardBudgetChartInstance.destroy();
    dashboardBudgetChartInstance = new Chart(budgetCtx, {
        type: 'bar',
        data: {
            labels: projects.map(p => p.name),
            datasets: [{ label: 'Budget', data: projects.map(p => p.current_budget || p.initial_budget), backgroundColor: 'rgba(79, 70, 229, 0.8)' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const statusCtx = document.getElementById('dashboard-status-chart').getContext('2d');
    if (dashboardStatusChartInstance) dashboardStatusChartInstance.destroy();
    const statusCounts = projects.reduce((acc, p) => {
        const status = new Date(p.end_date) < new Date() ? 'Terlambat' : 'Berjalan';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    dashboardStatusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#22c55e', '#ef4444'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

const updateDetailCharts = (tasks) => {
    const budgetCtx = document.getElementById('budget-chart').getContext('2d');
    if (budgetChartInstance) budgetChartInstance.destroy();
    const totalCost = tasks.reduce((sum, task) => sum + task.cost, 0);
    const remainingBudget = (currentProject.current_budget || currentProject.initial_budget) - totalCost;
    budgetChartInstance = new Chart(budgetCtx, {
        type: 'doughnut',
        data: {
            labels: ['Sisa Budget', 'Biaya Terpakai'],
            datasets: [{ data: [remainingBudget, totalCost], backgroundColor: ['#4ade80', '#f87171'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const progressCtx = document.getElementById('progress-chart').getContext('2d');
    if (progressChartInstance) progressChartInstance.destroy();
    const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});
    progressChartInstance = new Chart(progressCtx, {
        type: 'pie',
        data: {
            labels: ['Belum Dikerjakan', 'Sedang Dikerjakan', 'Selesai'],
            datasets: [{ data: [statusCounts['Belum Dikerjakan'] || 0, statusCounts['Sedang Dikerjakan'] || 0, statusCounts['Selesai'] || 0], backgroundColor: ['#9ca3af', '#facc15', '#4ade80'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

// --- FUNGSI CRUD & MODAL ---
const fetchProjects = async () => {
    if (!currentUser) return;
    try {
        const { data, error } = await supabaseClient.from('projects').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        if (error) throw error;
        renderProjects(data);
    } catch (error) {
        console.error('Error fetching projects:', error.message);
        alert('Gagal memuat proyek.');
        renderProjects([]);
    }
};

const fetchTasks = async (projectId) => {
    const { data, error } = await supabaseClient.from('tasks').select('*').eq('project_id', projectId).order('created_at');
    if (error) {
        console.error('Error fetching tasks:', error.message);
        return [];
    }
    return data;
};

const handleProjectFormSubmit = async (event) => {
    event.preventDefault();
    const isUpdate = !!projectIdInput.value;
    const selectedActivities = Array.from(document.querySelectorAll('input[name="project-activity-type"]:checked')).map(cb => cb.value);
    
    const projectData = {
        name: projectNameInput.value,
        description: projectDescriptionInput.value,
        start_date: projectStartDateInput.value,
        end_date: projectEndDateInput.value,
        activity_type: selectedActivities,
        venue_category: projectVenueCategorySelect.value,
        user_id: currentUser.id,
    };

    if (!isUpdate) {
        projectData.initial_budget = parseFloat(projectBudgetInput.value);
        projectData.current_budget = projectData.initial_budget;
    }

    const { error } = isUpdate
        ? await supabaseClient.from('projects').update(projectData).eq('id', projectIdInput.value)
        : await supabaseClient.from('projects').insert([projectData]);
    
    if (error) {
        console.error('Error saving project:', error.message);
        alert('Gagal menyimpan proyek.');
    } else {
        closeProjectModal();
        fetchProjects();
    }
};

const handleTaskFormSubmit = async (event) => {
    event.preventDefault();
    const isUpdate = !!taskIdInput.value;
    const taskData = {
        name: taskNameInput.value,
        cost: parseFloat(taskCostInput.value),
        status: taskStatusInput.value,
        project_id: currentProject.id,
        user_id: currentUser.id
    };
    
    const { error } = isUpdate
        ? await supabaseClient.from('tasks').update(taskData).eq('id', taskIdInput.value)
        : await supabaseClient.from('tasks').insert([taskData]);

    if (error) {
        console.error('Error saving task:', error.message);
    } else {
        closeTaskModal();
        renderProjectDetails();
    }
};

const handleAddBudgetFormSubmit = async (event) => {
    event.preventDefault();
    const amount = parseFloat(addBudgetAmountInput.value);
    if (isNaN(amount)) return;
    const newBudget = (currentProject.current_budget || currentProject.initial_budget) + amount;
    const { data, error } = await supabaseClient.from('projects').update({ current_budget: newBudget }).eq('id', currentProject.id).select().single();
    if (error) {
        console.error('Error updating budget:', error.message);
    } else {
        currentProject = data;
        renderProjectDetails();
        closeAddBudgetModal();
    }
};

const handleSaveNotes = async () => {
    const { error } = await supabaseClient.from('projects').update({ notes: projectNotes.value }).eq('id', currentProject.id);
    if (error) alert('Gagal menyimpan catatan.');
    else alert('Catatan disimpan!');
};

const handleDeleteProject = async () => {
    if (!confirm(`Hapus proyek "${currentProject.name}"?`)) return;
    const { error } = await supabaseClient.from('projects').delete().eq('id', currentProject.id);
    if (error) alert('Gagal menghapus proyek.');
    else showProjectsListView();
};

const handleEditTaskClick = async (event) => {
    const taskId = event.target.dataset.taskId;
    const { data, error } = await supabaseClient.from('tasks').select('*').eq('id', taskId).single();
    if (error) console.error('Error fetching task:', error);
    else openTaskModal(data);
};

const handleDeleteTaskClick = async (event) => {
    const taskId = event.target.dataset.taskId;
    if (!confirm('Hapus tugas ini?')) return;
    const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
    else renderProjectDetails();
};

const openProjectModal = (project = null) => {
    projectForm.reset();
    projectActivityTypeCheckboxes.innerHTML = '';
    activityTypes.forEach(type => {
        projectActivityTypeCheckboxes.innerHTML += `<div><input type="checkbox" id="type-${type}" value="${type}" name="project-activity-type"><label for="type-${type}" class="ml-2">${type}</label></div>`;
    });
    
    projectVenueCategorySelect.innerHTML = '';
    defaultVenueCategories.forEach(cat => {
        projectVenueCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    if (project) {
        projectModalTitle.textContent = 'Edit Proyek';
        projectIdInput.value = project.id;
        projectNameInput.value = project.name;
        projectDescriptionInput.value = project.description;
        (project.activity_type || []).forEach(type => {
            const cb = document.querySelector(`#type-${type}`);
            if (cb) cb.checked = true;
        });
        projectVenueCategorySelect.value = project.venue_category;
        projectBudgetInput.parentElement.style.display = 'none';
        projectStartDateInput.value = project.start_date;
        projectEndDateInput.value = project.end_date;
    } else {
        projectModalTitle.textContent = 'Tambah Proyek Baru';
        projectIdInput.value = '';
        projectBudgetInput.parentElement.style.display = 'block';
    }
    projectModal.classList.add('show');
};
const closeProjectModal = () => projectModal.classList.remove('show');

const openTaskModal = (task = null) => {
    taskForm.reset();
    if (task) {
        taskModalTitle.textContent = 'Edit Tugas';
        taskIdInput.value = task.id;
        taskNameInput.value = task.name;
        taskCostInput.value = task.cost;
        taskStatusInput.value = task.status;
    } else {
        taskModalTitle.textContent = 'Tambah Tugas Baru';
    }
    taskModal.classList.add('show');
};
const closeTaskModal = () => taskModal.classList.remove('show');

const openAddBudgetModal = () => addBudgetModal.classList.add('show');
const closeAddBudgetModal = () => addBudgetModal.classList.remove('show');

const handleExportToExcel = async () => {
    const tasks = await fetchTasks(currentProject.id);
    const summaryData = [
        ["Nama Proyek", currentProject.name],
        ["Deskripsi", currentProject.description],
        ["Timeline", `${formatDate(currentProject.start_date)} - ${formatDate(currentProject.end_date)}`],
        ["Budget Awal", currentProject.initial_budget],
        ["Budget Disesuaikan", currentProject.current_budget],
    ];
    const taskData = tasks.map(t => ({ "Nama": t.name, "Biaya": t.cost, "Status": t.status }));
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(taskData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, ws2, "Tugas");
    XLSX.writeFile(wb, `Laporan_${currentProject.name}.xlsx`);
};

const initializeApp = () => {
    // Inisialisasi Elemen DOM
    authPage = document.getElementById('auth-page');
    appPage = document.getElementById('app-page');
    projectsListView = document.getElementById('projects-list-view');
    projectDetailView = document.getElementById('project-detail-view');
    dashboardContainer = document.getElementById('dashboard-container');
    dashboardKPIs = document.getElementById('dashboard-kpis');
    authForm = document.getElementById('auth-form');
    authTitle = document.getElementById('auth-title');
    authButton = document.getElementById('auth-button');
    switchAuthModeLink = document.getElementById('switch-auth-mode');
    authPromptText = document.getElementById('auth-prompt-text');
    authError = document.getElementById('auth-error');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    userEmailEl = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');
    projectsContainer = document.getElementById('projects-container');
    addProjectButton = document.getElementById('add-project-button');
    backToProjectsButton = document.getElementById('back-to-projects');
    detailProjectName = document.getElementById('detail-project-name');
    detailProjectDescription = document.getElementById('detail-project-description');
    detailActivityType = document.getElementById('detail-activity-type');
    detailVenueCategory = document.getElementById('detail-venue-category');
    detailInitialBudget = document.getElementById('detail-initial-budget');
    detailAdjustedBudget = document.getElementById('detail-adjusted-budget');
    detailCurrentBudget = document.getElementById('detail-current-budget');
    detailTimeline = document.getElementById('detail-timeline');
    projectNotes = document.getElementById('project-notes');
    saveNotesButton = document.getElementById('save-notes-button');
    deleteProjectButton = document.getElementById('delete-project-button');
    exportExcelButton = document.getElementById('export-excel-button');
    tasksList = document.getElementById('tasks-list');
    addTaskButton = document.getElementById('add-task-button');
    projectModal = document.getElementById('project-modal');
    projectModalTitle = document.getElementById('project-modal-title');
    projectForm = document.getElementById('project-form');
    cancelProjectModal = document.getElementById('cancel-project-modal');
    projectIdInput = document.getElementById('project-id');
    projectNameInput = document.getElementById('project-name');
    projectDescriptionInput = document.getElementById('project-description');
    projectActivityTypeCheckboxes = document.getElementById('project-activity-type-checkboxes');
    projectVenueCategorySelect = document.getElementById('project-venue-category');
    projectBudgetInput = document.getElementById('project-budget');
    projectStartDateInput = document.getElementById('project-start-date');
    projectEndDateInput = document.getElementById('project-end-date');
    taskModal = document.getElementById('task-modal');
    taskModalTitle = document.getElementById('task-modal-title');
    taskForm = document.getElementById('task-form');
    cancelTaskModal = document.getElementById('cancel-task-modal');
    taskIdInput = document.getElementById('task-id');
    taskNameInput = document.getElementById('task-name');
    taskCostInput = document.getElementById('task-cost');
    taskStatusInput = document.getElementById('task-status');
    addBudgetModal = document.getElementById('add-budget-modal');
    addBudgetForm = document.getElementById('add-budget-form');
    cancelAddBudgetModal = document.getElementById('cancel-add-budget-modal');
    addBudgetAmountInput = document.getElementById('add-budget-amount');
    openAddBudgetButton = document.getElementById('open-add-budget-button');
    ganttChartSection = document.getElementById('gantt-chart-section');

    // Event Listeners
    authForm.addEventListener('submit', handleAuthSubmit);
    switchAuthModeLink.addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(); });
    logoutButton.addEventListener('click', handleLogout);
    addProjectButton.addEventListener('click', () => openProjectModal());
    projectForm.addEventListener('submit', handleProjectFormSubmit);
    cancelProjectModal.addEventListener('click', closeProjectModal);
    backToProjectsButton.addEventListener('click', showProjectsListView);
    deleteProjectButton.addEventListener('click', handleDeleteProject);
    saveNotesButton.addEventListener('click', handleSaveNotes);
    addTaskButton.addEventListener('click', () => openTaskModal());
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    cancelTaskModal.addEventListener('click', closeTaskModal);
    openAddBudgetButton.addEventListener('click', openAddBudgetModal);
    addBudgetForm.addEventListener('submit', handleAddBudgetFormSubmit);
    cancelAddBudgetModal.addEventListener('click', closeAddBudgetModal);
    exportExcelButton.addEventListener('click', handleExportToExcel);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            currentUser = session.user;
            userEmailEl.textContent = currentUser.email;
            showAppPage();
        } else {
            currentUser = null;
            showAuthPage();
        }
    });
};

document.addEventListener('DOMContentLoaded', initializeApp);


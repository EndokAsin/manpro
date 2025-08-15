// --- KONFIGURASI & INISIALISASI ---
const SUPABASE_URL = 'https://rbmtvddmrwfxndalaecr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXR2ZGRtcndmeG5kYWxhZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1MzYsImV4cCI6MjA3MDQ1NjUzNn0.1vpTH7F514LyyeOJL1fa-SViz-q-bCXryVohFgeI4a8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STATE APLIKASI ---
let currentUser = null;
let currentProject = null;
let isRegisterMode = false;
let budgetChartInstance = null;
let progressChartInstance = null;
let dashboardBudgetChartInstance = null;
let dashboardStatusChartInstance = null;
let ganttChartInstance = null; // State untuk Gantt Chart

// --- ELEMEN DOM ---
const authPage = document.getElementById('auth-page');
const appPage = document.getElementById('app-page');
// ... elemen DOM lainnya ...
const ganttChartContainer = document.getElementById('gantt-chart-container');

// (Salin semua elemen DOM lainnya dari file app.js Anda yang sebelumnya)
const projectsListView = document.getElementById('projects-list-view');
const projectDetailView = document.getElementById('project-detail-view');
const dashboardContainer = document.getElementById('dashboard-container');
const dashboardKPIs = document.getElementById('dashboard-kpis');
const upcomingDeadlinesList = document.getElementById('upcoming-deadlines-list');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authButton = document.getElementById('auth-button');
const switchAuthModeLink = document.getElementById('switch-auth-mode');
const authPromptText = document.getElementById('auth-prompt-text');
const authError = document.getElementById('auth-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userEmailEl = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const projectsContainer = document.getElementById('projects-container');
const addProjectButton = document.getElementById('add-project-button');
const backToProjectsButton = document.getElementById('back-to-projects');
const detailProjectName = document.getElementById('detail-project-name');
const detailProjectDescription = document.getElementById('detail-project-description');
const detailInitialBudget = document.getElementById('detail-initial-budget');
const detailAdjustedBudget = document.getElementById('detail-adjusted-budget');
const detailCurrentBudget = document.getElementById('detail-current-budget');
const detailTimeline = document.getElementById('detail-timeline');
const projectNotes = document.getElementById('project-notes');
const saveNotesButton = document.getElementById('save-notes-button');
const deleteProjectButton = document.getElementById('delete-project-button');
const exportExcelButton = document.getElementById('export-excel-button');
const tasksList = document.getElementById('tasks-list');
const addTaskButton = document.getElementById('add-task-button');
const projectModal = document.getElementById('project-modal');
const projectModalTitle = document.getElementById('project-modal-title');
const projectForm = document.getElementById('project-form');
const cancelProjectModal = document.getElementById('cancel-project-modal');
const projectIdInput = document.getElementById('project-id');
const projectNameInput = document.getElementById('project-name');
const projectDescriptionInput = document.getElementById('project-description');
const projectBudgetInput = document.getElementById('project-budget');
const projectStartDateInput = document.getElementById('project-start-date');
const projectEndDateInput = document.getElementById('project-end-date');
const taskModal = document.getElementById('task-modal');
const taskModalTitle = document.getElementById('task-modal-title');
const taskForm = document.getElementById('task-form');
const cancelTaskModal = document.getElementById('cancel-task-modal');
const taskIdInput = document.getElementById('task-id');
const taskNameInput = document.getElementById('task-name');
const taskCostInput = document.getElementById('task-cost');
const taskStatusInput = document.getElementById('task-status');
const addBudgetModal = document.getElementById('add-budget-modal');
const addBudgetForm = document.getElementById('add-budget-form');
const cancelAddBudgetModal = document.getElementById('cancel-add-budget-modal');
const addBudgetAmountInput = document.getElementById('add-budget-amount');
const openAddBudgetButton = document.getElementById('open-add-budget-button');


// --- FUNGSI UTILITAS & AUTENTIKASI ---
// (Salin semua fungsi utilitas dan autentikasi dari file app.js Anda yang sebelumnya)
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const toggleAuthMode = () => { /* ... */ };
const handleAuthSubmit = async (event) => { /* ... */ };
const handleLogout = async () => { /* ... */ };
const showAuthPage = () => { /* ... */ };
const showAppPage = () => { /* ... */ };
const showProjectsListView = () => { /* ... */ };
const showProjectDetailView = (project) => { /* ... */ };


// --- FUNGSI RENDER ---

// Render Dasbor Utama
const renderDashboard = (projects) => {
    if (projects.length === 0) {
        dashboardContainer.classList.add('hidden');
        return;
    }
    dashboardContainer.classList.remove('hidden');
    
    // (Salin logika render KPI dan Deadline dari file app.js Anda yang sebelumnya)
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const totalBudget = projects.reduce((sum, p) => sum + (p.current_budget || p.initial_budget), 0);
    const inProgress = projects.filter(p => new Date(p.end_date) >= now).length;
    const nearingDeadline = projects.filter(p => new Date(p.end_date) >= now && new Date(p.end_date) <= oneWeekFromNow).length;
    dashboardKPIs.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow flex items-start"><div class="bg-indigo-100 rounded-full p-3 mr-3"><svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div><div class="flex-1 min-w-0"><p class="text-sm text-gray-500 truncate">Total Proyek</p><p class="text-xl sm:text-2xl font-bold">${projects.length}</p></div></div>
        <div class="bg-white p-4 rounded-lg shadow flex items-start"><div class="bg-green-100 rounded-full p-3 mr-3"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg></div><div class="flex-1 min-w-0"><p class="text-sm text-gray-500 truncate">Total Budget</p><p class="text-xl sm:text-2xl font-bold break-words">${formatCurrency(totalBudget)}</p></div></div>
        <div class="bg-white p-4 rounded-lg shadow flex items-start"><div class="bg-yellow-100 rounded-full p-3 mr-3"><svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1 min-w-0"><p class="text-sm text-gray-500 truncate">Sedang Berjalan</p><p class="text-xl sm:text-2xl font-bold">${inProgress}</p></div></div>
        <div class="bg-white p-4 rounded-lg shadow flex items-start"><div class="bg-red-100 rounded-full p-3 mr-3"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><div class="flex-1 min-w-0"><p class="text-sm text-gray-500 truncate">Deadline < 7 Hari</p><p class="text-xl sm:text-2xl font-bold">${nearingDeadline}</p></div></div>
    `;
    const sortedByDeadline = projects.filter(p => new Date(p.end_date) >= now).sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
    upcomingDeadlinesList.innerHTML = '';
    if (sortedByDeadline.length === 0) {
        upcomingDeadlinesList.innerHTML = `<p class="text-gray-500 text-center">Tidak ada proyek yang akan datang.</p>`;
    } else {
        sortedByDeadline.slice(0, 5).forEach(project => {
            const remainingDays = Math.ceil((new Date(project.end_date) - now) / (1000 * 60 * 60 * 24));
            const deadlineEl = document.createElement('div');
            deadlineEl.className = 'border-l-4 border-indigo-500 pl-3';
            deadlineEl.innerHTML = `<p class="font-semibold text-gray-800">${project.name}</p><p class="text-sm text-gray-600">${formatDate(project.end_date)} (${remainingDays} hari lagi)</p>`;
            upcomingDeadlinesList.appendChild(deadlineEl);
        });
    }

    // Render Charts
    renderDashboardCharts(projects);
    renderGanttChart(projects); // Panggil fungsi render Gantt Chart
};

// ... (Salin sisa fungsi render lainnya: renderProjects, renderProjectDetails, renderTasks)

// --- FUNGSI CHART ---

const renderGanttChart = (projects) => {
    ganttChartContainer.innerHTML = '<svg id="gantt"></svg>'; // Reset kontainer

    if (!projects || projects.length === 0) {
        ganttChartContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Tidak ada data proyek untuk ditampilkan.</p>';
        return;
    }

    const tasksForGantt = projects.map(project => {
        // Kalkulasi progres sederhana berdasarkan waktu yang telah berlalu
        const today = new Date();
        const startDate = new Date(project.start_date);
        const endDate = new Date(project.end_date);
        const totalDuration = (endDate - startDate);
        const elapsed = (today - startDate);
        let progress = 0;
        if (totalDuration > 0) {
            progress = Math.round((elapsed / totalDuration) * 100);
        }
        if (progress < 0) progress = 0;
        if (progress > 100) progress = 100;

        return {
            id: 'project_' + project.id,
            name: project.name,
            start: project.start_date,
            end: project.end_date,
            progress: progress,
        };
    });

    ganttChartInstance = new Gantt("#gantt", tasksForGantt, {
        view_mode: 'Month', // Opsi: 'Quarter Day', 'Half Day', 'Day', 'Week', 'Month'
        language: 'id', // Coba set bahasa ke Indonesia
        on_click: (task) => {
            const projectId = parseInt(task.id.replace('project_', ''));
            const project = projects.find(p => p.id === projectId);
            if (project) {
                showProjectDetailView(project);
            }
        },
    });
};

// ... (Salin sisa fungsi chart lainnya: renderDashboardCharts, updateDetailCharts)


// --- FUNGSI CRUD, MODAL, EKSPOR, dan INISIALISASI ---
// (Salin semua sisa fungsi dari file app.js Anda yang sebelumnya)
// Pastikan tidak ada duplikasi fungsi.

// Jalankan aplikasi
// initializeApp(); // Pastikan ini ada di akhir file

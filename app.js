<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Manajemen Proyek Relawan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
    <!-- Chart.js and adapter for time series for Gantt Chart -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <!-- Supabase Client -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <!-- SheetJS (XLSX) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: none; }
        .modal-overlay.show { display: block; }
        .modal-content { max-height: 90vh; overflow-y: auto; }
        .kpi-value { font-size: 1.875rem; }
    </style>
</head>
<body>

<!-- Main App Container -->
<div id="app-page" class="min-h-screen">
    
    <!-- Header/Navigation Bar -->
    <header class="bg-indigo-600 shadow-md p-4 text-white">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold">ProjectKu</h1>
            <div class="flex items-center space-x-4">
                <span id="user-email" class="text-sm font-medium">user@projectku.id</span>
                <button id="logout-button" class="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-1 px-3 rounded-full transition duration-150 shadow-md">Logout</button>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        <!-- Project List View (Dashboard) -->
        <div id="projects-list-view" class="space-y-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-extrabold text-gray-900">Dashboard Proyek</h2>
                <button id="add-project-button" class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-150 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                    Tambah Proyek Baru
                </button>
            </div>

            <!-- Dashboard KPIs -->
            <div id="dashboard-container" class="space-y-6">
                <div id="dashboard-kpis" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- KPIs loaded by JS -->
                </div>

                <!-- Dashboard Charts -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-xl">
                        <h3 class="text-xl font-semibold mb-4 text-gray-800">Distribusi Budget Proyek</h3>
                        <div class="h-64"><canvas id="dashboard-budget-chart"></canvas></div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-xl">
                        <h3 class="text-xl font-semibold mb-4 text-gray-800">Status Proyek Aktif</h3>
                        <div class="h-64"><canvas id="dashboard-status-chart"></canvas></div>
                    </div>
                </div>

                <!-- Gantt Chart -->
                <div id="gantt-chart-section" class="bg-white p-6 rounded-lg shadow-xl" style="display: none;">
                    <h3 class="text-xl font-semibold mb-4 text-gray-800">Timeline Proyek (Gantt Chart)</h3>
                    <div class="h-96"><canvas id="gantt-chart"></canvas></div>
                </div>
            </div>

            <!-- Projects List -->
            <div class="mt-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">Daftar Proyek Anda</h3>
                <div id="projects-container" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- Project Cards loaded by JS -->
                </div>
            </div>
        </div>

        <!-- Project Detail View -->
        <div id="project-detail-view" class="hidden space-y-6">
            <button id="back-to-projects" class="flex items-center text-indigo-600 hover:text-indigo-800 font-medium mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                Kembali ke Dashboard
            </button>

            <div class="bg-white p-6 rounded-xl shadow-xl space-y-4">
                <h2 id="detail-project-name" class="text-3xl font-extrabold text-gray-900">Nama Proyek</h2>
                <p id="detail-project-description" class="text-gray-600"></p>
                <div class="flex flex-wrap gap-2">
                    <div id="detail-activity-type" class="flex flex-wrap gap-2 items-center"></div>
                    <span id="detail-venue-category" class="text-sm font-semibold inline-block py-1 px-3 uppercase rounded-full text-purple-600 bg-purple-200"></span>
                </div>
            </div>

            <!-- Details & Budget -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl space-y-4">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Informasi Keuangan & Waktu</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div><p class="text-sm text-gray-500">Budget Awal</p><p id="detail-initial-budget" class="font-bold text-lg text-indigo-600"></p></div>
                        <div><p class="text-sm text-gray-500">Budget Disesuaikan</p><p id="detail-adjusted-budget" class="font-bold text-lg text-indigo-600"></p></div>
                    </div>
                    <div class="flex justify-between items-center border-t pt-4">
                        <div><p class="text-sm text-gray-500">Sisa Budget Saat Ini</p><p id="detail-current-budget" class="font-extrabold text-2xl text-green-600"></p></div>
                        <button id="open-add-budget-button" class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">Tambah Budget</button>
                    </div>
                    <div class="border-t pt-4">
                        <p class="text-sm text-gray-500">Timeline Proyek</p>
                        <p id="detail-timeline" class="font-semibold text-gray-700"></p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-xl space-y-3 flex flex-col justify-between">
                    <button onclick="openProjectModal(currentProject)" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-md">Edit Proyek</button>
                    <button id="export-excel-button" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-md">Export Laporan (Excel)</button>
                    <button id="delete-project-button" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-md">Hapus Proyek</button>
                </div>
            </div>

            <!-- Tasks, Notes, and Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Task List -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl space-y-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800">Daftar Tugas & Anggaran</h3>
                        <button id="add-task-button" class="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition shadow-md flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                            Tambah Tugas
                        </button>
                    </div>
                    <div id="tasks-list" class="space-y-3">
                        <!-- Tasks loaded by JS -->
                    </div>
                </div>

                <!-- Notes & Charts -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Budget Chart -->
                    <div class="bg-white p-6 rounded-xl shadow-xl">
                        <h3 class="text-xl font-semibold mb-4 text-gray-800">Alokasi Budget</h3>
                        <div class="h-48"><canvas id="budget-chart"></canvas></div>
                    </div>
                    
                    <!-- Progress Chart -->
                    <div class="bg-white p-6 rounded-xl shadow-xl">
                        <h3 class="text-xl font-semibold mb-4 text-gray-800">Progress Tugas</h3>
                        <div class="h-48"><canvas id="progress-chart"></canvas></div>
                    </div>
                </div>

                <!-- Project Notes (Full Width) -->
                <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-xl">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Catatan Proyek</h3>
                    <textarea id="project-notes" rows="5" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tulis catatan penting, kontak, atau informasi venue di sini..."></textarea>
                    <button id="save-notes-button" class="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-md">Simpan Catatan</button>
                </div>
            </div>
        </div>

    </main>
</div>

<!-- MODAL: Tambah/Edit Proyek -->
<div id="project-modal" class="modal-overlay">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-content" onclick="event.stopPropagation()">
            <div class="p-6">
                <h3 id="project-modal-title" class="text-2xl font-bold mb-4 text-gray-800">Tambah Proyek Baru</h3>
                <form id="project-form" class="space-y-4">
                    <input type="hidden" id="project-id">
                    <div>
                        <label for="project-name" class="block text-sm font-medium text-gray-700">Nama Proyek</label>
                        <input type="text" id="project-name" required class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                    </div>
                    <div>
                        <label for="project-description" class="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
                        <textarea id="project-description" rows="2" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Aktivitas (Pilih Min. 1)</label>
                        <div id="project-activity-type-checkboxes" class="flex flex-wrap gap-4 p-2 border border-gray-200 rounded-lg">
                            <!-- Checkboxes loaded by JS -->
                        </div>
                    </div>
                    <div>
                        <label for="project-venue-category" class="block text-sm font-medium text-gray-700">Kategori Venue</label>
                        <select id="project-venue-category" required class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-white">
                            <!-- Options loaded by JS -->
                        </select>
                    </div>
                    <div>
                        <label for="project-budget" class="block text-sm font-medium text-gray-700">Budget Awal (Rp)</label>
                        <input type="number" id="project-budget" required min="0" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="project-start-date" class="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                            <input type="date" id="project-start-date" required class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                        </div>
                        <div>
                            <label for="project-end-date" class="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                            <input type="date" id="project-end-date" required class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" id="cancel-project-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition">Batal</button>
                        <button type="submit" class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">Simpan Proyek</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- MODAL: Tambah/Edit Tugas -->
<div id="task-modal" class="modal-overlay">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm modal-content" onclick="event.stopPropagation()">
            <div class="p-6">
                <h3 id="task-modal-title" class="text-2xl font-bold mb-4 text-gray-800">Tambah Tugas Baru</h3>
                <form id="task-form" class="space-y-4">
                    <input type="hidden" id="task-id">
                    <div>
                        <label for="task-name" class="block text-sm font-medium text-gray-700">Nama Tugas</label>
                        <input type="text" id="task-name" required class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                    </div>
                    <div>
                        <label for="task-cost" class="block text-sm font-medium text-gray-700">Biaya (Rp)</label>
                        <input type="number" id="task-cost" required min="0" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                    </div>
                    <div>
                        <label for="task-status" class="block text-sm font-medium text-gray-700">Status</label>
                        <select id="task-status" required class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-white">
                            <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                            <option value="Selesai">Selesai</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" id="cancel-task-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition">Batal</button>
                        <button type="submit" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition">Simpan Tugas</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- MODAL: Tambah Budget -->
<div id="add-budget-modal" class="modal-overlay">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm modal-content" onclick="event.stopPropagation()">
            <div class="p-6">
                <h3 class="text-2xl font-bold mb-4 text-gray-800">Tambah Budget Proyek</h3>
                <form id="add-budget-form" class="space-y-4">
                    <div>
                        <label for="add-budget-amount" class="block text-sm font-medium text-gray-700">Jumlah Penambahan (Rp)</label>
                        <input type="number" id="add-budget-amount" required min="1" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2">
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" id="cancel-add-budget-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition">Batal</button>
                        <button type="submit" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition">Tambahkan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
// Supabase Configuration is kept for data operations
const SUPABASE_URL = 'https://rbmtvddmrwfxndalaecr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXR2ZGRtcndmeG5kYWxhZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1MzYsImV4cCI6MjA3MDQ1NjUzNn0.1vpTH7F514LyyeOJL1fa-SViz-q-bCXryV0hFgeI4a8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STATE APLIKASI ---
let currentUser = null; // Disediakan saat inisialisasi untuk bypass login
let currentProject = null;
const defaultVenueCategories = ["Panti Jompo", "Yayasan Disabilitas", "Yayasan Kanker", "Umum"];
const activityTypes = ["Edukasi", "Eksperimen", "Kreasi", "Games", "Ice Breaking"];
let budgetChartInstance = null;
let progressChartInstance = null;
let dashboardBudgetChartInstance = null;
let dashboardStatusChartInstance = null;
let ganttChartInstance = null; 

// --- ELEMEN DOM (Deklarasi Variabel) ---
let appPage, projectsListView, projectDetailView, dashboardContainer,
    dashboardKPIs,
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

// --- FUNGSI UTILITAS ---
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
const showAppPage = () => {
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
                <div class="flex items-center gap-2"><span class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200">${task.status}</span><button data-task-id="${task.id}" class="edit-task-btn text-blue-600 hover:text-blue-800">Edit</button><button data-task-id="${task.id}" class="delete-task-btn text-red-600 hover:text-red-800">Hapus</button></div>
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
        options: { 
            indexAxis: 'y', 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
                x: { 
                    type: 'time', 
                    time: { unit: 'day', tooltipFormat: 'dd MMM yyyy' },
                    min: new Date(Math.min(...validProjects.map(p => new Date(p.start_date)))),
                } 
            } 
        }
    });
};

const renderDashboardCharts = (projects) => {
    const budgetCtx = document.getElementById('dashboard-budget-chart').getContext('2d');
    if (dashboardBudgetChartInstance) dashboardBudgetChartInstance.destroy();
    dashboardBudgetChartInstance = new Chart(budgetCtx, {
        type: 'bar',
        data: {
            labels: projects.map(p => p.name),
            datasets: [{ label: 'Budget (IDR)', data: projects.map(p => p.current_budget || p.initial_budget), backgroundColor: 'rgba(79, 70, 229, 0.8)' }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: function(value, index, values) { return formatCurrency(value); } } } }
        }
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
            datasets: [{ 
                data: [Math.max(0, remainingBudget), totalCost], // Ensure remaining budget is not negative in chart data
                backgroundColor: ['#4ade80', '#f87171'] 
            }]
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
            datasets: [{ 
                data: [statusCounts['Belum Dikerjakan'] || 0, statusCounts['Sedang Dikerjakan'] || 0, statusCounts['Selesai'] || 0], 
                backgroundColor: ['#9ca3af', '#facc15', '#4ade80'] 
            }]
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
        // Show error message instead of alert
        const errorMessage = document.createElement('p');
        errorMessage.className = 'text-red-500 text-center py-4';
        errorMessage.textContent = 'Gagal memuat proyek. Pastikan Anda memiliki koneksi internet.';
        projectsContainer.innerHTML = '';
        projectsContainer.appendChild(errorMessage);
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
    
    if (selectedActivities.length === 0) {
        alert('Mohon pilih minimal satu Tipe Aktivitas.');
        return;
    }

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

    let error;
    if (isUpdate) {
        ({ error } = await supabaseClient.from('projects').update(projectData).eq('id', projectIdInput.value));
    } else {
        ({ error } = await supabaseClient.from('projects').insert([projectData]));
    }
    
    if (error) {
        console.error('Error saving project:', error.message);
        alert('Gagal menyimpan proyek: ' + error.message);
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
    
    let error;
    if (isUpdate) {
        ({ error } = await supabaseClient.from('tasks').update(taskData).eq('id', taskIdInput.value));
    } else {
        ({ error } = await supabaseClient.from('tasks').insert([taskData]));
    }

    if (error) {
        console.error('Error saving task:', error.message);
        alert('Gagal menyimpan tugas: ' + error.message);
    } else {
        closeTaskModal();
        renderProjectDetails();
    }
};

const handleAddBudgetFormSubmit = async (event) => {
    event.preventDefault();
    const amount = parseFloat(addBudgetAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Jumlah harus lebih dari 0.");
        return;
    }
    
    const newBudget = (currentProject.current_budget || currentProject.initial_budget) + amount;
    const { data, error } = await supabaseClient.from('projects').update({ current_budget: newBudget }).eq('id', currentProject.id).select().single();
    
    if (error) {
        console.error('Error updating budget:', error.message);
        alert('Gagal memperbarui budget: ' + error.message);
    } else {
        currentProject = data;
        renderProjectDetails();
        closeAddBudgetModal();
    }
};

const handleSaveNotes = async () => {
    const { error } = await supabaseClient.from('projects').update({ notes: projectNotes.value }).eq('id', currentProject.id);
    if (error) alert('Gagal menyimpan catatan: ' + error.message);
    else alert('Catatan berhasil disimpan!');
};

const handleDeleteProject = async () => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus proyek "${currentProject.name}"? Semua tugas terkait akan ikut terhapus.`);
    if (!confirmDelete) return;
    
    // Hapus tugas terkait
    const { error: taskError } = await supabaseClient.from('tasks').delete().eq('project_id', currentProject.id);
    if (taskError) {
        alert('Gagal menghapus tugas terkait: ' + taskError.message);
        return;
    }
    
    // Hapus proyek
    const { error: projectError } = await supabaseClient.from('projects').delete().eq('id', currentProject.id);
    
    if (projectError) alert('Gagal menghapus proyek: ' + projectError.message);
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
    const confirmDelete = confirm('Apakah Anda yakin ingin menghapus tugas ini?');
    if (!confirmDelete) return;
    
    const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
    else renderProjectDetails();
};

const openProjectModal = (project = null) => {
    projectForm.reset();

    // Setup Activity Checkboxes
    projectActivityTypeCheckboxes.innerHTML = '';
    activityTypes.forEach(type => {
        projectActivityTypeCheckboxes.innerHTML += `
            <div class="flex items-center">
                <input type="checkbox" id="type-${type.replace(/\s/g, '-')}" value="${type}" name="project-activity-type" class="rounded text-teal-600 focus:ring-teal-500">
                <label for="type-${type.replace(/\s/g, '-')}" class="ml-2 text-sm text-gray-700">${type}</label>
            </div>
        `;
    });
    
    // Setup Venue Select
    projectVenueCategorySelect.innerHTML = '';
    defaultVenueCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        projectVenueCategorySelect.appendChild(option);
    });

    if (project) {
        projectModalTitle.textContent = 'Edit Proyek';
        projectIdInput.value = project.id;
        projectNameInput.value = project.name;
        projectDescriptionInput.value = project.description;
        
        (project.activity_type || []).forEach(type => {
            const cb = document.querySelector(`#type-${type.replace(/\s/g, '-')}`);
            if (cb) cb.checked = true;
        });

        if (projectVenueCategorySelect) {
            projectVenueCategorySelect.value = project.venue_category;
        }
        
        projectBudgetInput.required = false;
        projectBudgetInput.parentElement.classList.add('hidden');
        projectStartDateInput.value = project.start_date;
        projectEndDateInput.value = project.end_date;
    } else {
        projectModalTitle.textContent = 'Tambah Proyek Baru';
        projectIdInput.value = '';
        projectBudgetInput.required = true;
        projectBudgetInput.parentElement.classList.remove('hidden');
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
        taskIdInput.value = '';
        taskStatusInput.value = 'Belum Dikerjakan';
    }
    taskModal.classList.add('show');
};
const closeTaskModal = () => taskModal.classList.remove('show');

const openAddBudgetModal = () => addBudgetModal.classList.add('show');
const closeAddBudgetModal = () => addBudgetModal.classList.remove('show');

const handleExportToExcel = async () => {
    const tasks = await fetchTasks(currentProject.id);
    const totalCost = tasks.reduce((sum, task) => sum + task.cost, 0);
    const remainingBudget = (currentProject.current_budget || currentProject.initial_budget) - totalCost;

    const summaryData = [
        ["LAPORAN RINGKASAN PROYEK", ""],
        ["Nama Proyek", currentProject.name],
        ["Deskripsi", currentProject.description],
        ["Timeline", `${formatDate(currentProject.start_date)} - ${formatDate(currentProject.end_date)}`],
        ["Kategori Venue", currentProject.venue_category],
        ["Tipe Aktivitas", (currentProject.activity_type || []).join(', ')],
        ["", ""],
        ["ANGGARAN", ""],
        ["Budget Awal", currentProject.initial_budget],
        ["Budget Disesuaikan", currentProject.current_budget],
        ["Total Biaya Tugas", totalCost],
        ["Sisa Budget", remainingBudget],
    ];
    
    const taskData = tasks.map(t => ({ 
        "Nama Tugas": t.name, 
        "Biaya (IDR)": t.cost, 
        "Status": t.status 
    }));
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(taskData);
    
    // Styling attempt (basic width)
    const wscols = [ {wch: 25}, {wch: 40} ];
    ws1['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan Proyek");
    XLSX.utils.book_append_sheet(wb, ws2, "Daftar Tugas");
    
    XLSX.writeFile(wb, `Laporan_${currentProject.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    alert("Laporan berhasil diexport!");
};

const initializeApp = () => {
    // Inisialisasi Elemen DOM
    appPage = document.getElementById('app-page');
    projectsListView = document.getElementById('projects-list-view');
    projectDetailView = document.getElementById('project-detail-view');
    dashboardContainer = document.getElementById('dashboard-container');
    dashboardKPIs = document.getElementById('dashboard-kpis');
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

    // --- SETUP BYPASS LOGIN ---
    // Mengatur user secara manual untuk langsung masuk ke dashboard
    currentUser = { id: 'guest-user-123', email: 'user@projectku.id' };
    userEmailEl.textContent = currentUser.email;
    // --- END BYPASS ---

    // Event Listeners
    // Logout hanya me-reload halaman karena tidak ada sesi Supabase yang dikelola di sini
    logoutButton.addEventListener('click', () => location.reload()); 
    addProjectButton.addEventListener('click', () => openProjectModal());
    projectModal.addEventListener('click', closeProjectModal);
    cancelProjectModal.addEventListener('click', closeProjectModal);
    projectForm.addEventListener('submit', handleProjectFormSubmit);
    
    backToProjectsButton.addEventListener('click', showProjectsListView);
    deleteProjectButton.addEventListener('click', handleDeleteProject);
    saveNotesButton.addEventListener('click', handleSaveNotes);
    exportExcelButton.addEventListener('click', handleExportToExcel);
    
    addTaskButton.addEventListener('click', () => openTaskModal());
    taskModal.addEventListener('click', closeTaskModal);
    cancelTaskModal.addEventListener('click', closeTaskModal);
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    
    openAddBudgetButton.addEventListener('click', openAddBudgetModal);
    addBudgetModal.addEventListener('click', closeAddBudgetModal);
    cancelAddBudgetModal.addEventListener('click', closeAddBudgetModal);
    addBudgetForm.addEventListener('submit', handleAddBudgetFormSubmit);
    
    // Cegah penutupan modal saat mengklik di dalam konten modal
    document.querySelector('#project-modal .modal-content').addEventListener('click', e => e.stopPropagation());
    document.querySelector('#task-modal .modal-content').addEventListener('click', e => e.stopPropagation());
    document.querySelector('#add-budget-modal .modal-content').addEventListener('click', e => e.stopPropagation());

    showAppPage();
};

document.addEventListener('DOMContentLoaded', initializeApp);
</script>

</body>
</html>

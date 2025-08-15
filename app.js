// --- KONFIGURASI & INISIALISASI ---
const SUPABASE_URL = 'https://rbmtvddmrwfxndalaecr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXR2ZGRtcndmeG5kYWxhZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1MzYsImV4cCI6MjA3MDQ1NjUzNn0.1vpTH7F514LyyeOJL1fa-SViz-q-bCXryV0hFgeI4a8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STATE APLIKASI ---
let currentUser = null;
let currentProject = null;
let isRegisterMode = false;
let budgetChartInstance = null;
let progressChartInstance = null;
let dashboardBudgetChartInstance = null;
let dashboardStatusChartInstance = null;
let ganttChartInstance = null; 

// --- ELEMEN DOM (Deklarasi Variabel) ---
let authPage, appPage, projectsListView, projectDetailView, dashboardContainer,
    dashboardKPIs, upcomingDeadlinesList, authForm, authTitle, authButton,
    switchAuthModeLink, authPromptText, authError, emailInput, passwordInput,
    userEmailEl, logoutButton, projectsContainer, addProjectButton,
    backToProjectsButton, detailProjectName, detailProjectDescription,
    detailInitialBudget, detailAdjustedBudget, detailCurrentBudget, detailTimeline,
    projectNotes, saveNotesButton, deleteProjectButton, exportExcelButton,
    tasksList, addTaskButton, projectModal, projectModalTitle, projectForm,
    cancelProjectModal, projectIdInput, projectNameInput, projectDescriptionInput,
    projectBudgetInput, projectStartDateInput, projectEndDateInput, taskModal,
    taskModalTitle, taskForm, cancelTaskModal, taskIdInput, taskNameInput,
    taskCostInput, taskStatusInput, addBudgetModal, addBudgetForm,
    cancelAddBudgetModal, addBudgetAmountInput, openAddBudgetButton, ganttChartSection;


// --- FUNGSI UTILITAS & AUTENTIKASI ---
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

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
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        currentUser = null;
        currentProject = null;
        showAuthPage();
    }
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

// Render Dasbor Utama
const renderDashboard = (projects) => {
    if (projects.length === 0) {
        dashboardContainer.classList.add('hidden');
        return;
    }
    dashboardContainer.classList.remove('hidden');
    
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

    renderDashboardCharts(projects);
    renderGanttChart(projects);
};

const renderProjects = (projects) => {
    renderDashboard(projects);
    projectsContainer.innerHTML = '';
    if (projects.length === 0) {
        projectsContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center">Anda belum memiliki proyek. Silakan tambahkan proyek baru.</p>`;
        return;
    }
    
    projects.forEach(project => {
        const remainingDays = Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer';
        card.innerHTML = `
            <h3 class="font-bold text-lg text-gray-800">${project.name}</h3>
            <p class="text-gray-600 text-sm mt-1 mb-3 truncate">${project.description || 'Tidak ada deskripsi'}</p>
            <div class="text-sm text-gray-500">
                <p><strong>Budget:</strong> ${formatCurrency(project.current_budget || project.initial_budget)}</p>
                <p><strong>Deadline:</strong> ${formatDate(project.end_date)} (${remainingDays >= 0 ? `${remainingDays} hari lagi` : 'Terlambat'})</p>
            </div>
        `;
        card.addEventListener('click', () => showProjectDetailView(project));
        projectsContainer.appendChild(card);
    });
};

const renderProjectDetails = async () => {
    if (!currentProject) return;
    detailProjectName.textContent = currentProject.name;
    detailProjectDescription.textContent = currentProject.description || '';
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
            let statusColor = 'bg-gray-400';
            if (task.status === 'Sedang Dikerjakan') statusColor = 'bg-yellow-500';
            if (task.status === 'Selesai') statusColor = 'bg-green-500';
            taskEl.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" data-task-id="${task.id}" class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3 task-checkbox" ${task.status === 'Selesai' ? 'checked' : ''}>
                    <div>
                        <p class="font-medium ${task.status === 'Selesai' ? 'line-through text-gray-500' : ''}">${task.name}</p>
                        <p class="text-sm text-gray-500">${formatCurrency(task.cost)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white ${statusColor}">${task.status}</span>
                    <button data-task-id="${task.id}" class="edit-task-btn text-blue-600 hover:text-blue-800">Edit</button>
                    <button data-task-id="${task.id}" class="delete-task-btn text-red-600 hover:text-red-800">Hapus</button>
                </div>
            `;
            tasksList.appendChild(taskEl);
        });
    } else {
        tasksList.innerHTML = `<p class="text-gray-500 text-center p-4">Belum ada tugas untuk proyek ini.</p>`;
    }
    const currentBudget = currentProject.current_budget || currentProject.initial_budget;
    detailCurrentBudget.textContent = formatCurrency(currentBudget - totalCost);
    document.querySelectorAll('.task-checkbox').forEach(cb => cb.addEventListener('change', handleTaskCheckboxChange));
    document.querySelectorAll('.edit-task-btn').forEach(btn => btn.addEventListener('click', handleEditTaskClick));
    document.querySelectorAll('.delete-task-btn').forEach(btn => btn.addEventListener('click', handleDeleteTaskClick));
};

// --- FUNGSI CHART ---

const renderGanttChart = (projects) => {
    const ganttContainer = document.querySelector("#gantt");
    if (ganttContainer) {
        ganttContainer.innerHTML = ""; // Kosongkan kontainer sebelum render
    }

    // PERBAIKAN: Filter proyek untuk memastikan hanya yang memiliki tanggal valid yang dirender
    const validProjects = projects.filter(p => p.start_date && p.end_date && typeof p.start_date === 'string' && typeof p.end_date === 'string');

    if (!validProjects || validProjects.length === 0) {
        if(ganttChartSection) ganttChartSection.style.display = 'none';
        return;
    }
    if(ganttChartSection) ganttChartSection.style.display = 'block';

    const tasksForGantt = validProjects.map(project => {
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

    if (tasksForGantt.length > 0) {
        try {
            ganttChartInstance = new Gantt("#gantt", tasksForGantt, {
                view_mode: 'Month',
                on_click: (task) => {
                    const projectId = parseInt(task.id.replace('project_', ''));
                    const project = projects.find(p => p.id === projectId);
                    if (project) {
                        showProjectDetailView(project);
                    }
                },
            });
        } catch(e) {
            console.error("Gantt Chart Error:", e);
            if(ganttChartSection) ganttChartSection.style.display = 'none';
        }
    }
};

const renderDashboardCharts = (projects) => {
    const budgetCtx = document.getElementById('dashboard-budget-chart').getContext('2d');
    if (dashboardBudgetChartInstance) dashboardBudgetChartInstance.destroy();
    dashboardBudgetChartInstance = new Chart(budgetCtx, {
        type: 'bar',
        data: {
            labels: projects.map(p => p.name),
            datasets: [{
                label: 'Budget Proyek',
                data: projects.map(p => p.current_budget || p.initial_budget),
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value) } } },
            plugins: { tooltip: { callbacks: { label: (context) => formatCurrency(context.raw) } } }
        }
    });
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const statusCounts = { onTrack: 0, atRisk: 0, overdue: 0 };
    projects.forEach(p => {
        const endDate = new Date(p.end_date);
        if (endDate < now) {
            statusCounts.overdue++;
        } else if (endDate <= oneWeekFromNow) {
            statusCounts.atRisk++;
        } else {
            statusCounts.onTrack++;
        }
    });
    const statusCtx = document.getElementById('dashboard-status-chart').getContext('2d');
    if (dashboardStatusChartInstance) dashboardStatusChartInstance.destroy();
    dashboardStatusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Tepat Waktu', 'Berisiko (Deadline < 7 hari)', 'Terlambat'],
            datasets: [{
                data: [statusCounts.onTrack, statusCounts.atRisk, statusCounts.overdue],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

const updateDetailCharts = (tasks) => {
    const totalCost = tasks.reduce((sum, task) => sum + task.cost, 0);
    const currentBudget = currentProject.current_budget || currentProject.initial_budget;
    const remainingBudget = currentBudget - totalCost;
    const budgetCtx = document.getElementById('budget-chart').getContext('2d');
    if (budgetChartInstance) budgetChartInstance.destroy();
    budgetChartInstance = new Chart(budgetCtx, {
        type: 'doughnut',
        data: {
            labels: ['Sisa Budget', 'Biaya Terpakai'],
            datasets: [{
                data: [remainingBudget, totalCost],
                backgroundColor: ['#4ade80', '#f87171'],
                borderColor: ['#22c55e', '#ef4444'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});
    const progressCtx = document.getElementById('progress-chart').getContext('2d');
    if (progressChartInstance) progressChartInstance.destroy();
    progressChartInstance = new Chart(progressCtx, {
        type: 'pie',
        data: {
            labels: ['Belum Dikerjakan', 'Sedang Dikerjakan', 'Selesai'],
            datasets: [{
                data: [
                    statusCounts['Belum Dikerjakan'] || 0,
                    statusCounts['Sedang Dikerjakan'] || 0,
                    statusCounts['Selesai'] || 0
                ],
                backgroundColor: ['#9ca3af', '#facc15', '#4ade80'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

// --- FUNGSI CRUD, MODAL, EKSPOR, dan INISIALISASI ---
const fetchProjects = async () => {
    if (!currentUser) return;
    const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching projects:', error.message);
        return;
    }
    renderProjects(data);
};

const fetchTasks = async (projectId) => {
    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
    if (error) {
        console.error('Error fetching tasks:', error.message);
        return [];
    }
    return data;
};

const handleProjectFormSubmit = async (event) => {
    event.preventDefault();
    const isUpdate = !!projectIdInput.value;
    const initialBudget = parseFloat(projectBudgetInput.value);
    const projectData = {
        name: projectNameInput.value,
        description: projectDescriptionInput.value,
        start_date: projectStartDateInput.value,
        end_date: projectEndDateInput.value,
        user_id: currentUser.id
    };
    if (!isUpdate) {
        projectData.initial_budget = initialBudget;
        projectData.current_budget = initialBudget;
    }
    let response;
    if (isUpdate) {
        response = await supabaseClient
            .from('projects')
            .update(projectData)
            .eq('id', projectIdInput.value);
    } else {
        response = await supabaseClient
            .from('projects')
            .insert([projectData]);
    }
    if (response.error) {
        console.error('Error saving project:', response.error.message);
        alert('Gagal menyimpan proyek: ' + response.error.message);
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
        cost: taskCostInput.value,
        status: taskStatusInput.value,
        project_id: currentProject.id,
        user_id: currentUser.id
    };
    let response;
    if (isUpdate) {
        response = await supabaseClient
            .from('tasks')
            .update(taskData)
            .eq('id', taskIdInput.value);
    } else {
        response = await supabaseClient
            .from('tasks')
            .insert([taskData]);
    }
    if (response.error) {
        console.error('Error saving task:', response.error.message);
        alert('Gagal menyimpan tugas: ' + response.error.message);
    } else {
        closeTaskModal();
        renderProjectDetails();
    }
};

const handleAddBudgetFormSubmit = async (event) => {
    event.preventDefault();
    const amount = parseFloat(addBudgetAmountInput.value);
    if (isNaN(amount)) {
        alert('Masukkan jumlah yang valid.');
        return;
    }
    const newBudget = (currentProject.current_budget || currentProject.initial_budget) + amount;
    const { data, error } = await supabaseClient
        .from('projects')
        .update({ current_budget: newBudget })
        .eq('id', currentProject.id)
        .select()
        .single();
    if (error) {
        console.error('Error updating budget:', error.message);
        alert('Gagal memperbarui budget.');
    } else {
        currentProject = data;
        renderProjectDetails();
        closeAddBudgetModal();
    }
};

const handleSaveNotes = async () => {
    const { error } = await supabaseClient
        .from('projects')
        .update({ notes: projectNotes.value })
        .eq('id', currentProject.id);
    if (error) {
        alert('Gagal menyimpan catatan: ' + error.message);
    } else {
        alert('Catatan berhasil disimpan!');
        currentProject.notes = projectNotes.value;
    }
};

const handleDeleteProject = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus proyek "${currentProject.name}"? Semua tugas di dalamnya juga akan terhapus.`)) {
        return;
    }
    const { error } = await supabaseClient
        .from('projects')
        .delete()
        .eq('id', currentProject.id);
    if (error) {
        console.error('Error deleting project:', error.message);
        alert('Gagal menghapus proyek.');
    } else {
        showProjectsListView();
    }
};

const handleTaskCheckboxChange = async (event) => {
    const taskId = event.target.dataset.taskId;
    const newStatus = event.target.checked ? 'Selesai' : 'Belum Dikerjakan';
    const { error } = await supabaseClient
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
    if (error) {
        console.error('Error updating task status:', error.message);
    } else {
        renderProjectDetails();
    }
};

const handleDeleteTaskClick = async (event) => {
    const taskId = event.target.dataset.taskId;
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', taskId);
    if (error) {
        console.error('Error deleting task:', error.message);
    } else {
        renderProjectDetails();
    }
};

const openProjectModal = (project = null) => {
    projectForm.reset();
    if (project) {
        projectModalTitle.textContent = 'Edit Proyek';
        projectIdInput.value = project.id;
        projectNameInput.value = project.name;
        projectDescriptionInput.value = project.description;
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
        taskIdInput.value = '';
    }
    taskModal.classList.add('show');
};

const closeTaskModal = () => taskModal.classList.remove('show');

const openAddBudgetModal = () => {
    addBudgetForm.reset();
    addBudgetModal.classList.add('show');
};

const closeAddBudgetModal = () => addBudgetModal.classList.remove('show');

const handleEditTaskClick = async (event) => {
    const taskId = event.target.dataset.taskId;
    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
    if (error) {
        console.error('Error fetching task for edit:', error.message);
    } else {
        openTaskModal(data);
    }
};

const handleExportToExcel = async () => {
    const tasks = await fetchTasks(currentProject.id);
    const totalCost = tasks.reduce((sum, task) => sum + task.cost, 0);
    const currentBudget = currentProject.current_budget || currentProject.initial_budget;
    const projectSummary = [
        { A: "Nama Proyek", B: currentProject.name }, { A: "Deskripsi", B: currentProject.description },
        { A: "Timeline", B: `${formatDate(currentProject.start_date)} - ${formatDate(currentProject.end_date)}` },
        { A: "Budget Awal", B: formatCurrency(currentProject.initial_budget) }, { A: "Budget Disesuaikan", B: formatCurrency(currentBudget) },
        { A: "Total Biaya Tugas", B: formatCurrency(totalCost) }, { A: "Sisa Budget", B: formatCurrency(currentBudget - totalCost) },
        { A: "Catatan", B: currentProject.notes },
    ];
    const ws1 = XLSX.utils.json_to_sheet(projectSummary, { header: ["A", "B"], skipHeader: true });
    const taskData = tasks.map(task => ({
        "Nama Tugas": task.name, "Biaya": task.cost, "Status": task.status, "Dibuat Pada": formatDate(task.created_at)
    }));
    const ws2 = XLSX.utils.json_to_sheet(taskData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan Proyek");
    XLSX.utils.book_append_sheet(wb, ws2, "Daftar Tugas");
    XLSX.writeFile(wb, `${currentProject.name.replace(/ /g,"_")}_Report.xlsx`);
};

const initializeApp = () => {
    // --- Inisialisasi Elemen DOM ---
    authPage = document.getElementById('auth-page');
    appPage = document.getElementById('app-page');
    projectsListView = document.getElementById('projects-list-view');
    projectDetailView = document.getElementById('project-detail-view');
    dashboardContainer = document.getElementById('dashboard-container');
    dashboardKPIs = document.getElementById('dashboard-kpis');
    upcomingDeadlinesList = document.getElementById('upcoming-deadlines-list');
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

    // --- Event Listeners ---
    if(switchAuthModeLink) switchAuthModeLink.addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(); });
    if(authForm) authForm.addEventListener('submit', handleAuthSubmit);
    if(logoutButton) logoutButton.addEventListener('click', handleLogout);
    if(backToProjectsButton) backToProjectsButton.addEventListener('click', showProjectsListView);
    if(addProjectButton) addProjectButton.addEventListener('click', () => openProjectModal());
    if(projectForm) projectForm.addEventListener('submit', handleProjectFormSubmit);
    if(cancelProjectModal) cancelProjectModal.addEventListener('click', closeProjectModal);
    if(deleteProjectButton) deleteProjectButton.addEventListener('click', handleDeleteProject);
    if(saveNotesButton) saveNotesButton.addEventListener('click', handleSaveNotes);
    if(exportExcelButton) exportExcelButton.addEventListener('click', handleExportToExcel);
    if(addTaskButton) addTaskButton.addEventListener('click', () => openTaskModal());
    if(taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);
    if(cancelTaskModal) cancelTaskModal.addEventListener('click', closeTaskModal);
    if(openAddBudgetButton) openAddBudgetButton.addEventListener('click', openAddBudgetModal);
    if(addBudgetForm) addBudgetForm.addEventListener('submit', handleAddBudgetFormSubmit);
    if(cancelAddBudgetModal) cancelAddBudgetModal.addEventListener('click', closeAddBudgetModal);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
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

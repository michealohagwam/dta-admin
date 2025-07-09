// Admin script.js
const API_BASE_URL = 'https://dta-backend-clean.onrender.com';
const socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling']
});

// Utility function for fetch with retry
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Get admin token from local storage
function getAdminToken() {
    return localStorage.getItem('adminToken');
}

// Initialize WebSocket for real-time updates
function initWebSocket() {
    socket.on('connect', () => console.log('Connected to WebSocket'));
    socket.on('dashboard-update', (data) => {
        const statsElement = document.getElementById('dashboard-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <p>Total Users: ${data.totalUsers}</p>
                <p>Total Earnings: ₦${data.totalEarnings.toLocaleString('en-NG')}</p>
                <p>Total Tasks: ${data.totalTasks}</p>
                <p>Pending Withdrawals: ${data.totalWithdrawals}</p>
            `;
        }
    });
    socket.on('notification', (data) => {
        const notification = document.getElementById('admin-notification');
        if (notification) {
            notification.textContent = data.message;
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 5000);
        }
    });
}

// Initialize sidebar toggle
function initSidebarToggle() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }
}

// Initialize user dropdown
function initUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.addEventListener('click', () => {
            const dropdown = userDropdown.querySelector('.user-dropdown');
            if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
}

// Update admin info in header and sidebar
async function updateAdminInfo() {
    const token = getAdminToken();
    if (!token) return;
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const admin = await response.json();
            const headerAdminName = document.getElementById('header-admin-name');
            const sidebarAdminName = document.getElementById('sidebar-admin-name');
            const sidebarAdminAvatar = document.getElementById('sidebar-admin-avatar');
            if (headerAdminName) headerAdminName.textContent = `Welcome, ${admin.email}`;
            if (sidebarAdminName) sidebarAdminName.textContent = admin.email;
            if (sidebarAdminAvatar) sidebarAdminAvatar.src = admin.avatar || 'https://via.placeholder.com/50';
        } else {
            console.error('Failed to fetch admin info:', response.statusText);
        }
    } catch (err) {
        console.error('Error fetching admin info:', err);
    }
}

// Admin Login Page
async function initAdminLoginPage() {
    const loginForm = document.getElementById('admin-login-form');
    const notification = document.getElementById('admin-login-notification');
    if (loginForm && notification) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button');
            submitBtn.disabled = true;
            const email = document.getElementById('admin-email')?.value.trim();
            const password = document.getElementById('admin-password')?.value.trim();
            if (!email || !password) {
                notification.textContent = 'Please fill all required fields';
                notification.classList.add('error');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    submitBtn.disabled = false;
                }, 3000);
                return;
            }
            try {
                const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('adminToken', data.token);
                    notification.textContent = 'Login successful!';
                    notification.classList.add('success');
                    notification.style.display = 'block';
                    setTimeout(() => window.location.href = '/admin/dashboard.html', 2000);
                } else {
                    notification.textContent = data.message || 'Invalid email orspecifically for the dta-admin frontend or password';
                    notification.classList.add('error');
                    notification.style.display = 'block';
                    setTimeout(() => {
                        notification.style.display = 'none';
                        submitBtn.disabled = false;
                    }, 3000);
                }
            } catch (err) {
                console.error('Admin login error:', err);
                notification.textContent = 'Server error. Please try again.';
                notification.classList.add('error');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }
}

// Dashboard Page
async function fetchDashboardStats() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        if (response.ok) {
            const data = await response.json();
            const statsElement = document.getElementById('dashboard-stats');
            if (statsElement) {
                statsElement.innerHTML = `
                    <p>Total Users: ${data.totalUsers}</p>
                    <p>Total Earnings: ₦${data.totalEarnings.toLocaleString('en-NG')}</p>
                    <p>Total Tasks: ${data.totalTasks}</p>
                    <p>Pending Withdrawals: ${data.totalWithdrawals}</p>
                `;
            }
        } else {
            console.error('Failed to fetch dashboard stats:', await response.text());
        }
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

function renderTaskChart() {
    const ctx = document.getElementById('taskChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Task Completions',
                    data: [50, 60, 70, 80, 90, 100, 110],
                    borderColor: '#3498db',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

function initAdminDashboardPage() {
    fetchDashboardStats();
    renderTaskChart();
}

// Users Page
async function fetchUsers() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching users:', err);
        return [];
    }
}

function renderUsers(users) {
    const tableBody = document.getElementById('users-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.level}</td>
                <td>${user.status}</td>
                <td>
                    <select class="form-select status-select" onchange="updateUserStatus('${user._id}', this.value)">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        <option value="verified" ${user.status === 'verified' ? 'selected' : ''}>Verified</option>
                    </select>
                    <button class="btn btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
                    <button class="btn btn-primary" onclick="resetPassword('${user._id}')">Reset Password</button>
                    ${user.status === 'pending' ? `<button class="btn btn-success" onclick="confirmEmail('${user._id}')">Confirm Email</button>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function filterUsers() {
    const searchName = document.getElementById('search-name')?.value.toLowerCase() || '';
    const filterLevel = document.getElementById('filter-level')?.value || '';
    const filterStatus = document.getElementById('filter-status')?.value || '';
    const users = await fetchUsers();
    const filteredUsers = users.filter(user => {
        const matchesName = user.name.toLowerCase().includes(searchName);
        const matchesLevel = filterLevel ? user.level === parseInt(filterLevel) : true;
        const matchesStatus = filterStatus ? user.status === filterStatus : true;
        return matchesName && matchesLevel && matchesStatus;
    });
    renderUsers(filteredUsers);
}

async function updateUserStatus(userId, status) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({ status })
        });
        const notification = document.getElementById('user-notification');
        if (response.ok) {
            notification.textContent = `User status updated to ${status}`;
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            filterUsers();
        } else {
            throw new Error('Failed to update user status');
        }
    } catch (err) {
        const notification = document.getElementById('user-notification');
        notification.textContent = 'Error updating user status';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            const notification = document.getElementById('user-notification');
            if (response.ok) {
                notification.textContent = 'User deleted';
                notification.classList.add('success');
                notification.style.display = 'block';
                setTimeout(() => notification.style.display = 'none', 3000);
                filterUsers();
            } else {
                throw new Error('Failed to delete user');
            }
        } catch (err) {
            const notification = document.getElementById('user-notification');
            notification.textContent = 'Error deleting user';
            notification.classList.add('error');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        }
    }
}

async function resetPassword(id) {
    if (confirm('Reset password for this user? A new password will be sent to their email.')) {
        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/${id}/reset-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            const notification = document.getElementById('user-notification');
            if (response.ok) {
                notification.textContent = 'Password reset email sent';
                notification.classList.add('success');
                notification.style.display = 'block';
                setTimeout(() => notification.style.display = 'none', 3000);
            } else {
                throw new Error('Failed to reset password');
            }
        } catch (err) {
            const notification = document.getElementById('user-notification');
            notification.textContent = 'Error resetting password';
            notification.classList.add('error');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        }
    }
}

async function confirmEmail(id) {
    if (confirm('Confirm email for this user?')) {
        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/${id}/confirm-email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            const notification = document.getElementById('user-notification') || document.getElementById('confirmation-notification');
            if (response.ok) {
                notification.textContent = 'Email confirmed';
                notification.classList.add('success');
                notification.style.display = 'block';
                setTimeout(() => notification.style.display = 'none', 3000);
                filterUsers();
                fetchPendingConfirmations();
            } else {
                throw new Error('Failed to confirm email');
            }
        } catch (err) {
            const notification = document.getElementById('user-notification') || document.getElementById('confirmation-notification');
            notification.textContent = 'Error confirming email';
            notification.classList.add('error');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        }
    }
}

async function createUser() {
    const name = document.getElementById('create-user-name')?.value.trim();
    const username = document.getElementById('create-user-username')?.value.trim();
    const email = document.getElementById('create-user-email')?.value.trim();
    const phone = document.getElementById('create-user-phone')?.value.trim();
    const password = document.getElementById('create-user-password')?.value.trim();
    const referralCode = document.getElementById('create-user-referral')?.value.trim();
    const level = parseInt(document.getElementById('create-user-level')?.value);
    const amount = level ? 15000 * Math.pow(2, level - 1) : 0;
    const notification = document.getElementById('user-notification');

    if (!name || !username || !email || !phone || !password || !level) {
        notification.textContent = 'Please fill in all required fields';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        notification.textContent = 'Please enter a valid email address';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({ name, username, email, phone, password, referralCode, level, amount })
        });
        const data = await response.json();
        if (response.ok) {
            notification.textContent = `User created successfully! Awaiting email confirmation and payment of ₦${amount.toLocaleString('en-NG')} for Level ${level}`;
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            filterUsers();
        } else {
            throw new Error(data.message || 'Failed to create user');
        }
    } catch (err) {
        notification.textContent = err.message || 'Error creating user';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

function initUsersPage() {
    fetchUsers().then(renderUsers);
    document.getElementById('search-name')?.addEventListener('input', filterUsers);
    document.getElementById('filter-level')?.addEventListener('change', filterUsers);
    document.getElementById('filter-status')?.addEventListener('change', filterUsers);
    const createUserForm = document.getElementById('create-user-form');
    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = createUserForm.querySelector('button');
            submitBtn.disabled = true;
            await createUser();
            submitBtn.disabled = false;
            createUserForm.reset();
        });
    }
}

// Tasks Page
async function fetchTasks() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/tasks`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching tasks:', err);
        return [];
    }
}

function renderTasks(tasks) {
    const tableBody = document.getElementById('tasks-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.title}</td>
                <td><a href="${task.link}" target="_blank">View</a></td>
                <td>${task.completions}</td>
                <td>${task.status}</td>
                <td>
                    <button class="btn ${task.status === 'active' ? 'btn-danger' : 'btn-success'}" 
                            onclick="${task.status === 'active' ? `archiveTask('${task._id}')` : `unarchiveTask('${task._id}')`}">
                        ${task.status === 'active' ? 'Archive' : 'Unarchive'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function validateTaskForm() {
    const title = document.getElementById('task-title')?.value.trim();
    const link = document.getElementById('task-link')?.value.trim();
    const notification = document.getElementById('task-notification');
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    if (!title || title.length < 3) {
        notification.textContent = 'Task title must be at least 3 characters long';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        return false;
    }

    if (!link || !urlRegex.test(link)) {
        notification.textContent = 'Please enter a valid URL';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        return false;
    }

    return true;
}

async function archiveTask(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/tasks/${id}/archive`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('task-notification');
        if (response.ok) {
            notification.textContent = 'Task archived successfully';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 2000);
            fetchTasks().then(renderTasks);
        } else {
            throw new Error('Failed to archive task');
        }
    } catch (err) {
        const notification = document.getElementById('task-notification');
        notification.textContent = 'Error archiving task';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function unarchiveTask(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/tasks/${id}/unarchive`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('task-notification');
        if (response.ok) {
            notification.textContent = 'Task unarchived successfully';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 2000);
            fetchTasks().then(renderTasks);
        } else {
            throw new Error('Failed to unarchive task');
        }
    } catch (err) {
        const notification = document.getElementById('task-notification');
        notification.textContent = 'Error unarchiving task';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            const notification = document.getElementById('task-notification');
            if (response.ok) {
                notification.textContent = 'Task deleted successfully';
                notification.classList.add('success');
                notification.style.display = 'block';
                setTimeout(() => notification.style.display = 'none', 2000);
                fetchTasks().then(renderTasks);
            } else {
                throw new Error('Failed to delete task');
            }
        } catch (err) {
            const notification = document.getElementById('task-notification');
            notification.textContent = 'Error deleting task';
            notification.classList.add('error');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        }
    }
}

function initTasksPage() {
    fetchTasks().then(renderTasks);
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = taskForm.querySelector('button');
            submitBtn.disabled = true;
            if (!validateTaskForm()) {
                submitBtn.disabled = false;
                return;
            }
            const title = document.getElementById('task-title').value.trim();
            const link = document.getElementById('task-link').value.trim();
            try {
                const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify({ title, link, status: 'active' })
                });
                if (response.ok) {
                    const notification = document.getElementById('task-notification');
                    notification.textContent = 'Task added successfully';
                    notification.classList.add('success');
                    notification.style.display = 'block';
                    taskForm.reset();
                    fetchTasks().then(renderTasks);
                    setTimeout(() => notification.style.display = 'none', 3000);
                    submitBtn.disabled = false;
                } else {
                    throw new Error('Failed to add task');
                }
            } catch (err) {
                const notification = document.getElementById('task-notification');
                notification.textContent = 'Error adding task';
                notification.classList.add('error');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }
}

// Withdrawals Page
async function fetchWithdrawals() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/withdrawals`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching withdrawals:', err);
        return [];
    }
}

function renderWithdrawals(withdrawals) {
    const tableBody = document.getElementById('withdrawals-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        withdrawals.forEach((w) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${w.userId}</td>
                <td>₦${w.amount.toLocaleString('en-NG')}</td>
                <td>${new Date(w.date).toLocaleDateString()}</td>
                <td>${w.status}</td>
                <td>
                    <button class="btn btn-primary" onclick="viewUserDetails('${w.userId}')">View Details</button>
                    ${
                        w.status === 'pending'
                            ? `
                            <button class="btn btn-success" onclick="approveWithdrawal('${w._id}')">Approve</button>
                            <button class="btn btn-danger" onclick="declineWithdrawal('${w._id}')">Decline</button>
                            `
                            : w.status === 'approved'
                            ? `
                            <button class="btn btn-success" onclick="markAsPaid('${w._id}')">Complete</button>
                            `
                            : ''
                    }
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function approveWithdrawal(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/withdrawals/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('withdrawal-notification');
        if (response.ok) {
            notification.textContent = 'Withdrawal approved';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            fetchWithdrawals().then(renderWithdrawals);
        } else {
            throw new Error('Failed to approve withdrawal');
        }
    } catch (err) {
        const notification = document.getElementById('withdrawal-notification');
        notification.textContent = 'Error approving withdrawal';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function declineWithdrawal(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/withdrawals/${id}/decline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('withdrawal-notification');
        if (response.ok) {
            notification.textContent = 'Withdrawal declined';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            fetchWithdrawals().then(renderWithdrawals);
        } else {
            throw new Error('Failed to decline withdrawal');
        }
    } catch (err) {
        const notification = document.getElementById('withdrawal-notification');
        notification.textContent = 'Error declining withdrawal';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function markAsPaid(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/withdrawals/${id}/paid`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('withdrawal-notification');
        if (response.ok) {
            notification.textContent = 'Withdrawal marked as paid';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            fetchWithdrawals().then(renderWithdrawals);
        } else {
            throw new Error('Failed to mark as paid');
        }
    } catch (err) {
        const notification = document.getElementById('withdrawal-notification');
        notification.textContent = 'Error marking withdrawal as paid';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function viewUserDetails(userId) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('notification');
        if (response.ok) {
            const user = await response.json();
            document.getElementById('modal-user-name').textContent = user.name;
            document.getElementById('modal-user-invites').textContent = user.invites || 0;
            document.getElementById('modal-user-tasks').textContent = user.tasksCompleted || 0;
            document.getElementById('user-details-modal').style.display = 'flex';
        } else {
            throw new Error('Failed to fetch user details');
        }
    } catch (err) {
        notification.textContent = 'Error fetching user details';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

function closeModal() {
    const modal = document.getElementById('user-details-modal');
    if (modal) modal.style.display = 'none';
}

async function exportToCSV() {
    const withdrawals = await fetchWithdrawals();
    const csvData = withdrawals.map(w => ({
        User: w.userId,
        Amount: w.amount,
        Date: new Date(w.date).toLocaleDateString(),
        Status: w.status
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'withdrawals.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function initWithdrawalsPage() {
    fetchWithdrawals().then(renderWithdrawals);
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
}

// Referrals Page
async function fetchReferrals() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/referrals`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching referrals:', err);
        return [];
    }
}

function renderReferrals(referrals) {
    const tableBody = document.getElementById('referrals-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        referrals.forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${r.user}</td>
                <td>${r.referralCount}</td>
                <td>₦${r.bonusPaid.toLocaleString('en-NG')}</td>
                <td>${r.isSuspicious ? 'Yes' : 'No'}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function filterReferrals() {
    const searchUser = document.getElementById('search-user')?.value.toLowerCase() || '';
    const referrals = await fetchReferrals();
    const filteredReferrals = referrals.filter(r => r.user.toLowerCase().includes(searchUser));
    renderReferrals(filteredReferrals);
}

function initReferralsPage() {
    fetchReferrals().then(renderReferrals);
    document.getElementById('search-user')?.addEventListener('input', filterReferrals);
}

// Upgrades Page
async function fetchUpgrades() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/upgrades`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching upgrades:', err);
        return [];
    }
}

function renderUpgrades(upgrades) {
    const tableBody = document.getElementById('upgrades-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        upgrades.forEach(u => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${u.user}</td>
                <td>${u.level}</td>
                <td>₦${u.amount.toLocaleString('en-NG')}</td>
                <td>${u.status}</td>
                <td>
                    ${u.status === 'pending' ? `
                        <button class="btn btn-success" onclick="approveUpgrade('${u._id}')">Approve</button>
                        <button class="btn btn-danger" onclick="rejectUpgrade('${u._id}')">Reject</button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function approveUpgrade(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/upgrades/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('upgrade-notification');
        if (response.ok) {
            notification.textContent = 'Upgrade approved';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            fetchUpgrades().then(renderUpgrades);
        } else {
            throw new Error('Failed to approve upgrade');
        }
    } catch (err) {
        const notification = document.getElementById('upgrade-notification');
        notification.textContent = 'Error approving upgrade';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

async function rejectUpgrade(id) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/upgrades/${id}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('upgrade-notification');
        if (response.ok) {
            notification.textContent = 'Upgrade rejected';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
            fetchUpgrades().then(renderUpgrades);
        } else {
            throw new Error('Failed to reject upgrade');
        }
    } catch (err) {
        const notification = document.getElementById('upgrade-notification');
        notification.textContent = 'Error rejecting upgrade';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

function initUpgradesPage() {
    fetchUpgrades().then(renderUpgrades);
}

// Admins Page
async function fetchAdmins() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/admins`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching admins:', err);
        return [];
    }
}

function renderAdmins(admins) {
    const tableBody = document.getElementById('admins-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        admins.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.email}</td>
                <td>${admin.contact || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function initAdminsPage() {
    fetchAdmins().then(renderAdmins);
    const inviteForm = document.getElementById('invite-form');
    if (inviteForm) {
        inviteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = inviteForm.querySelector('button');
            submitBtn.disabled = true;
            const email = document.getElementById('invite-email')?.value.trim();
            if (!email) {
                const notification = document.getElementById('invite-notification');
                notification.textContent = 'Please enter an email address';
                notification.classList.add('error');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    submitBtn.disabled = false;
                }, 3000);
                return;
            }
            try {
                const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/invite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify({ email })
                });
                const notification = document.getElementById('invite-notification');
                if (response.ok) {
                    notification.textContent = 'Invite sent';
                    notification.classList.add('success');
                    notification.style.display = 'block';
                    inviteForm.reset();
                    fetchAdmins().then(renderAdmins);
                    setTimeout(() => {
                        notification.style.display = 'none';
                        submitBtn.disabled = false;
                    }, 3000);
                } else {
                    throw new Error('Failed to send invite');
                }
            } catch (err) {
                const notification = document.getElementById('invite-notification');
                notification.textContent = 'Error sending invite';
                notification.classList.add('error');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }
}

// Profile Page
function validateProfileForm() {
    const email = document.getElementById('admin-email')?.value.trim();
    const contact = document.getElementById('admin-contact')?.value.trim();
    const notification = document.getElementById('profile-notification');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
        notification.textContent = 'Please enter a valid email address';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        return false;
    }

    if (!contact || contact.length < 10) {
        notification.textContent = 'Contact number must be at least 10 digits';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        return false;
    }

    return true;
}

function initProfilePage() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = profileForm.querySelector('button');
            submitBtn.disabled = true;
            if (!validateProfileForm()) {
                submitBtn.disabled = false;
                return;
            }
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value.trim();
            const contact = document.getElementById('admin-contact').value.trim();
            try {
                const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify({ email, password, contact })
                });
                const notification = document.getElementById('profile-notification');
                if (response.ok) {
                    notification.textContent = 'Profile updated';
                    notification.classList.add('success');
                    notification.style.display = 'block';
                    profileForm.reset();
                    setTimeout(() => {
                        notification.style.display = 'none';
                        submitBtn.disabled = false;
                    }, 3000);
                    updateAdminInfo();
                } else {
                    throw new Error('Failed to update profile');
                }
            } catch (err) {
                const notification = document.getElementById('profile-notification');
                notification.textContent = 'Error updating profile';
                notification.classList.add('error');
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }
}

// Emails Page
async function fetchEmailLogs() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/emails`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching email logs:', err);
        return [];
    }
}

function renderEmailLogs(logs) {
    const tableBody = document.getElementById('emails-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.type}</td>
                <td>${log.recipient}</td>
                <td>${new Date(log.timestamp).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function filterEmails() {
    const filterType = document.getElementById('filter-email-type')?.value || '';
    const logs = await fetchEmailLogs();
    const filteredLogs = filterType ? logs.filter(log => log.type === filterType) : logs;
    renderEmailLogs(filteredLogs);
}

function initEmailsPage() {
    fetchEmailLogs().then(renderEmailLogs);
    document.getElementById('filter-email-type')?.addEventListener('change', filterEmails);
}

// Notifications Page
async function sendEmail() {
    try {
        const message = document.getElementById('notification-message')?.value.trim() || 'New task available!';
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({ message })
        });
        const notification = document.getElementById('notification-notification');
        if (response.ok) {
            notification.textContent = 'Notification sent successfully';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        } else {
            throw new Error('Failed to send notification');
        }
    } catch (err) {
        const notification = document.getElementById('notification-notification');
        notification.textContent = 'Error sending notification';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

function initNotificationsPage() {
    const notificationForm = document.getElementById('notification-form');
    if (notificationForm) {
        notificationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = notificationForm.querySelector('button');
            submitBtn.disabled = true;
            await sendEmail();
            submitBtn.disabled = false;
            notificationForm.reset();
        });
    }
}

// Pending Confirmations Page
async function fetchPendingConfirmations() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/pending-confirmations`, {
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('Error fetching pending confirmations:', err);
        return [];
    }
}

function renderPendingConfirmations(users) {
    const tableBody = document.getElementById('confirmations-table');
    if (tableBody) {
        tableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${new Date(user.registrationDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-success" onclick="resendConfirmation('${user._id}')"><i class="fas fa-envelope"></i> Resend Code</button>
                    <button class="btn btn-primary" onclick="confirmEmail('${user._id}')"><i class="fas fa-check"></i> Confirm Email</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function resendConfirmation(userId) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/admin/users/${userId}/resend-confirmation`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAdminToken()}` }
        });
        const notification = document.getElementById('confirmation-notification');
        if (response.ok) {
            notification.textContent = 'Confirmation code resent successfully';
            notification.classList.add('success');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        } else {
            notification.textContent = 'Error resending confirmation code';
            notification.classList.add('error');
            notification.style.display = 'block';
            setTimeout(() => notification.style.display = 'none', 3000);
        }
    } catch (err) {
        const notification = document.getElementById('confirmation-notification');
        notification.textContent = 'Error resending confirmation';
        notification.classList.add('error');
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

function initPendingConfirmationsPage() {
    fetchPendingConfirmations().then(renderPendingConfirmations);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');
    if (['dashboard', 'users', 'tasks', 'withdrawals', 'referrals', 'upgrades', 'admins', 'profile', 'emails', 'notifications', 'pending-confirmations'].includes(page)) {
        initSidebarToggle();
        initUserDropdown();
        updateAdminInfo();
        initWebSocket();
    }
    const pageInit = {
        'admin-login': initAdminLoginPage,
        'dashboard': initAdminDashboardPage,
        'users': initUsersPage,
        'tasks': initTasksPage,
        'withdrawals': initWithdrawalsPage,
        'referrals': initReferralsPage,
        'upgrades': initUpgradesPage,
        'admins': initAdminsPage,
        'profile': initProfilePage,
        'emails': initEmailsPage,
        'notifications': initNotificationsPage,
        'pending-confirmations': initPendingConfirmationsPage
    };
    if (pageInit[page]) pageInit[page]();
});
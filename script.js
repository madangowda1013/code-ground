// ==================== DATA MANAGEMENT ====================
function generateUserId(email) {
    return 'user_' + (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

class FinanceManager {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.budgets = {};
        this.goals = [];
        this.goalProgress = [];
        this.loadUserData();
    }

    loadUserData() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.transactions = JSON.parse(localStorage.getItem(`transactions_${this.currentUser.id}`)) || [];
            this.budgets = JSON.parse(localStorage.getItem(`budgets_${this.currentUser.id}`)) || {};
            this.goals = JSON.parse(localStorage.getItem(`goals_${this.currentUser.id}`)) || [];
            this.goalProgress = JSON.parse(localStorage.getItem(`goalProgress_${this.currentUser.id}`)) || [];
        }
    }

    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem(`transactions_${this.currentUser.id}`, JSON.stringify(this.transactions));
            localStorage.setItem(`budgets_${this.currentUser.id}`, JSON.stringify(this.budgets));
            localStorage.setItem(`goals_${this.currentUser.id}`, JSON.stringify(this.goals));
            localStorage.setItem(`goalProgress_${this.currentUser.id}`, JSON.stringify(this.goalProgress));
        }
    }

    createUser(name, email, password) {
        const userId = generateUserId(email) || 'user_' + Date.now();
        this.currentUser = { id: userId, name, email, password, createdAt: new Date() };
        localStorage.setItem(`user_${userId}`, JSON.stringify(this.currentUser));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.transactions = [];
        this.budgets = {};
        this.goals = [];
        this.saveUserData();
        return this.currentUser;
    }

    loginUser(email, password) {
        const userId = generateUserId(email) || 'user_' + Date.now();
        const stored = localStorage.getItem(`user_${userId}`);
        if (stored) {
            const user = JSON.parse(stored);
            // Demo mode: accept any entered password and login the user by email
            this.currentUser = user;
        } else {
            this.currentUser = { id: userId, name: email.split('@')[0] || 'Guest', email, password, createdAt: new Date() };
            localStorage.setItem(`user_${userId}`, JSON.stringify(this.currentUser));
        }
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.loadUserData();
        return this.currentUser;
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.transactions = [];
        this.budgets = {};
        this.goals = [];
    }

    addTransaction(type, category, amount, date, description) {
        const transaction = {
            id: 'txn_' + Date.now(),
            type,
            category,
            amount: parseFloat(amount),
            date,
            description,
            createdAt: new Date().toISOString()
        };
        this.transactions.push(transaction);
        this.saveUserData();
        return transaction;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveUserData();
    }

    editTransaction(id, updates) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            Object.assign(transaction, updates);
            this.saveUserData();
        }
        return transaction;
    }

    setBudget(category, amount) {
        this.budgets[category] = parseFloat(amount);
        this.saveUserData();
    }

    deleteBudget(category) {
        delete this.budgets[category];
        this.saveUserData();
    }

    addGoal(name, target, date) {
        const goal = {
            id: 'goal_' + Date.now(),
            name,
            target: parseFloat(target),
            targetDate: date,
            current: 0,
            createdAt: new Date().toISOString()
        };
        this.goals.push(goal);
        this.saveUserData();
        return goal;
    }

    addGoalProgress(goalId, amount, date, note = '') {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return null;

        const progressEntry = {
            id: 'goalprog_' + Date.now(),
            goalId,
            amount: parseFloat(amount),
            date,
            note,
            createdAt: new Date().toISOString()
        };

        this.goalProgress.push(progressEntry);
        goal.current = parseFloat((goal.current || 0) + parseFloat(amount));
        this.saveUserData();
        return progressEntry;
    }

    updateGoal(id, updates) {
        const goal = this.goals.find(g => g.id === id);
        if (goal) {
            Object.assign(goal, updates);
            this.saveUserData();
        }
        return goal;
    }

    getGoalProgress(goalId) {
        return this.goalProgress
            .filter(progress => progress.goalId === goalId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    deleteGoal(id) {
        this.goals = this.goals.filter(g => g.id !== id);
        this.goalProgress = this.goalProgress.filter(progress => progress.goalId !== id);
        this.saveUserData();
    }

    getCurrentMonthTransactions() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return this.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
    }

    getTotalBalance() {
        return this.transactions.reduce((sum, t) => {
            return t.type === 'income' ? sum + t.amount : sum - t.amount;
        }, 0);
    }

    getTotalGoalSavings() {
        return this.goals.reduce((sum, goal) => sum + (parseFloat(goal.current) || 0), 0);
    }

    getMonthlyIncome() {
        return this.getCurrentMonthTransactions()
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getMonthlyExpenses() {
        return this.getCurrentMonthTransactions()
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getExpensesByCategory() {
        const expenses = this.getCurrentMonthTransactions().filter(t => t.type === 'expense');
        const byCategory = {};
        expenses.forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });
        return byCategory;
    }
}

// ==================== CONSTANTS ====================
const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Books', 'Shopping', 'Fees', 'Entertainment', 'Other'];
const INCOME_CATEGORIES = ['Pocket Money', 'Part-time Job', 'Scholarship', 'Freelance', 'Other'];

const FINANCIAL_TIPS = [
    {
        title: '50/30/20 Budget Rule',
        icon: '📊',
        description: 'Allocate 50% of income to needs, 30% to wants, and 20% to savings. This simple rule helps maintain balance.'
    },
    {
        title: 'Emergency Fund',
        icon: '🆘',
        description: 'Build an emergency fund covering 3-6 months of expenses. Start with even small amounts like $50/month.'
    },
    {
        title: 'Track Every Rupee',
        icon: '📝',
        description: 'Write down every expense for a month to understand where your money goes. Awareness is the first step.'
    },
    {
        title: 'Use the 30-Day Rule',
        icon: '📅',
        description: 'Wait 30 days before making non-essential purchases. Most impulse cravings fade within a month.'
    },
    {
        title: 'Automate Your Savings',
        icon: '⚙️',
        description: 'Set up automatic transfers to savings account on payday. "Pay yourself first" before spending.'
    },
    {
        title: 'Avoid Student Debt',
        icon: '🎓',
        description: 'Research scholarships and part-time jobs before taking loans. Every rupee borrowed costs more later.'
    },
    {
        title: 'Use Student Discounts',
        icon: '🎉',
        description: 'Leverage student discounts at restaurants, movies, and software services. They add up quickly!'
    },
    {
        title: 'Track Subscriptions',
        icon: '📱',
        description: 'Review all subscriptions monthly. Cancel unused ones. Many students pay for apps they never use.'
    },
    {
        title: 'Meal Planning Saves Money',
        icon: '🍽️',
        description: 'Plan meals and cook at home 5 days a week. Eating out daily can cost 5x more than home-cooked food.'
    },
    {
        title: 'Build Financial Literacy',
        icon: '📚',
        description: 'Read about investing, taxes, and personal finance. Knowledge is your best financial tool as a student.'
    }
];

// ==================== APP STATE ====================
const app = {
    manager: new FinanceManager(),
    currentEditingId: null,
    charts: {}
};

// ==================== UTILITY FUNCTIONS ====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const messageEl = document.getElementById('notificationMessage');
    
    // Only show if message is not empty
    if (!message || message.trim() === '') {
        toast.classList.remove('show');
        return;
    }
    
    messageEl.textContent = message;
    toast.className = `notification-toast show ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        budget: 'Budget Planner',
        goals: 'Savings Goals',
        analytics: 'Analytics',
        tips: 'Financial Tips'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || 'Dashboard';

    // Reinitialize charts if on analytics page
    if (pageId === 'analytics') {
        setTimeout(() => initializeAnalyticsCharts(), 100);
    }

    // Close sidebar on mobile
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ==================== NOTIFICATION HANDLERS ====================
function setupNotificationHandlers() {
    const toast = document.getElementById('notificationToast');
    const closeBtn = document.getElementById('closeNotification');
    
    if (!toast || !closeBtn) return;
    
    // Close button handler
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toast.classList.remove('show');
    });
    
    // Close on click outside (optional)
    toast.addEventListener('click', (e) => {
        if (e.target === toast) {
            toast.classList.remove('show');
        }
    });
}

// ==================== AUTH FUNCTIONS ====================
function setupAuthHandlers() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authToggleBtns = document.querySelectorAll('.auth-btn');

    authToggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            
            authToggleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });

            if (mode === 'login') {
                loginForm.classList.add('active');
            } else {
                signupForm.classList.add('active');
            }
        });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const user = app.manager.loginUser(email, password);
        if (!user) {
            showNotification('Incorrect password. Please try again.', 'error');
            return;
        }
        showAuthSuccess();
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;

        if (password !== confirm) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        app.manager.createUser(name, email, password);
        showAuthSuccess();
    });
}

function showAuthSuccess() {
    const authModal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');

    authModal.classList.remove('active');
    mainApp.classList.remove('hidden');

    document.getElementById('userName').textContent = app.manager.currentUser.name;

    loadDashboard();
    loadTransactions();
    loadBudgets();
    loadGoals();
    loadFinancialTips(); // Fix: tips page was empty after login
    showPage('dashboard');
}

function logout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
        app.manager.logout();
        location.reload();
    }
}

// ==================== DASHBOARD ====================
function loadDashboard() {
    updateDashboardStats();
    updateRecentTransactions();
    initializeExpenseChart();
}

function updateDashboardStats() {
    const balance = app.manager.getTotalBalance();
    const income = app.manager.getMonthlyIncome();
    const expenses = app.manager.getMonthlyExpenses();
    const savings = app.manager.getTotalGoalSavings();

    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
    document.getElementById('totalSavings').textContent = formatCurrency(savings);
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recent = app.manager.transactions.slice(-5).reverse();

    if (recent.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No transactions yet. Start by adding income or expenses!</p>';
        return;
    }

    container.innerHTML = recent.map(t => `
        <div class="transaction-item">
            <div class="transaction-details">
                <div style="font-weight: 600;">${t.category}</div>
                <div class="transaction-date">${formatDate(t.date)}</div>
            </div>
            <div class="amount ${t.type}" style="font-weight: 600;">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </div>
        </div>
    `).join('');
}

function initializeExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const expensesByCategory = app.manager.getExpensesByCategory();
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    if (app.charts.expenseChart) {
        app.charts.expenseChart.destroy();
    }

    app.charts.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No expenses'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: [
                    '#6366f1',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981',
                    '#06b6d4',
                    '#8b5cf6',
                    '#f97316'
                ],
                borderColor: 'var(--card-bg)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--text-primary)',
                        font: { family: "'Segoe UI', sans-serif" }
                    }
                }
            }
        }
    });
}

// ==================== TRANSACTIONS ====================
function setupTransactionHandlers() {
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const openAddTransactionBtn = document.getElementById('openAddTransactionBtn');
    const transactionForm = document.getElementById('transactionForm');
    const transactionTypeSelect = document.getElementById('transactionType');
    const closeTransactionModal = document.getElementById('closeTransactionModal');
    const cancelTransactionBtn = document.getElementById('cancelTransactionBtn');

    // Fix: wire up the dashboard "Add Goal" quick-action button
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            showPage('goals');
            document.getElementById('openGoalFormBtn').click();
        });
    }

    [addExpenseBtn, addIncomeBtn, openAddTransactionBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            app.currentEditingId = null;
            transactionForm.reset();
            document.getElementById('transactionModalTitle').textContent = 'Add Transaction';
            
            if (btn === addExpenseBtn) {
                transactionTypeSelect.value = 'expense';
            } else if (btn === addIncomeBtn) {
                transactionTypeSelect.value = 'income';
            }
            
            updateTransactionCategoryOptions();
            document.getElementById('transactionDate').valueAsDate = new Date();
            openModal('transactionModal');
        });
    });

    transactionTypeSelect.addEventListener('change', updateTransactionCategoryOptions);

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('transactionType').value;
        const category = document.getElementById('transactionCategory').value;
        const amount = document.getElementById('transactionAmount').value;
        const date = document.getElementById('transactionDate').value;
        const description = document.getElementById('transactionDescription').value;

        if (app.currentEditingId) {
            app.manager.editTransaction(app.currentEditingId, {
                type, category, amount: parseFloat(amount), date, description
            });
            showNotification('Transaction updated successfully!', 'success');
        } else {
            app.manager.addTransaction(type, category, amount, date, description);
            showNotification('Transaction added successfully!', 'success');
        }

        closeModal('transactionModal');
        loadTransactions();
        updateDashboardStats();
        updateRecentTransactions();
    });

    closeTransactionModal.addEventListener('click', () => closeModal('transactionModal'));
    cancelTransactionBtn.addEventListener('click', () => closeModal('transactionModal'));
}

function updateTransactionCategoryOptions() {
    const type = document.getElementById('transactionType').value;
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const select = document.getElementById('transactionCategory');

    select.innerHTML = categories.map(cat => `
        <option value="${cat}">${cat}</option>
    `).join('');
}

function loadTransactions() {
    const tbody = document.getElementById('transactionsBody');
    const transactions = app.manager.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No transactions yet</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td><span class="type-badge ${t.type}">${t.type.toUpperCase()}</span></td>
            <td>${t.category}</td>
            <td>${t.description || '-'}</td>
            <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editTransaction('${t.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteTransaction('${t.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editTransaction(id) {
    const transaction = app.manager.transactions.find(t => t.id === id);
    if (!transaction) return;

    app.currentEditingId = id;
    document.getElementById('transactionType').value = transaction.type;
    updateTransactionCategoryOptions();
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDate').value = transaction.date;
    document.getElementById('transactionDescription').value = transaction.description || '';
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
    
    openModal('transactionModal');
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        app.manager.deleteTransaction(id);
        loadTransactions();
        updateDashboardStats();
        updateRecentTransactions();
        showNotification('Transaction deleted successfully!', 'success');
    }
}

function setupTransactionFilters() {
    const filterTypeSelect = document.getElementById('filterType');
    const filterCategorySelect = document.getElementById('filterCategory');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const transactionSearch = document.getElementById('transactionSearch');

    // Update category options
    const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
    filterCategorySelect.innerHTML = '<option value="all">All Categories</option>' +
        allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    applyFiltersBtn.addEventListener('click', applyTransactionFilters);
    transactionSearch.addEventListener('keyup', applyTransactionFilters);
    filterTypeSelect.addEventListener('change', applyTransactionFilters);
    filterCategorySelect.addEventListener('change', applyTransactionFilters);
}

function applyTransactionFilters() {
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();

    let filtered = app.manager.transactions;

    if (filterType !== 'all') {
        filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'all') {
        filtered = filtered.filter(t => t.category === filterCategory);
    }

    if (startDate) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
    }

    if (endDate) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
    }

    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.description?.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    const tbody = document.getElementById('transactionsBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td><span class="type-badge ${t.type}">${t.type.toUpperCase()}</span></td>
            <td>${t.category}</td>
            <td>${t.description || '-'}</td>
            <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editTransaction('${t.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteTransaction('${t.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function downloadReport() {
    const filtered = app.manager.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = `
        <html>
        <head>
            <title>Expense Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #6366f1; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .total { background-color: #f0f0f0; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>📊 Expense Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>User: ${app.manager.currentUser.name}</p>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(t => `
                        <tr>
                            <td>${formatDate(t.date)}</td>
                            <td>${t.type.toUpperCase()}</td>
                            <td>${t.category}</td>
                            <td>${t.description || '-'}</td>
                            <td>${formatCurrency(t.amount)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total">
                        <td colspan="4">Total Income</td>
                        <td>${formatCurrency(app.manager.getMonthlyIncome())}</td>
                    </tr>
                    <tr class="total">
                        <td colspan="4">Total Expenses</td>
                        <td>${formatCurrency(app.manager.getMonthlyExpenses())}</td>
                    </tr>
                    <tr class="total">
                        <td colspan="4">Savings</td>
                        <td>${formatCurrency(app.manager.getMonthlyIncome() - app.manager.getMonthlyExpenses())}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `;

    const element = document.createElement('div');
    element.innerHTML = html;
    const opt = {
        margin: 10,
        filename: 'expense-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
    showNotification('Report downloaded successfully!', 'success');
}

// ==================== BUDGET PLANNER ====================
function setupBudgetHandlers() {
    const openBudgetBtn = document.getElementById('openBudgetBtn');
    const budgetForm = document.getElementById('budgetForm');
    const closeBudgetModal = document.getElementById('closeBudgetModal');
    const cancelBudgetBtn = document.getElementById('cancelBudgetBtn');

    // Initialize category select
    const budgetCategory = document.getElementById('budgetCategory');
    budgetCategory.innerHTML = EXPENSE_CATEGORIES.map(cat => `
        <option value="${cat}">${cat}</option>
    `).join('');

    openBudgetBtn.addEventListener('click', () => {
        budgetForm.reset();
        openModal('budgetModal');
    });

    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('budgetCategory').value;
        const amount = document.getElementById('budgetAmount').value;

        app.manager.setBudget(category, amount);
        showNotification('Budget set successfully!', 'success');
        closeModal('budgetModal');
        loadBudgets();
    });

    closeBudgetModal.addEventListener('click', () => closeModal('budgetModal'));
    cancelBudgetBtn.addEventListener('click', () => closeModal('budgetModal'));
}

function loadBudgets() {
    const container = document.getElementById('budgetList');
    const budgets = app.manager.budgets;
    const expensesByCategory = app.manager.getExpensesByCategory();

    if (Object.keys(budgets).length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No budgets set yet. Create one to track spending!</p>';
        return;
    }

    container.innerHTML = Object.entries(budgets).map(([category, limit]) => {
        const spent = expensesByCategory[category] || 0;
        const percentage = (spent / limit) * 100;
        let statusClass = '';
        
        if (percentage >= 100) {
            statusClass = 'danger';
        } else if (percentage >= 80) {
            statusClass = 'warning';
        }

        return `
            <div class="budget-item">
                <div class="budget-info">
                    <div class="budget-name">${category}</div>
                    <div class="budget-bar">
                        <div class="budget-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                        ${formatCurrency(spent)} / ${formatCurrency(limit)}
                    </div>
                </div>
                <div class="budget-amount">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">${Math.round(percentage)}%</div>
                    <button class="btn-icon budget-delete" onclick="deleteBudget('${category}')" title="Delete budget">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Check for overspending
    Object.entries(budgets).forEach(([category, limit]) => {
        const spent = expensesByCategory[category] || 0;
        if (spent > limit) {
            showNotification(`⚠️ Budget alert: ${category} spending (${formatCurrency(spent)}) exceeds limit (${formatCurrency(limit)})`, 'warning');
        }
    });
}

function deleteBudget(category) {
    if (confirm(`Delete budget for ${category}?`)) {
        app.manager.deleteBudget(category);
        loadBudgets();
        showNotification('Budget deleted!', 'success');
    }
}

// ==================== SAVINGS GOALS ====================
function setupGoalHandlers() {
    const openGoalFormBtn = document.getElementById('openGoalFormBtn');
    const goalForm = document.getElementById('goalForm');
    const closeGoalModal = document.getElementById('closeGoalModal');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');

    openGoalFormBtn.addEventListener('click', () => {
        app.currentEditingId = null;
        goalForm.reset();
        document.getElementById('goalDate').min = new Date().toISOString().split('T')[0];
        document.getElementById('goalModalTitle').textContent = 'Create Savings Goal';
        openModal('goalModal');
    });

    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('goalName').value;
        const target = document.getElementById('goalTarget').value;
        const date = document.getElementById('goalDate').value;

        if (app.currentEditingId) {
            app.manager.updateGoal(app.currentEditingId, {
                name,
                target: parseFloat(target),
                targetDate: date
            });
            showNotification('Goal details updated!', 'success');
        } else {
            app.manager.addGoal(name, target, date);
            showNotification('Goal created!', 'success');
        }

        closeModal('goalModal');
        loadGoals();
    });

    closeGoalModal.addEventListener('click', () => closeModal('goalModal'));
    cancelGoalBtn.addEventListener('click', () => closeModal('goalModal'));
}

function setupGoalProgressHandlers() {
    const progressForm = document.getElementById('goalProgressForm');
    const closeGoalProgressModal = document.getElementById('closeGoalProgressModal');
    const cancelGoalProgressBtn = document.getElementById('cancelGoalProgressBtn');

    progressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalId = document.getElementById('goalProgressId').value;
        const amount = document.getElementById('goalProgressAmount').value;
        const date = document.getElementById('goalProgressDate').value;
        const note = document.getElementById('goalProgressNote').value;

        app.manager.addGoalProgress(goalId, amount, date, note);
        showNotification('Progress saved!', 'success');
        closeModal('goalProgressModal');
        loadGoals();
    });

    closeGoalProgressModal.addEventListener('click', () => closeModal('goalProgressModal'));
    cancelGoalProgressBtn.addEventListener('click', () => closeModal('goalProgressModal'));
}

function loadGoals() {
    const container = document.getElementById('goalsList');
    const goals = app.manager.goals;

    if (goals.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No savings goals yet. Start saving towards your dreams!</p>';
        return;
    }

    container.innerHTML = goals.map(goal => {
        const percentage = goal.target ? (goal.current / goal.target) * 100 : 0;
        const remaining = goal.target - goal.current;
        const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));

        const goalProgress = app.manager.getGoalProgress(goal.id);
        const latestProgress = goalProgress[0];
        const progressNote = latestProgress && latestProgress.note ? `
                <div class="goal-note">Last note: ${latestProgress.note}</div>
                <div class="goal-note-date">${formatDate(latestProgress.date)}</div>
        ` : '';

        return `
            <div class="goal-card">
                <div class="goal-header">
                    <div>
                        <div class="goal-name">🎯 ${goal.name}</div>
                        <div class="goal-deadline">Target: ${formatDate(goal.targetDate)} (${daysLeft} days left)</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="goal-amounts">
                    <div>Saved: ${formatCurrency(goal.current)}</div>
                    <div>Target: ${formatCurrency(goal.target)}</div>
                    <div>Remaining: ${formatCurrency(remaining)}</div>
                </div>
                ${progressNote}
                <div style="font-weight: 600; margin-bottom: 1rem; color: var(--primary-color);">${Math.round(percentage)}% Complete</div>
                <div class="goal-actions">
                    <button class="btn btn-secondary" onclick="editGoal('${goal.id}')">Edit Goal</button>
                    <button class="btn btn-secondary" onclick="openGoalProgress('${goal.id}')">Update Progress</button>
                    <button class="btn btn-secondary" onclick="deleteGoal('${goal.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function editGoal(id) {
    const goal = app.manager.goals.find(g => g.id === id);
    if (!goal) return;

    app.currentEditingId = id;
    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalTarget').value = goal.target;
    document.getElementById('goalDate').value = goal.targetDate;
    document.getElementById('goalModalTitle').textContent = 'Edit Savings Goal';
    
    openModal('goalModal');
}

function openGoalProgress(goalId) {
    const goal = app.manager.goals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('goalProgressId').value = goalId;
    document.getElementById('goalProgressAmount').value = '';
    document.getElementById('goalProgressDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('goalProgressNote').value = '';
    document.getElementById('goalProgressTitle').textContent = `Update Progress for ${goal.name}`;
    openModal('goalProgressModal');
}

function deleteGoal(id) {
    if (confirm('Delete this goal?')) {
        app.manager.deleteGoal(id);
        loadGoals();
        showNotification('Goal deleted!', 'success');
    }
}

// ==================== ANALYTICS ====================
function initializeAnalyticsCharts() {
    const expensesByCategory = app.manager.getExpensesByCategory();
    const allTransactions = app.manager.transactions;

    // Chart 1: Expense Distribution (Pie)
    const expenseCtx = document.getElementById('expenseDistributionChart');
    if (expenseCtx && expenseCtx.parentElement.offsetParent !== null) {
        if (app.charts.expenseDistribution) {
            app.charts.expenseDistribution.destroy();
        }

        app.charts.expenseDistribution = new Chart(expenseCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(expensesByCategory).length > 0 ? Object.keys(expensesByCategory) : ['No data'],
                datasets: [{
                    data: Object.values(expensesByCategory).length > 0 ? Object.values(expensesByCategory) : [1],
                    backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f97316']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: 'var(--text-primary)' } }
                }
            }
        });
    }

    // Chart 2: Income vs Expenses (Bar)
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    if (incomeExpenseCtx && incomeExpenseCtx.parentElement.offsetParent !== null) {
        if (app.charts.incomeExpense) {
            app.charts.incomeExpense.destroy();
        }

        const months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            months.push(month);

            const monthTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
            });

            incomeData.push(monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0));
            expenseData.push(monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
        }

        app.charts.incomeExpense = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#10b981'
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#ef4444'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        ticks: { color: 'var(--text-primary)' },
                        grid: { color: 'var(--border)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-primary)' },
                        grid: { color: 'var(--border)' }
                    }
                },
                plugins: {
                    legend: { labels: { color: 'var(--text-primary)' } }
                }
            }
        });
    }

    // Chart 3: Monthly Trends (Line)
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx && trendsCtx.parentElement.offsetParent !== null) {
        if (app.charts.trends) {
            app.charts.trends.destroy();
        }

        const months = [];
        const savingsData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            months.push(month);

            const monthTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
            });

            const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            savingsData.push(income - expenses);
        }

        app.charts.trends = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Savings',
                    data: savingsData,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        ticks: { color: 'var(--text-primary)' },
                        grid: { color: 'var(--border)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-primary)' },
                        grid: { color: 'var(--border)' }
                    }
                },
                plugins: {
                    legend: { labels: { color: 'var(--text-primary)' } }
                }
            }
        });
    }

    // Chart 4: Spending by Category (Bar)
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx && categoryCtx.parentElement.offsetParent !== null) {
        if (app.charts.category) {
            app.charts.category.destroy();
        }

        app.charts.category = new Chart(categoryCtx, {
            type: 'bar', // Fix: removed deprecated duplicate 'horizontalBar' type
            data: {
                labels: Object.keys(expensesByCategory).length > 0 ? Object.keys(expensesByCategory) : ['No data'],
                datasets: [{
                    label: 'Amount Spent',
                    data: Object.values(expensesByCategory).length > 0 ? Object.values(expensesByCategory) : [1],
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks: { color: 'var(--text-primary)' },
                        grid: { color: 'var(--border)' }
                    },
                    y: {
                        ticks: { color: 'var(--text-primary)' },
                        grid: { color: 'var(--border)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ==================== FINANCIAL TIPS ====================
function loadFinancialTips() {
    const container = document.querySelector('.tips-grid');
    
    container.innerHTML = FINANCIAL_TIPS.map(tip => `
        <div class="tip-card">
            <div class="tip-icon">${tip.icon}</div>
            <h3>${tip.title}</h3>
            <p>${tip.description}</p>
        </div>
    `).join('');
}

// ==================== THEME TOGGLE ====================
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('.icon').textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
    });
}

// ==================== SIDEBAR MOBILE TOGGLE ====================
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!mobileMenuToggle) return;

    // Toggle menu on button click
    mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    });

    // Close menu when overlay is clicked
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });

    // Close menu when a nav item is clicked
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });

    // Handle window resize - close menu if resizing above 1024px
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    });

    // Prevent body scroll when sidebar is open
    const updateBodyScroll = () => {
        if (window.innerWidth <= 1024 && sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    mobileMenuToggle.addEventListener('click', updateBodyScroll);
    sidebarOverlay.addEventListener('click', updateBodyScroll);

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ==================== RESPONSIVE VIEWPORT SETUP ====================
function setupResponsiveViewport() {
    // Fix viewport meta tag if missing
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5.0';
        document.head.appendChild(viewport);
    } else {
        // Update existing viewport if it's too restrictive
        if (!viewport.content.includes('initial-scale')) {
            viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5.0';
        }
    }

    // Disable zoom on double-tap on inputs to prevent layout shift
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            document.querySelector('.sidebar')?.classList.remove('active');
            // Trigger chart redraws
            if (app.charts.expenseDistribution) {
                Object.values(app.charts).forEach(chart => {
                    if (chart && chart.resize) {
                        chart.resize();
                    }
                });
            }
        }, 100);
    });
}

// ==================== TOUCH-FRIENDLY ENHANCEMENTS ====================
function setupTouchEnhancements() {
    // Add active state feedback to buttons on mobile
    if (window.matchMedia('(hover: none)').matches) {
        document.querySelectorAll('button, .btn, a').forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.opacity = '0.8';
            });
            element.addEventListener('touchend', () => {
                element.style.opacity = '1';
            });
        });
    }

    // Prevent 300ms tap delay
    document.addEventListener('touchstart', function() {}, { passive: true });
}

// ==================== NOTIFICATION HANDLERS ====================
function setupNotificationHandlers() {
    const closeNotification = document.getElementById('closeNotification');
    closeNotification.addEventListener('click', () => {
        document.getElementById('notificationToast').classList.remove('show');
    });
}

// ==================== INITIALIZATION ====================
function initializeApp() {
    // Setup responsive features first
    setupResponsiveViewport();
    setupTouchEnhancements();

    setupAuthHandlers();
    setupThemeToggle();
    setupNotificationHandlers();

    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const pageId = e.currentTarget.dataset.page;
            showPage(pageId);
        });
    });

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Setup pages
    setupTransactionHandlers();
    setupTransactionFilters();
    setupBudgetHandlers();
    setupGoalHandlers();
    setupGoalProgressHandlers();

    // Download report button
    document.getElementById('downloadReportBtn').addEventListener('click', downloadReport);

    // Setup mobile menu
    setupMobileMenu();

    // Load initial data if user is logged in
    if (app.manager.currentUser) {
        loadTransactions();
        loadBudgets();
        loadGoals();
        loadFinancialTips();
        showPage('dashboard');
    }

    // Set min date for goal
    const goalDate = document.getElementById('goalDate');
    if (goalDate) {
        goalDate.min = new Date().toISOString().split('T')[0];
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

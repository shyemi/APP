document.addEventListener('DOMContentLoaded', () => {
    // === Navigation Logic ===
    const navLinks = document.querySelectorAll('.nav-links a');
    const views = document.querySelectorAll('.view');
    const viewTitle = document.getElementById('current-view-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.getAttribute('data-view');
            showView(viewName);
        });
    });

    window.showView = (viewName) => {
        // Update Active Nav Link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
                viewTitle.textContent = link.textContent.trim();
            }
        });

        // Toggle Views
        views.forEach(view => {
            view.classList.remove('active-view');
            if (view.id === `view-${viewName}`) {
                view.classList.add('active-view');
            }
        });

        // Load data based on view
        loadData(viewName);
    };

    // === Modal Logic ===
    window.openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if(modalId === 'modal-add-loan') {
                populateLoanSelects();
            }
        }
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // reset form if inside modal
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    };

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                const form = overlay.querySelector('form');
                if (form) form.reset();
            }
        });
    });

    // === API Calls & Rendering ===
    const API_BASE = '/api';

    async function loadData(viewName) {
        try {
            if (viewName === 'dashboard') {
                await fetchDashboardStats();
                await fetchRecentLoans();
            } else if (viewName === 'books') {
                await fetchBooks();
            } else if (viewName === 'students') {
                await fetchStudents();
            } else if (viewName === 'loans') {
                await fetchLoans();
            }
        } catch (error) {
            showToast('Error cargando datos: ' + error.message, 'error');
        }
    }

    // Dashboard
    async function fetchDashboardStats() {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        
        document.getElementById('stat-total-books').textContent = data.total_books;
        document.getElementById('stat-avail-books').textContent = data.available_books;
        document.getElementById('stat-total-students').textContent = data.total_students;
        document.getElementById('stat-active-loans').textContent = data.active_loans;
    }

    async function fetchRecentLoans() {
        const res = await fetch(`${API_BASE}/loans`);
        const loans = await res.json();
        const tbody = document.querySelector('#recent-loans-table tbody');
        tbody.innerHTML = '';
        
        // Show only active loans or recent 5
        const recent = loans.filter(l => l.status === 'active').slice(0, 5);
        
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay préstamos recientes</td></tr>';
            return;
        }

        recent.forEach(loan => {
            const tr = document.createElement('tr');
            const date = new Date(loan.borrow_date).toLocaleDateString('es-ES');
            tr.innerHTML = `
                <td><strong>${loan.book_title}</strong></td>
                <td>${loan.student_name}</td>
                <td>${date}</td>
                <td><span class="badge active"><i class="fa-solid fa-clock"></i> Pendiente</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Books
    async function fetchBooks() {
        const res = await fetch(`${API_BASE}/books`);
        const books = await res.json();
        const tbody = document.querySelector('#books-table tbody');
        renderBooks(books, tbody);
    }

    function renderBooks(books, tbody) {
        tbody.innerHTML = '';
        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No hay libros registrados</td></tr>';
            return;
        }
        
        books.forEach(book => {
            const tr = document.createElement('tr');
            const availBadge = book.available > 0 
                ? `<span class="badge available">${book.available} Disp.</span>` 
                : `<span class="badge unavailable">Agotado</span>`;

            tr.innerHTML = `
                <td><strong>${book.title}</strong></td>
                <td>${book.author}</td>
                <td>${book.category || '-'}</td>
                <td>${book.isbn || '-'}</td>
                <td>${availBadge} de ${book.quantity}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-start;">
                        <button class="btn-action" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Students
    async function fetchStudents() {
        const res = await fetch(`${API_BASE}/students`);
        const students = await res.json();
        const tbody = document.querySelector('#students-table tbody');
        renderStudents(students, tbody);
    }

    function renderStudents(students, tbody) {
        tbody.innerHTML = '';
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay estudiantes registrados</td></tr>';
            return;
        }

        students.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${student.student_id}</strong></td>
                <td>${student.name}</td>
                <td>${student.grade}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-start;">
                        <button class="btn-action" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Loans
    async function fetchLoans() {
        const res = await fetch(`${API_BASE}/loans`);
        const loans = await res.json();
        const tbody = document.querySelector('#loans-table tbody');
        renderLoans(loans, tbody);
    }

    function renderLoans(loans, tbody) {
        tbody.innerHTML = '';
        if (loans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No hay historial de préstamos</td></tr>';
            return;
        }

        loans.sort((a,b) => new Date(b.borrow_date) - new Date(a.borrow_date)).forEach(loan => {
            const tr = document.createElement('tr');
            const bDate = new Date(loan.borrow_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
            const rDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
            
            const statusBadge = loan.status === 'active' 
                ? `<span class="badge active"><i class="fa-solid fa-clock"></i> Pendiente</span>` 
                : `<span class="badge returned"><i class="fa-solid fa-check"></i> Devuelto</span>`;
            
            const actions = loan.status === 'active'
                ? `<button class="btn-action success-action" onclick="returnLoan(${loan.id})" title="Marcar Devuelto"><i class="fa-solid fa-rotate-left"></i></button>`
                : `-`;

            tr.innerHTML = `
                <td>#${loan.id}</td>
                <td><strong>${loan.book_title}</strong></td>
                <td>${loan.student_name}</td>
                <td>${bDate}</td>
                <td>${rDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-start;">
                        ${actions}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.returnLoan = async (loanId) => {
        if(!confirm('¿Estás seguro de que este libro ha sido devuelto?')) return;
        
        try {
            const res = await fetch(`${API_BASE}/loans/${loanId}/return`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast('Préstamo actualizado con éxito (Libro devuelto)', 'success');
                fetchLoans(); // Refresh grid
                fetchDashboardStats();
            } else {
                showToast(data.error || 'Error al devolver', 'error');
            }
        } catch (err) {
            showToast('Error de red al intentar devolver.', 'error');
        }
    };

    // === Form Submissions ===
    
    // Add Book
    document.getElementById('form-add-book').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.quantity = parseInt(data.quantity);
        
        try {
            const res = await fetch(`${API_BASE}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                showToast('Libro guardado exitosamente', 'success');
                closeModal('modal-add-book');
                loadData('books'); // Refresh books view
            } else {
                showToast('Error al guardar el libro', 'error');
            }
        } catch (error) {
            showToast('Error de red', 'error');
        }
    });

    // Add Student
    document.getElementById('form-add-student').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const res = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (res.ok) {
                showToast('Estudiante registrado exitosamente', 'success');
                closeModal('modal-add-student');
                loadData('students');
            } else {
                showToast(result.error || 'Error registrando estudiante', 'error');
            }
        } catch (error) {
            showToast('Error de red', 'error');
        }
    });

    // Issue Loan
    document.getElementById('form-add-loan').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            student_id: parseInt(formData.get('student_id')),
            book_id: parseInt(formData.get('book_id'))
        };
        
        try {
            const res = await fetch(`${API_BASE}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (res.ok) {
                showToast('Préstamo registrado exitosamente', 'success');
                closeModal('modal-add-loan');
                loadData('loans');
            } else {
                showToast(result.error || 'Error registrando préstamo', 'error');
            }
        } catch (error) {
            showToast('Error de red', 'error');
        }
    });

    // Populate selects for Loan Modal
    async function populateLoanSelects() {
        try {
            // Get Students
            const sRes = await fetch(`${API_BASE}/students`);
            const students = await sRes.json();
            const sSelect = document.getElementById('loan-student-select');
            sSelect.innerHTML = '<option value="">Seleccione un estudiante...</option>';
            students.forEach(s => {
                sSelect.innerHTML += `<option value="${s.id}">${s.student_id} - ${s.name}</option>`;
            });

            // Get Books
            const bRes = await fetch(`${API_BASE}/books`);
            const books = await bRes.json();
            const bSelect = document.getElementById('loan-book-select');
            bSelect.innerHTML = '<option value="">Seleccione un libro disponibles...</option>';
            books.forEach(b => {
                if(b.available > 0) {
                    bSelect.innerHTML += `<option value="${b.id}">${b.title} (${b.available} disp.)</option>`;
                }
            });
        } catch(e) {
            showToast('Error cargando listas', 'error');
        }
    }


    // === Utils ===
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '<i class="fa-solid fa-circle-check" style="color: var(--success-color); font-size: 1.2rem;"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color: var(--danger-color); font-size: 1.2rem;"></i>';
        
        toast.innerHTML = `
            ${icon}
            <div>
                <h4 style="margin:0; font-size: 0.95rem;">${type === 'success' ? 'Éxito' : 'Error'}</h4>
                <p style="margin:0; font-size: 0.85rem; color: var(--text-secondary);">${message}</p>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize Dashboard data on load
    loadData('dashboard');
});

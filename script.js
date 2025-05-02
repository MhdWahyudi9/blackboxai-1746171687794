// script.js - Frontend JavaScript for SDN 1 Bangunharjo Academic Progress Monitoring

const apiBaseUrl = 'api.php';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        setupLoginForm();
    }
    if (document.getElementById('dashboardContent')) {
        loadDashboard();
        document.getElementById('logoutBtn').addEventListener('click', logout);
    }
});

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.classList.add('hidden');
        const username = form.username.value.trim();
        const password = form.password.value;

        if (!username || !password) {
            showError('Please enter username and password.');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                // Save user info in sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data));
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            showError('Network error');
        }
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }
}

async function loadDashboard() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const container = document.getElementById('dashboardContent');
    container.innerHTML = '<p>Loading...</p>';

    try {
        let studentId = null;
        if (user.role === 'parent') {
            studentId = user.parent_of_student_id;
        } else if (user.role === 'teacher' || user.role === 'admin') {
            // For demo, allow teacher/admin to view first student or select student
            // Here we just set studentId to 1 for demo purposes
            studentId = 1;
        }

        const url = new URL(apiBaseUrl, window.location.origin);
        url.searchParams.append('action', 'getStudentData');
        url.searchParams.append('userId', user.id);
        url.searchParams.append('role', user.role);
        if (studentId) {
            url.searchParams.append('studentId', studentId);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<p class="text-red-600">${data.error || 'Failed to load data'}</p>`;
            return;
        }

        renderDashboard(container, user, data);
    } catch (error) {
        container.innerHTML = '<p class="text-red-600">Network error</p>';
    }
}

function renderDashboard(container, user, data) {
    container.innerHTML = '';

    const welcome = document.createElement('h2');
    welcome.textContent = `Welcome, ${user.full_name} (${user.role})`;
    welcome.className = 'text-xl font-semibold mb-4';
    container.appendChild(welcome);

    if (user.role === 'parent' || user.role === 'teacher' || user.role === 'admin') {
        renderStudentDashboard(container, data);
    }

    if (user.role === 'teacher' || user.role === 'admin') {
        renderInputForms(container, user);
    }
}

function renderStudentDashboard(container, data) {
    const student = data.student;

    const studentInfo = document.createElement('div');
    studentInfo.className = 'mb-6';
    studentInfo.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Student: ${student.full_name}</h3>
        <p>Class: ${student.class_name}</p>
    `;
    container.appendChild(studentInfo);

    // Grades Table
    const gradesSection = document.createElement('section');
    gradesSection.className = 'mb-6';
    gradesSection.innerHTML = '<h4 class="font-semibold mb-2">Grades</h4>';
    const gradesTable = document.createElement('table');
    gradesTable.className = 'min-w-full bg-white border border-gray-300 rounded';
    gradesTable.innerHTML = `
        <thead class="bg-gray-200">
            <tr>
                <th class="border px-4 py-2 text-left">Subject</th>
                <th class="border px-4 py-2 text-left">Grade</th>
                <th class="border px-4 py-2 text-left">Date</th>
            </tr>
        </thead>
        <tbody>
            ${data.grades.map(g => `
                <tr>
                    <td class="border px-4 py-2">${g.subject}</td>
                    <td class="border px-4 py-2">${g.grade}</td>
                    <td class="border px-4 py-2">${g.date_recorded}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    gradesSection.appendChild(gradesTable);
    container.appendChild(gradesSection);

    // Attendance Table
    const attendanceSection = document.createElement('section');
    attendanceSection.className = 'mb-6';
    attendanceSection.innerHTML = '<h4 class="font-semibold mb-2">Attendance (Last 30 days)</h4>';
    const attendanceTable = document.createElement('table');
    attendanceTable.className = 'min-w-full bg-white border border-gray-300 rounded';
    attendanceTable.innerHTML = `
        <thead class="bg-gray-200">
            <tr>
                <th class="border px-4 py-2 text-left">Date</th>
                <th class="border px-4 py-2 text-left">Status</th>
            </tr>
        </thead>
        <tbody>
            ${data.attendance.map(a => `
                <tr>
                    <td class="border px-4 py-2">${a.date}</td>
                    <td class="border px-4 py-2">${a.status}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    attendanceSection.appendChild(attendanceTable);
    container.appendChild(attendanceSection);

    // Assignments List
    const assignmentsSection = document.createElement('section');
    assignmentsSection.className = 'mb-6';
    assignmentsSection.innerHTML = '<h4 class="font-semibold mb-2">Assignments</h4>';
    if (data.assignments.length === 0) {
        assignmentsSection.innerHTML += '<p>No assignments found.</p>';
    } else {
        const ul = document.createElement('ul');
        ul.className = 'list-disc list-inside';
        data.assignments.forEach(a => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${a.title}</strong> - Due: ${a.due_date}<br/>${a.description || ''}`;
            ul.appendChild(li);
        });
        assignmentsSection.appendChild(ul);
    }
    container.appendChild(assignmentsSection);
}

function renderInputForms(container, user) {
    const inputSection = document.createElement('section');
    inputSection.className = 'mb-6';
    inputSection.innerHTML = '<h3 class="text-lg font-semibold mb-4">Input Data</h3>';

    // Grade input form
    const gradeForm = document.createElement('form');
    gradeForm.id = 'gradeForm';
    gradeForm.className = 'mb-4 space-y-2 p-4 bg-white rounded shadow';
    gradeForm.innerHTML = `
        <h4 class="font-semibold mb-2">Input Grade</h4>
        <input type="number" id="gradeStudentId" placeholder="Student ID" required class="border p-2 rounded w-full" />
        <input type="text" id="gradeSubject" placeholder="Subject" required class="border p-2 rounded w-full" />
        <input type="number" step="0.01" id="gradeValue" placeholder="Grade" required class="border p-2 rounded w-full" />
        <input type="date" id="gradeDate" class="border p-2 rounded w-full" />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit Grade</button>
        <p id="gradeMsg" class="text-sm mt-1"></p>
    `;
    inputSection.appendChild(gradeForm);

    // Attendance input form
    const attendanceForm = document.createElement('form');
    attendanceForm.id = 'attendanceForm';
    attendanceForm.className = 'space-y-2 p-4 bg-white rounded shadow';
    attendanceForm.innerHTML = `
        <h4 class="font-semibold mb-2">Input Attendance</h4>
        <input type="number" id="attendanceStudentId" placeholder="Student ID" required class="border p-2 rounded w-full" />
        <select id="attendanceStatus" required class="border p-2 rounded w-full">
            <option value="">Select Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Excused">Excused</option>
        </select>
        <input type="date" id="attendanceDate" class="border p-2 rounded w-full" />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit Attendance</button>
        <p id="attendanceMsg" class="text-sm mt-1"></p>
    `;
    inputSection.appendChild(attendanceForm);

    container.appendChild(inputSection);

    // Event listeners for forms
    gradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('gradeStudentId').value.trim();
        const subject = document.getElementById('gradeSubject').value.trim();
        const grade = document.getElementById('gradeValue').value.trim();
        const dateRecorded = document.getElementById('gradeDate').value || new Date().toISOString().split('T')[0];
        const gradeMsg = document.getElementById('gradeMsg');

        if (!studentId || !subject || !grade) {
            gradeMsg.textContent = 'Please fill all required fields.';
            gradeMsg.classList.add('text-red-600');
            return;
        }

        const user = JSON.parse(sessionStorage.getItem('user'));
        try {
            const response = await fetch(`${apiBaseUrl}?action=inputGrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: user.id,
                    studentId: parseInt(studentId),
                    subject,
                    grade: parseFloat(grade),
                    dateRecorded
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                gradeMsg.textContent = 'Grade submitted successfully.';
                gradeMsg.classList.remove('text-red-600');
                gradeMsg.classList.add('text-green-600');
                gradeForm.reset();
            } else {
                gradeMsg.textContent = data.error || 'Failed to submit grade.';
                gradeMsg.classList.add('text-red-600');
            }
        } catch (error) {
            gradeMsg.textContent = 'Network error.';
            gradeMsg.classList.add('text-red-600');
        }
    });

    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('attendanceStudentId').value.trim();
        const status = document.getElementById('attendanceStatus').value;
        const date = document.getElementById('attendanceDate').value || new Date().toISOString().split('T')[0];
        const attendanceMsg = document.getElementById('attendanceMsg');

        if (!studentId || !status) {
            attendanceMsg.textContent = 'Please fill all required fields.';
            attendanceMsg.classList.add('text-red-600');
            return;
        }

        const user = JSON.parse(sessionStorage.getItem('user'));
        try {
            const response = await fetch(`${apiBaseUrl}?action=inputAttendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: user.id,
                    studentId: parseInt(studentId),
                    status,
                    date
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                attendanceMsg.textContent = 'Attendance submitted successfully.';
                attendanceMsg.classList.remove('text-red-600');
                attendanceMsg.classList.add('text-green-600');
                attendanceForm.reset();
            } else {
                attendanceMsg.textContent = data.error || 'Failed to submit attendance.';
                attendanceMsg.classList.add('text-red-600');
            }
        } catch (error) {
            attendanceMsg.textContent = 'Network error.';
            attendanceMsg.classList.add('text-red-600');
        }
    });
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

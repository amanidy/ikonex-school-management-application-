import { api, showToast, openModal, closeModal } from './api.js';

export async function initStudents() {
  const el = document.getElementById('students');

  el.innerHTML = 'Loading students...';

  const [students, streams] = await Promise.all([
    api.students.getAll(),
    api.streams.getAll()
  ]);

  el.innerHTML = `

    <h2>Students</h2>
    <p>${students.length} student(s) enrolled</p>

    <button id="add-student-btn">+ Register Student</button>

    <div class="filter-bar">
      <input
        type="text"
        id="student-search"
        placeholder="Search by name or admission no..."
        style="flex:1; min-width:200px"
      />

      <select id="stream-filter">
        <option value="">All Streams</option>
        ${streams
          .map(stream => `<option value="${stream.id}">${stream.name}</option>`)
          .join('')}
      </select>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Admission No.</th>
              <th>Stream</th>
              <th>Gender</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody id="students-tbody">
            ${renderStudentRows(students)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document
    .getElementById('add-student-btn')
    .addEventListener('click', () => openStudentForm(null, streams));

  document
    .getElementById('stream-filter')
    .addEventListener('change', async (e) => {
      const streamId = e.target.value || null;
      const filteredStudents = await api.students.getAll(streamId);

      document.getElementById('students-tbody').innerHTML =
        renderStudentRows(filteredStudents);
    });

  document
    .getElementById('student-search')
    .addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();

      document
        .querySelectorAll('#students-tbody tr[data-id]')
        .forEach((row) => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(term) ? '' : 'none';
        });
    });
}

function renderStudentRows(students) {
  if (!students.length) {
    return `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <p>No students found.</p>
          </div>
        </td>
      </tr>
    `;
  }

  return students
    .map(
      (student, index) => `
      <tr data-id="${student.id}">
        <td>${index + 1}</td>

        <td>
          <strong>${student.first_name} ${student.last_name}</strong>
        </td>

        <td class="text-muted">
          ${student.admission_number}
        </td>

        <td>${student.stream_name}</td>

        <td class="text-muted">
          ${student.gender || '—'}
        </td>

        <td>
          <button class="btn btn-secondary btn-sm"
            onclick="window.viewStudent(${student.id})">
            View
          </button>

          <button class="btn btn-secondary btn-sm"
            onclick="window.editStudent(${student.id})">
            Edit
          </button>

          <button class="btn btn-danger btn-sm"
            onclick="window.deleteStudent(${student.id}, '${student.first_name} ${student.last_name}')">
            Delete
          </button>
        </td>
      </tr>
    `
    )
    .join('');
}

function openStudentForm(student = null, streams = []) {
  const isEdit = Boolean(student);

  openModal(
    isEdit ? 'Edit Student' : 'Register Student',
    `
      <div class="form-row">
        <div class="form-group">
          <label>First Name</label>
          <input type="text" id="s-fname"
            value="${student?.first_name || ''}" />
        </div>

        <div class="form-group">
          <label>Last Name</label>
          <input type="text" id="s-lname"
            value="${student?.last_name || ''}" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Admission Number</label>
          <input type="text" id="s-adm"
            value="${student?.admission_number || ''}" />
        </div>

        <div class="form-group">
          <label>Class Stream</label>
          <select id="s-stream">
            <option value="">-- Select stream --</option>
            ${streams
              .map(
                (stream) => `
                  <option value="${stream.id}"
                    ${student?.stream_id == stream.id ? 'selected' : ''}>
                    ${stream.name}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="s-dob"
            value="${student?.date_of_birth?.split('T')[0] || ''}" />
        </div>

        <div class="form-group">
          <label>Gender</label>
          <select id="s-gender">
            <option value="">-- Select --</option>
            <option value="Male" ${student?.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Female" ${student?.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Other" ${student?.gender === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
      </div>

      <button class="btn btn-primary" id="save-student-btn">
        ${isEdit ? 'Save Changes' : 'Register Student'}
      </button>
    `
  );

  document
    .getElementById('save-student-btn')
    .addEventListener('click', async () => {

      const data = {
        first_name: document.getElementById('s-fname').value.trim(),
        last_name: document.getElementById('s-lname').value.trim(),
        admission_number: document.getElementById('s-adm').value.trim(),
        stream_id: document.getElementById('s-stream').value,
        date_of_birth: document.getElementById('s-dob').value,
        gender: document.getElementById('s-gender').value
      };

      if (
        !data.first_name ||
        !data.last_name ||
        !data.admission_number ||
        !data.stream_id
      ) {
        return showToast(
          'Name, admission number, and stream are required',
          'error'
        );
      }

      const response = isEdit
        ? await api.students.update(student.id, data)
        : await api.students.create(data);

      if (response.error) {
        return showToast(response.error, 'error');
      }

      showToast(
        isEdit ? 'Student updated' : 'Student registered',
        'success'
      );

      closeModal();

      // ✅ RELOAD LIST (this is where refresh happens)
      initStudents();
    });
}

/* ===== GLOBAL FUNCTIONS ===== */

window.viewStudent = async function(id) {
  const students = await api.students.getAll();

  const student = students.find(
    s => Number(s.id) === Number(id)
  );

  if (!student) {
    return showToast('Student not found', 'error');
  }

  openModal(
    'Student Details',
    `
      <h3>${student.first_name} ${student.last_name}</h3>
      <p>${student.admission_number}</p>
      <p>${student.stream_name || 'N/A'}</p>
      <p>${student.gender || 'N/A'}</p>
    `
  );
};

window.editStudent = async function(id) {
  const [students, streams] = await Promise.all([
    api.students.getAll(),
    api.streams.getAll()
  ]);

  const student = students.find(
    s => Number(s.id) === Number(id)
  );

  if (!student) {
    return showToast('Student not found', 'error');
  }

  openStudentForm(student, streams);
};

window.deleteStudent = async function(id, name) {
  if (!confirm(`Delete student "${name}"?`)) return;

  const response = await api.students.remove(id);

  if (response.error) {
    return showToast(response.error, 'error');
  }

  showToast('Student deleted', 'success');
  initStudents();
};
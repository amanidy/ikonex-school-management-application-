import { api, showToast, openModal, closeModal } from './api.js';

export async function initSubjects() {
  const el = document.getElementById('subjects');

  el.innerHTML = '<div class="loading">Loading subjects...</div>';

  const [subjects, streams] = await Promise.all([
    api.subjects.getAll(),
    api.streams.getAll()
  ]);

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Subjects</h2>
        <p class="text-muted">Manage school subjects and stream assignments</p>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" id="assign-subject-btn">
          Assign to Stream
        </button>

        <button class="btn btn-primary" id="add-subject-btn">
          + Add Subject
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Subject Name</th>
              <th>Code</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${subjects.length === 0
              ? `<tr><td colspan="4">
                   <div class="empty-state">
                     <p>No subjects added yet.</p>
                   </div>
                 </td></tr>`
              : subjects.map((subject, index) => `
                <tr>
                  <td class="text-muted">${index + 1}</td>
                  <td><strong>${subject.name}</strong></td>
                  <td><span class="badge">${subject.code}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm"
                      onclick="window.editSubject(${subject.id}, '${subject.name}', '${subject.code}')">
                      Edit
                    </button>

                    <button class="btn btn-danger btn-sm"
                      onclick="window.deleteSubject(${subject.id}, '${subject.name}')">
                      Delete
                    </button>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-subject-btn')
    .addEventListener('click', () => openSubjectForm());

  document.getElementById('assign-subject-btn')
    .addEventListener('click', () => openAssignForm(subjects, streams));
}

/* ================= SUBJECT FORM ================= */

function openSubjectForm(subject = null) {
  const isEdit = subject !== null;

  openModal(
    isEdit ? 'Edit Subject' : 'Add Subject',
    `
      <div class="form-group">
        <label>Subject Name</label>
        <input type="text" id="sub-name"
          value="${subject?.name || ''}" />
      </div>

      <div class="form-group">
        <label>Subject Code</label>
        <input type="text" id="sub-code"
          value="${subject?.code || ''}"
          style="text-transform:uppercase" />
      </div>

      <button class="btn btn-primary" id="save-subject-btn" style="width:100%">
        ${isEdit ? 'Save Changes' : 'Create Subject'}
      </button>
    `
  );

  document.getElementById('save-subject-btn')
    .addEventListener('click', async () => {

      const name = document.getElementById('sub-name').value.trim();
      const code = document.getElementById('sub-code').value.trim().toUpperCase();

      if (!name || !code) {
        return showToast('Name and code are required', 'error');
      }

      const response = isEdit
        ? await api.subjects.update(subject.id, { name, code })
        : await api.subjects.create({ name, code });

      if (response.error) {
        return showToast(response.error, 'error');
      }

      showToast(isEdit ? 'Subject updated' : 'Subject created');

      closeModal();

      // ✅ RESET
      document.getElementById('sub-name').value = '';
      document.getElementById('sub-code').value = '';

      initSubjects();
    });
}

/* ================= ASSIGN FORM ================= */

function openAssignForm(subjects, streams) {
  openModal(
    'Assign Subject to Stream',
    `
      <div class="form-group">
        <label>Subject</label>
        <select id="assign-subject-select">
          <option value="">-- Select subject --</option>
          ${subjects.map(s => `
            <option value="${s.id}">${s.name} (${s.code})</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Stream</label>
        <select id="assign-stream-select">
          <option value="">-- Select stream --</option>
          ${streams.map(s => `
            <option value="${s.id}">${s.name}</option>
          `).join('')}
        </select>
      </div>

      <button class="btn btn-primary" id="confirm-assign-btn" style="width:100%">
        Assign Subject
      </button>
    `
  );

  document.getElementById('confirm-assign-btn')
    .addEventListener('click', async () => {

      const subject_id = document.getElementById('assign-subject-select').value;
      const stream_id = document.getElementById('assign-stream-select').value;

      if (!subject_id || !stream_id) {
        return showToast('Select both subject and stream', 'error');
      }

      const response = await api.subjects.assignToStream({
        subject_id,
        stream_id
      });

      if (response.error) {
        return showToast(response.error, 'error');
      }

      showToast('Subject assigned to stream');

      closeModal();

      // ✅ RESET
      document.getElementById('assign-subject-select').value = '';
      document.getElementById('assign-stream-select').value = '';
    });
}

/* ================= GLOBAL ================= */

window.editSubject = function (id, name, code) {
  openSubjectForm({ id, name, code });
};

window.deleteSubject = async function (id, name) {
  if (!confirm(`Delete subject "${name}"?`)) return;

  const response = await api.subjects.remove(id);

  if (response.error) {
    return showToast(response.error, 'error');
  }

  showToast('Subject deleted');
  initSubjects();
};

import { api, showToast, openModal, closeModal } from './api.js';

export async function initStreams() {
  const el = document.getElementById('streams');
  el.innerHTML = '<div class="loading">Loading streams...</div>';

  const streams = await api.streams.getAll();

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Class Streams</h2>
        <p class="text-muted">Manage class groups e.g. Form 1A, Form 2B</p>
      </div>
      <button class="btn btn-primary" id="add-stream-btn">+ Add Stream</button>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Stream Name</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${streams.length === 0
              ? `<tr><td colspan="4">
                   <div class="empty-state">
                     <p>No class streams yet. Add one to get started.</p>
                   </div>
                 </td></tr>`
              : streams.map((s, i) => `
                <tr>
                  <td class="text-muted">${i + 1}</td>
                  <td><strong>${s.name}</strong></td>
                  <td class="text-muted">${new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm"
                      onclick="window.editStream(${s.id}, '${s.name}')">Edit</button>
                    <button class="btn btn-danger btn-sm"
                      onclick="window.deleteStream(${s.id}, '${s.name}')">Delete</button>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-stream-btn')
    .addEventListener('click', () => openStreamForm());
}

function openStreamForm(id = null, name = '') {
  const isEdit = id !== null;

  openModal(
    isEdit ? 'Edit Stream' : 'Add Class Stream',
    `
      <div class="form-group">
        <label>Stream Name</label>
        <input type="text" id="stream-name-input"
          value="${name}" placeholder="e.g. Form 1A" />
      </div>

      <button class="btn btn-primary" id="save-stream-btn" style="width:100%">
        ${isEdit ? 'Save Changes' : 'Create Stream'}
      </button>
    `
  );

  document.getElementById('save-stream-btn')
    .addEventListener('click', async () => {

      const nameVal = document.getElementById('stream-name-input').value.trim();

      if (!nameVal) {
        return showToast('Stream name cannot be empty', 'error');
      }

      const res = isEdit
        ? await api.streams.update(id, { name: nameVal })
        : await api.streams.create({ name: nameVal });

      if (res.error) {
        return showToast(res.error, 'error');
      }

      showToast(isEdit ? 'Stream updated' : 'Stream created');

      closeModal();

      
      document.getElementById('stream-name-input').value = '';

      initStreams();
    });
}

window.editStream = function (id, name) {
  openStreamForm(id, name);
};

window.deleteStream = async function (id, name) {
  if (!confirm(`Delete stream "${name}"? This cannot be undone.`)) return;

  const res = await api.streams.remove(id);

  if (res.error) return showToast(res.error, 'error');

  showToast('Stream deleted');
  initStreams();
};
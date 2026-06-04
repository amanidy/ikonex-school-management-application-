const BASE = 'http://localhost:3000/api';

export const api = {

  streams: {
    getAll: () => fetch(`${BASE}/streams`).then(r => r.json()),
    getOne: (id) => fetch(`${BASE}/streams/${id}`).then(r => r.json()),
    create: (data) => fetch(`${BASE}/streams`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${BASE}/streams/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    remove: (id) => fetch(`${BASE}/streams/${id}`, { method:'DELETE' }).then(r => r.json())
  },

  students: {
    getAll: (streamId) => {
      const url = streamId ? `${BASE}/students?stream=${streamId}` : `${BASE}/students`;
      return fetch(url).then(r => r.json());
    },
    getOne: (id) => fetch(`${BASE}/students/${id}`).then(r => r.json()),
    create: (data) => fetch(`${BASE}/students`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${BASE}/students/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    remove: (id) => fetch(`${BASE}/students/${id}`, { method:'DELETE' }).then(r => r.json())
  },

  subjects: {
    getAll: () => fetch(`${BASE}/subjects`).then(r => r.json()),
    getByStream: (streamId) => fetch(`${BASE}/subjects/stream/${streamId}`).then(r => r.json()),
    create: (data) => fetch(`${BASE}/subjects`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${BASE}/subjects/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    remove: (id) => fetch(`${BASE}/subjects/${id}`, { method:'DELETE' }).then(r => r.json()),
    assignToStream: (data) => fetch(`${BASE}/subjects/assign`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json())
  },

  scores: {
    record: (data) => fetch(`${BASE}/scores`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${BASE}/scores/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    getStudentScores: (studentId) => fetch(`${BASE}/scores/student/${studentId}`).then(r => r.json()),
    getClassResults: (streamId) => fetch(`${BASE}/scores/results/${streamId}`).then(r => r.json()),
    getClassSubjectScores: (streamId, subjectId) => fetch(`${BASE}/scores/class/${streamId}/subject/${subjectId}`).then(r => r.json())
  }
};

export function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

export function openModal(title, bodyHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
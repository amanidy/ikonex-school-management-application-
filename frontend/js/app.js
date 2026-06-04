import { initStreams } from './streams.js';
import { initStudents } from './students.js';
import { initSubjects } from './subjects.js';
import { initScores } from './scores.js';
import { initResults } from './results.js';
import { initReports } from './reports.js';
import { api } from './api.js';
import { closeModal } from './api.js';

// navigation to each item
document.querySelectorAll('.item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const section = btn.dataset.section;
    document.getElementById(section).classList.add('active');
    loadSection(section);
  });
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

function loadSection(name) {
  if (name === 'dashboard') loadDashboard();
  else if (name === 'streams') initStreams();
  else if (name === 'students') initStudents();
  else if (name === 'subjects') initSubjects();
  else if (name === 'scores') initScores();
  else if (name === 'results') initResults();
  else if (name === 'reports') initReports();
}

async function loadDashboard() {
  const el = document.getElementById('dashboard');
  el.innerHTML = '<p style="color:var(--muted)">Loading...</p>';
  const [streams, students, subjects] = await Promise.all([
    api.streams.getAll(),
    api.students.getAll(),
    api.subjects.getAll()
  ]);
  el.innerHTML = `
    <div class="section-header"><h2>Dashboard</h2></div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${streams.length}</div>
        <div class="stat-label">Class Streams</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${students.length}</div>
        <div class="stat-label">Students Enrolled</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${subjects.length}</div>
        <div class="stat-label">Subjects</div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:16px">Recent Streams</h3>
      ${streams.slice(0,5).map(s => `<div style="padding:8px 0;border-bottom:1px solid var(--border)">${s.name}</div>`).join('')}
    </div>
  `;
}

// loading the dashboard on start
loadDashboard();
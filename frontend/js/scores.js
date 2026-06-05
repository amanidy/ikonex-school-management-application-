import { api, showToast } from './api.js';

export async function initScores() {
  const el = document.getElementById('scores');

  el.innerHTML = '<div class="loading">Loading...</div>';

  const [streams] = await Promise.all([
    api.streams.getAll(),
    api.subjects.getAll()
  ]);

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Record Scores</h2>
        <p class="text-muted">
          Enter CAT and Exam marks per student per subject
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        Step 1 — Select Class & Subject
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Class Stream</label>

          <select id="score-stream-select">
            <option value="">-- Select stream --</option>

            ${streams
              .map(
                stream =>
                  `<option value="${stream.id}">${stream.name}</option>`
              )
              .join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Subject</label>

          <select id="score-subject-select" disabled>
            <option value="">
              -- Select stream first --
            </option>
          </select>
        </div>
      </div>

      <button
        class="btn btn-primary"
        id="load-score-table-btn"
        disabled
      >
        Load Students
      </button>
    </div>

    <div id="score-entry-area"></div>
  `;

  const streamSelect = document.getElementById('score-stream-select');
  const subjectSelect = document.getElementById('score-subject-select');
  const loadButton = document.getElementById('load-score-table-btn');

  streamSelect.addEventListener('change', async () => {
    const streamId = streamSelect.value;

    subjectSelect.innerHTML =
      '<option value="">Loading...</option>';

    subjectSelect.disabled = true;
    loadButton.disabled = true;

    if (!streamId) return;

    const streamSubjects =
      await api.subjects.getByStream(streamId);

    if (!streamSubjects.length) {
      subjectSelect.innerHTML = `
        <option value="">
          No subjects assigned to this stream
        </option>
      `;
      return;
    }

    subjectSelect.innerHTML = `
      <option value="">-- Select subject --</option>

      ${streamSubjects
        .map(
          subject => `
            <option value="${subject.id}">
              ${subject.name} (${subject.code})
            </option>
          `
        )
        .join('')}
    `;

    subjectSelect.disabled = false;
  });

  subjectSelect.addEventListener('change', () => {
    loadButton.disabled = !subjectSelect.value;
  });

  loadButton.addEventListener('click', async () => {
    await renderScoreTable(
      streamSelect.value,
      subjectSelect.value
    );
  });
}

async function renderScoreTable(streamId, subjectId) {
  const area = document.getElementById('score-entry-area');

  area.innerHTML =
    '<div class="loading">Loading students...</div>';

  const rows =
    await api.scores.getClassSubjectScores(
      streamId,
      subjectId
    );

  if (!rows.length) {
    area.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p>No students in this stream.</p>
        </div>
      </div>
    `;
    return;
  }

  area.innerHTML = `
    <div class="card">
      <div class="card-title">
        Step 2 — Enter Marks
        (CAT: 0–50 | Exam: 0–50)
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Adm. No.</th>
              <th>CAT /50</th>
              <th>Exam /50</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody id="score-rows">
            ${rows
              .map((row, index) => {
                const hasScore =
                  row.score_id !== null;

                return `
                  <tr
                    data-score-id="${row.score_id || ''}"
                    data-student-id="${row.id}"
                    data-adm="${row.admission_number}"
                  >
                    <td class="text-muted">
                      ${index + 1}
                    </td>

                    <td>
                      <strong>
                        ${row.first_name}
                        ${row.last_name}
                      </strong>
                    </td>

                    <td class="text-muted">
                      ${row.admission_number}
                    </td>

                    <td>
                      <input
                        type="number"
                        class="cat-input"
                        min="0"
                        max="50"
                        step="0.5"
                        value="${(hasScore && row.cat_score !== null) ? row.cat_score : ''}"
                        placeholder="0–50"
                        style="
                          width:70px;
                          padding:6px 8px;
                          background:var(--surface2);
                          border:1px solid var(--border);
                          border-radius:6px;
                          color:var(--text);
                          text-align:center;
                        "
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        class="exam-input"
                        min="0"
                        max="50"
                        step="0.5"
                        value="${(hasScore && row.exam_score !== null) ? row.exam_score : ''}"
                        placeholder="0–50"
                        style="
                          width:70px;
                          padding:6px 8px;
                          background:var(--surface2);
                          border:1px solid var(--border);
                          border-radius:6px;
                          color:var(--text);
                          text-align:center;
                        "
                      />
                    </td>

                    <td class="total-display text-muted">
                      ${
                        hasScore
                          ? row.total_score
                          : '—'
                      }
                    </td>

                    <td>
                      ${
                        hasScore
                          ? '<span class="badge badge-A">Recorded</span>'
                          : '<span class="badge badge-none">Pending</span>'
                      }
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <div
        style="
          margin-top:20px;
          display:flex;
          gap:10px;
        "
      >
        <button
          class="btn btn-primary"
          id="submit-scores-btn"
        >
          Save All Scores
        </button>

        <p
          class="text-muted"
          style="
            align-self:center;
            font-size:12px;
          "
        >
          Rows already marked "Recorded"
          will be updated, not duplicated.
        </p>
      </div>
    </div>
  `;

  document
    .querySelectorAll('#score-rows tr')
    .forEach((row) => {
      const catInput =
        row.querySelector('.cat-input');

      const examInput =
        row.querySelector('.exam-input');

      const totalCell =
        row.querySelector('.total-display');

      function updateTotal() {
        const cat =
          parseFloat(catInput.value) || 0;

        const exam =
          parseFloat(examInput.value) || 0;

        totalCell.textContent =
          (cat + exam).toFixed(1);
      }

      catInput.addEventListener(
        'input',
        updateTotal
      );

      examInput.addEventListener(
        'input',
        updateTotal
      );
    });

  document
    .getElementById('submit-scores-btn')
    .addEventListener('click', async () => {
      await saveAllScores(streamId, subjectId);
    });
}

async function saveAllScores(
  streamId,
  subjectId
) {
  const tableRows =
    document.querySelectorAll('#score-rows tr');

  let successCount = 0;
  let errorCount = 0;

  for (const row of tableRows) {
    const scoreId = row.dataset.scoreId;
    const studentId = row.dataset.studentId;
    const admNo = row.dataset.adm;

    const cat = parseFloat(
      row.querySelector('.cat-input').value
    );

    const exam = parseFloat(
      row.querySelector('.exam-input').value
    );

    if (isNaN(cat) && isNaN(exam)) {
      continue;
    }

    if (
      cat < 0 ||
      cat > 50 ||
      exam < 0 ||
      exam > 50
    ) {
      showToast(
        `Invalid score for ${admNo} — must be 0 to 50`,
        'error'
      );

      errorCount++;
      continue;
    }

    let response;

    if (scoreId) {
      response = await api.scores.update(
        scoreId,
        {
          cat_score: cat,
          exam_score: exam
        }
      );
    } else {
      response = await api.scores.record({
        student_id: studentId,
        subject_id: subjectId,
        cat_score: cat,
        exam_score: exam
      });
    }

    if (response.error) {
      errorCount++;
    } else {
      successCount++;
    }
  }

  if (successCount > 0) {
    showToast(
      `${successCount} score(s) saved successfully`
    );
  }

  if (errorCount > 0) {
    showToast(
      `${errorCount} error(s) — check inputs`,
      'error'
    );
  }

  if (successCount > 0) {
    await renderScoreTable(
      streamId,
      subjectId
    );
  }
}
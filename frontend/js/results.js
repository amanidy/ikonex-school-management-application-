import { api, showToast } from './api.js';

export async function initResults() {
  const el = document.getElementById('results');

  el.innerHTML = '<div class="loading">Loading...</div>';

  const [streams, subjects] = await Promise.all([
    api.streams.getAll(),
    api.subjects.getAll()
  ]);

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Results & Rankings</h2>
        <p class="text-muted">
          View class performance, averages, and positions
        </p>
      </div>
    </div>

    <div class="card">
      <div class="form-row">
        <div class="form-group">
          <label>Class Stream</label>

          <select id="result-stream-select">
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
          <label>View Mode</label>

          <select id="result-mode">
            <option value="overall">
              Overall Rankings
            </option>

            <option value="subject">
              By Subject
            </option>
          </select>
        </div>
      </div>

      <div
        id="subject-filter-group"
        class="form-group"
        style="display:none"
      >
        <label>Subject</label>

        <select id="result-subject-select">
          <option value="">
            -- Select subject --
          </option>

          ${subjects
            .map(
              subject => `
                <option value="${subject.id}">
                  ${subject.name}
                </option>
              `
            )
            .join('')}
        </select>
      </div>

      <button
        class="btn btn-primary"
        id="load-results-btn"
      >
        Load Results
      </button>
    </div>

    <div id="results-area"></div>
  `;

  document
    .getElementById('result-mode')
    .addEventListener('change', (e) => {
      const isSubject =
        e.target.value === 'subject';

      document.getElementById(
        'subject-filter-group'
      ).style.display = isSubject
        ? 'block'
        : 'none';
    });

  document
    .getElementById('load-results-btn')
    .addEventListener('click', async () => {
      const streamId =
        document.getElementById(
          'result-stream-select'
        ).value;

      const mode =
        document.getElementById(
          'result-mode'
        ).value;

      const subjectId =
        document.getElementById(
          'result-subject-select'
        ).value;

      if (!streamId) {
        return showToast(
          'Please select a stream',
          'error'
        );
      }

      if (
        mode === 'subject' &&
        !subjectId
      ) {
        return showToast(
          'Please select a subject',
          'error'
        );
      }

      if (mode === 'overall') {
        await renderOverallResults(
          streamId,
          streams
        );
      } else {
        await renderSubjectResults(
          streamId,
          subjectId,
          streams,
          subjects
        );
      }
    });
}

async function renderOverallResults(
  streamId,
  streams
) {
  const area =
    document.getElementById(
      'results-area'
    );

  area.innerHTML =
    '<div class="loading">Calculating results...</div>';

  const ranked =
    await api.scores.getClassResults(
      streamId
    );

  const stream = streams.find(
    s => s.id == streamId
  );

  if (!ranked.length) {
    area.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <p>
            No results found for this stream.
          </p>
        </div>
      </div>
    `;
    return;
  }

  area.innerHTML = `
    <div class="card">
      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:16px;
        "
      >
        <div class="card-title">
          ${stream?.name}
          — Overall Rankings
          (${ranked.length} students)
        </div>

        <button
          class="btn btn-secondary btn-sm"
          onclick="window.printResults()"
        >
          🖨 Print
        </button>
      </div>

      <div class="table-wrapper">
        <table id="overall-results-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Student</th>
              <th>Adm. No.</th>
              <th>Subjects</th>
              <th>Total Marks</th>
              <th>Average</th>
              <th>Grade</th>
            </tr>
          </thead>

          <tbody>
            ${ranked
              .map(
                student => `
                  <tr>
                    <td class="${
                      student.position === 1
                        ? 'pos-1'
                        : 'text-muted'
                    }">
                      ${
                        student.position === 1
                          ? '🥇'
                          : student.position
                      }
                    </td>

                    <td>
                      <strong>
                        ${student.first_name}
                        ${student.last_name}
                      </strong>
                    </td>

                    <td class="text-muted">
                      ${student.admission_number}
                    </td>

                    <td class="text-muted">
                      ${student.subjects_taken}
                    </td>

                    <td>
                      <strong>
                        ${student.total_marks}
                      </strong>
                    </td>

                    <td>
                      ${student.average}
                    </td>

                    <td>
                      <span
                        class="badge badge-${
                          student.grade || 'none'
                        }"
                      >
                        ${
                          student.grade || 'N/A'
                        }
                      </span>
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function renderSubjectResults(
  streamId,
  subjectId,
  streams,
  subjects
) {
  const area =
    document.getElementById(
      'results-area'
    );

  area.innerHTML =
    '<div class="loading">Loading...</div>';

  const rows =
    await api.scores.getClassSubjectScores(
      streamId,
      subjectId
    );

  const stream = streams.find(
    s => s.id == streamId
  );

  const subject = subjects.find(
    s => s.id == subjectId
  );

  area.innerHTML = `
    <div class="card">
      <div
        class="card-title"
        style="margin-bottom:16px"
      >
        ${stream?.name}
        — ${subject?.name} Performance
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
              <th>Total /100</th>
              <th>Grade</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map(
                (row, index) => `
                  <tr>
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
                      ${row.cat_score ?? '—'}
                    </td>

                    <td>
                      ${row.exam_score ?? '—'}
                    </td>

                    <td>
                      <strong>
                        ${
                          row.total_score ??
                          '—'
                        }
                      </strong>
                    </td>

                    <td>
                      <span
                        class="badge badge-${
                          row.grade || 'none'
                        }"
                      >
                        ${row.grade || 'N/A'}
                      </span>
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.printResults = function () {
  window.print();
};
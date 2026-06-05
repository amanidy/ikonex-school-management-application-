import { api, showToast } from './api.js';

export async function initReports() {
  const el = document.getElementById('reports');

  el.innerHTML = '<div class="loading">Loading...</div>';

  const [streams] = await Promise.all([
    api.streams.getAll(),
    api.students.getAll()
  ]);

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Reports & PDF Export</h2>
        <p class="text-muted">
          Generate student report cards and class performance PDFs
        </p>
      </div>
    </div>

    <div
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:20px;
      "
    >
      <div class="card">
        <div class="card-title">
          📄 Individual Report Card
        </div>

        <p
          class="text-muted"
          style="
            margin-bottom:16px;
            font-size:13px;
          "
        >
          Generates a PDF report card for a
          single student showing all subject
          scores, grades and class position.
        </p>

        <div class="form-group">
          <label>Select Stream</label>

          <select id="report-stream-select">
            <option value="">
              -- Select stream --
            </option>

            ${streams
              .map(
                stream => `
                  <option value="${stream.id}">
                    ${stream.name}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Select Student</label>

          <select
            id="report-student-select"
            disabled
          >
            <option value="">
              -- Select stream first --
            </option>
          </select>
        </div>

        <button
          class="btn btn-primary"
          id="generate-report-card-btn"
          disabled
        >
          Download Report Card
        </button>
      </div>

      <div class="card">
        <div class="card-title">
          📊 Class Performance Report
        </div>

        <p
          class="text-muted"
          style="
            margin-bottom:16px;
            font-size:13px;
          "
        >
          Generates a PDF ranking report
          for all students in a stream.
        </p>

        <div class="form-group">
          <label>Select Stream</label>

          <select
            id="class-report-stream-select"
          >
            <option value="">
              -- Select stream --
            </option>

            ${streams
              .map(
                stream => `
                  <option value="${stream.id}">
                    ${stream.name}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>

        <button
          class="btn btn-primary"
          id="generate-class-report-btn"
        >
          Download Class Report
        </button>
      </div>
    </div>
  `;

  document
    .getElementById('report-stream-select')
    .addEventListener(
      'change',
      async (event) => {
        const streamId = event.target.value;

        const studentSelect =
          document.getElementById(
            'report-student-select'
          );

        const downloadButton =
          document.getElementById(
            'generate-report-card-btn'
          );

        studentSelect.disabled = true;
        downloadButton.disabled = true;

        if (!streamId) return;

        const students =
          await api.students.getAll(
            streamId
          );

        studentSelect.innerHTML = `
          <option value="">
            -- Select student --
          </option>

          ${students
            .map(
              student => `
                <option value="${student.id}">
                  ${student.last_name},
                  ${student.first_name}
                  (${student.admission_number})
                </option>
              `
            )
            .join('')}
        `;

        studentSelect.disabled = false;
      }
    );

  document
    .getElementById(
      'report-student-select'
    )
    .addEventListener('change', (event) => {
      document.getElementById(
        'generate-report-card-btn'
      ).disabled = !event.target.value;
    });

  document
    .getElementById(
      'generate-report-card-btn'
    )
    .addEventListener('click', async () => {
      const studentId =
        document.getElementById(
          'report-student-select'
        ).value;

      const streamId =
        document.getElementById(
          'report-stream-select'
        ).value;

      if (!studentId) {
        return showToast(
          'Please select a student',
          'error'
        );
      }

      await generateReportCard(
        studentId,
        streamId
      );
    });

  document
    .getElementById(
      'generate-class-report-btn'
    )
    .addEventListener('click', async () => {
      const streamId =
        document.getElementById(
          'class-report-stream-select'
        ).value;

      if (!streamId) {
        return showToast(
          'Please select a stream',
          'error'
        );
      }

      await generateClassReport(
        streamId,
        streams
      );
    });
}

async function generateReportCard(
  studentId,
  streamId
) {
  showToast('Generating PDF...');

  const [
    student,
    scores,
    classResults
  ] = await Promise.all([
    api.students.getOne(studentId),
    api.scores.getStudentScores(studentId),
    api.scores.getClassResults(streamId)
  ]);

  const ranking =
    classResults.find(
      result => result.id == studentId
    );

  const position =
    ranking?.position || 'N/A';

  const classSize =
    classResults.length;

  const totalMarks =
    ranking?.total_marks || 0;

  const average =
    ranking?.average || 0;

  const grade =
    ranking?.grade || 'N/A';

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFillColor(18, 24, 48);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);

  doc.text(
    'IKONEX ACADEMY',
    105,
    16,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  doc.text(
    'Student Report Card',
    105,
    25,
    { align: 'center' }
  );

  const tableBody = scores.map(
    score => [
      score.subject_name,
      score.subject_code,
      score.cat_score,
      score.exam_score,
      score.total_score,
      score.grade || 'N/A',
      score.remarks || ''
    ]
  );

  doc.autoTable({
    startY: 85,
    head: [[
      'Subject',
      'Code',
      'CAT /50',
      'Exam /50',
      'Total /100',
      'Grade',
      'Remarks'
    ]],
    body: tableBody,
    theme: 'grid'
  });

  doc.save(
    `${student.admission_number}_ReportCard.pdf`
  );

  showToast(
    'Report card downloaded'
  );
}

async function generateClassReport(
  streamId,
  streams
) {
  showToast(
    'Generating class report...'
  );

  const ranked =
    await api.scores.getClassResults(
      streamId
    );

  const stream = streams.find(
    s => s.id == streamId
  );

  if (!ranked.length) {
    return showToast(
      'No results found for this stream',
      'error'
    );
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  doc.autoTable({
    head: [[
      'Position',
      'Name',
      'Admission No.',
      'Subjects Taken',
      'Total Marks',
      'Average',
      'Grade',
      'Remarks'
    ]],

    body: ranked.map(student => [
      student.position,
      `${student.first_name} ${student.last_name}`,
      student.admission_number,
      student.subjects_taken,
      student.total_marks,
      student.average,
      student.grade || 'N/A',
      student.remarks || ''
    ])
  });

  doc.save(
    `${stream?.name}_ClassReport.pdf`
  );

  showToast(
    'Class report downloaded'
  );
}
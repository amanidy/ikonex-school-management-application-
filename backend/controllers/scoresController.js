const db = require('../db/connection');

exports.recordScore = async (req, res) => {
  const { student_id, subject_id, cat_score, exam_score } = req.body;
  if (!student_id || !subject_id) {
    return res.status(400).json({ error: 'student_id and subject_id are required' });
  }
  if (cat_score < 0 || cat_score > 50 || exam_score < 0 || exam_score > 50) {
    return res.status(400).json({ error: 'CAT score must be 0-50, Exam score must be 0-50' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO scores (student_id, subject_id, cat_score, exam_score) 
       VALUES (?, ?, ?, ?)`,
      [student_id, subject_id, cat_score, exam_score]
    );
    res.status(201).json({ id: result.insertId, message: 'Score recorded' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Score already exists for this student and subject. Use edit to update.' 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.updateScore = async (req, res) => {
  const { cat_score, exam_score } = req.body;
  if (cat_score < 0 || cat_score > 50 || exam_score < 0 || exam_score > 50) {
    return res.status(400).json({ error: 'Scores out of valid range' });
  }
  try {
    await db.query(
      'UPDATE scores SET cat_score=?, exam_score=? WHERE id=?',
      [cat_score, exam_score, req.params.id]
    );
    res.json({ message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentScores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sc.*, sub.name as subject_name, sub.code,
              gc.grade, gc.remarks
       FROM scores sc
       JOIN subjects sub ON sc.subject_id = sub.id
       LEFT JOIN grade_config gc ON sc.total_score BETWEEN gc.min_score AND gc.max_score
       WHERE sc.student_id = ?
       ORDER BY sub.name`,
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClassSubjectScores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT st.first_name, st.last_name, st.admission_number,
              sc.cat_score, sc.exam_score, sc.total_score,
              gc.grade
       FROM students st
       LEFT JOIN scores sc ON st.id = sc.student_id AND sc.subject_id = ?
       LEFT JOIN grade_config gc ON sc.total_score BETWEEN gc.min_score AND gc.max_score
       WHERE st.stream_id = ?
       ORDER BY sc.total_score DESC`,
      [req.params.subjectId, req.params.streamId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClassResults = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        st.id, st.first_name, st.last_name, st.admission_number,
        COALESCE(SUM(sc.total_score), 0) AS total_marks,
        COUNT(sc.subject_id) AS subjects_taken,
        CASE 
          WHEN COUNT(sc.subject_id) > 0 
          THEN ROUND(SUM(sc.total_score) / COUNT(sc.subject_id), 2)
          ELSE 0
        END AS average,
        gc.grade
       FROM students st
       LEFT JOIN scores sc ON st.id = sc.student_id
       LEFT JOIN grade_config gc ON 
         ROUND(SUM(sc.total_score) / NULLIF(COUNT(sc.subject_id), 0), 2) 
         BETWEEN gc.min_score AND gc.max_score
       WHERE st.stream_id = ?
       GROUP BY st.id
       ORDER BY total_marks DESC`,
      [req.params.streamId]
    );

    const ranked = rows.map((student, index) => ({
      ...student,
      position: index + 1
    }));

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
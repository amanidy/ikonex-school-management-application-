const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const { stream } = req.query;
    let query = `
      SELECT st.*, s.name as stream_name 
      FROM students st 
      JOIN streams s ON st.stream_id = s.id
    `;
    const params = [];
    if (stream) {
      query += ' WHERE st.stream_id = ?';
      params.push(stream);
    }
    query += ' ORDER BY st.last_name, st.first_name';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT st.*, s.name as stream_name 
       FROM students st 
       JOIN streams s ON st.stream_id = s.id 
       WHERE st.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { first_name, last_name, admission_number, stream_id, date_of_birth, gender } = req.body;
  if (!first_name || !last_name || !admission_number || !stream_id) {
    return res.status(400).json({ error: 'First name, last name, admission number, and stream are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO students 
       (first_name, last_name, admission_number, stream_id, date_of_birth, gender) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, admission_number, stream_id, date_of_birth || null, gender || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Student registered' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Admission number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { first_name, last_name, admission_number, stream_id, date_of_birth, gender } = req.body;
  try {
    await db.query(
      `UPDATE students SET 
       first_name=?, last_name=?, admission_number=?, 
       stream_id=?, date_of_birth=?, gender=? 
       WHERE id=?`,
      [first_name, last_name, admission_number, stream_id, date_of_birth || null, gender || null, req.params.id]
    );
    res.json({ message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
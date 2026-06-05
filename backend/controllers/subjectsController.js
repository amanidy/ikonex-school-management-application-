const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Subject not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO subjects (name, code) VALUES (?, ?)',
      [name.trim(), code.trim().toUpperCase()]
    );
    res.status(201).json({ id: result.insertId, name, code });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Subject code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, code } = req.body;
  try {
    await db.query(
      'UPDATE subjects SET name=?, code=? WHERE id=?',
      [name, code.toUpperCase(), req.params.id]
    );
    res.json({ message: 'Subject updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignToStream = async (req, res) => {
  const { stream_id, subject_id } = req.body;
  if (!stream_id || !subject_id) {
    return res.status(400).json({ error: 'stream_id and subject_id are required' });
  }
  try {
    const [existing] = await db.query(
      'SELECT 1 FROM stream_subjects WHERE stream_id = ? AND subject_id = ?',
      [stream_id, subject_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'This subject is already assigned to that stream.'
      });
    }
    await db.query(
      'INSERT INTO stream_subjects (stream_id, subject_id) VALUES (?, ?)',
      [stream_id, subject_id]
    );
    res.status(201).json({ message: 'Subject assigned to stream successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByStream = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sub.* FROM subjects sub
       JOIN stream_subjects ss ON sub.id = ss.subject_id
       WHERE ss.stream_id = ?`,
      [req.params.streamId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
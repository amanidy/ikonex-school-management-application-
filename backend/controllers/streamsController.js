const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM streams ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, COUNT(st.id) as student_count 
       FROM streams s 
       LEFT JOIN students st ON s.id = st.stream_id 
       WHERE s.id = ? 
       GROUP BY s.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Stream not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Stream name is required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO streams (name) VALUES (?)',
      [name.trim()]
    );
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Stream name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Stream name is required' });
  }
  try {
    await db.query('UPDATE streams SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    res.json({ message: 'Stream updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [students] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE stream_id = ?',
      [req.params.id]
    );
    if (students[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete stream with enrolled students' 
      });
    }
    await db.query('DELETE FROM streams WHERE id = ?', [req.params.id]);
    res.json({ message: 'Stream deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scoresController');

router.post('/', ctrl.recordScore);
router.put('/:id', ctrl.updateScore);
router.get('/student/:studentId', ctrl.getStudentScores);
router.get('/class/:streamId/subject/:subjectId', ctrl.getClassSubjectScores);
router.get('/results/:streamId', ctrl.getClassResults);

module.exports = router;
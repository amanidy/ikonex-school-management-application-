const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectsController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/assign', ctrl.assignToStream);
router.get('/stream/:streamId', ctrl.getByStream);

module.exports = router;
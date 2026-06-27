const express = require('express');
const router = express.Router();
const {
  getAllCamps,
  createCamp,
  getCampById,
  updateCamp,
  deleteCamp,
} = require('../controllers/campController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAllCamps)
  .post(protect, createCamp);

router.route('/:id')
  .get(protect, getCampById)
  .put(protect, updateCamp)
  .delete(protect, deleteCamp);

module.exports = router;

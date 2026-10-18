const router = require('express').Router();
const { Scholarship } = require('../models');

router.get('/', async (req, res) => {
  res.json({ scholarships: await Scholarship.find().sort('title') });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/branches - Get all branches
router.get('/', asyncHandler(async (req, res) => {
    const query = `
        SELECT
            branch_id,
            name,
            address,
            phone,
            floor_count
        FROM branches
        ORDER BY name
    `;

    const [branches] = await db.query(query);

    res.status(200).json({
        success: true,
        message: 'Branches retrieved successfully',
        data: branches
    });
}));

module.exports = router;

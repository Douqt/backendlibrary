const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/publishers - get all publishers
router.get('/', asyncHandler(async(req, res) =>{
    const [publishers] = await db.query(`
        SELECT
            publisher_id,
            name
        FROM publishers
        ORDER BY name
    `);

    res.json({
        success: true,
        count: publishers.length,
        data: publishers
    });
}));

//GET /api/publishers/:id - get a single publisher by publisher_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[publishers] = await db.query(`
        SELECT
            publisher_id,
            name
        FROM publishers
        WHERE publisher_id = ?
    `, [id]);

    if (publishers.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Publisher not found'
        });
    }

    res.json({
        success: true,
        data: publishers[0]
    });
}));

//POST /api/publishers - Add new publisher
router.post('/', asyncHandler(async(req, res) => {
    const { name } = req.body;

    // Validate required fields
    if(!name || !name.trim()){
        return res.status(400).json({
            success: false,
            message: 'Please provide a publisher name'
        });
    }

    // Check if publisher already exists
    const [existingPublisher] = await db.query(
        'SELECT publisher_id FROM publishers WHERE name = ?',
        [name.trim()]
    );

    if(existingPublisher.length > 0){
        return res.status(409).json({
            success: false,
            message: 'Publisher with this name already exists'
        });
    }

    // Insert publisher
    const [result] = await db.query(
        `INSERT INTO publishers (name) VALUES (?)`,
        [name.trim()]
    );

    res.status(201).json({
        success: true,
        message: 'Publisher created successfully!',
        data: {
            publisher_id: result.insertId,
            name: name.trim()
        }
    });
}));

module.exports = router;

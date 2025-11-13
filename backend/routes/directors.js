const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/directors - get all directors
router.get('/', asyncHandler(async(req, res) =>{
    const [directors] = await db.query(`
        SELECT
            director_id,
            name
        FROM directors
        ORDER BY name
    `);

    res.json({
        success: true,
        count: directors.length,
        data: directors
    });
}));

//GET /api/directors/:id - get a single director by director_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[directors] = await db.query(`
        SELECT
            director_id,
            name
        FROM directors
        WHERE director_id = ?
    `, [id]);

    if (directors.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Director not found'
        });
    }

    res.json({
        success: true,
        data: directors[0]
    });
}));

//POST /api/directors - Add new director
router.post('/', asyncHandler(async(req, res) => {
    const { name } = req.body;

    // Validate required fields
    if(!name || !name.trim()){
        return res.status(400).json({
            success: false,
            message: 'Please provide a director name'
        });
    }

    // Check if director already exists
    const [existingDirector] = await db.query(
        'SELECT director_id FROM directors WHERE name = ?',
        [name.trim()]
    );

    if(existingDirector.length > 0){
        return res.status(409).json({
            success: false,
            message: 'Director with this name already exists'
        });
    }

    // Insert director
    const [result] = await db.query(
        `INSERT INTO directors (name) VALUES (?)`,
        [name.trim()]
    );

    res.status(201).json({
        success: true,
        message: 'Director created successfully!',
        data: {
            director_id: result.insertId,
            name: name.trim()
        }
    });
}));

module.exports = router;

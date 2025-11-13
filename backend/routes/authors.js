const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/authors - get all authors
router.get('/', asyncHandler(async(req, res) =>{
    const [authors] = await db.query(`
        SELECT
            author_id,
            name
        FROM authors
        ORDER BY name
    `);

    res.json({
        success: true,
        count: authors.length,
        data: authors
    });
}));

//GET /api/authors/:id - get a single author by author_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[authors] = await db.query(`
        SELECT
            author_id,
            name
        FROM authors
        WHERE author_id = ?
    `, [id]);

    if (authors.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Author not found'
        });
    }

    res.json({
        success: true,
        data: authors[0]
    });
}));

//POST /api/authors - Add new author
router.post('/', asyncHandler(async(req, res) => {
    const { name } = req.body;

    // Validate required fields
    if(!name || !name.trim()){
        return res.status(400).json({
            success: false,
            message: 'Please provide an author name'
        });
    }

    // Check if author already exists
    const [existingAuthor] = await db.query(
        'SELECT author_id FROM authors WHERE name = ?',
        [name.trim()]
    );

    if(existingAuthor.length > 0){
        return res.status(409).json({
            success: false,
            message: 'Author with this name already exists'
        });
    }

    // Insert author
    const [result] = await db.query(
        `INSERT INTO authors (name) VALUES (?)`,
        [name.trim()]
    );

    res.status(201).json({
        success: true,
        message: 'Author created successfully!',
        data: {
            author_id: result.insertId,
            name: name.trim()
        }
    });
}));

module.exports = router;

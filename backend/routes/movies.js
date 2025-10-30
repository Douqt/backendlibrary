const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/movies - get all movies with directors
router.get('/', asyncHandler(async(req, res) =>{
    const { search, available } = req.query;

    let whereClause = '';
    const params = [];

    if (search) {
        whereClause += whereClause ? ' AND (m.title LIKE ? OR d.name LIKE ?)' : 'WHERE (m.title LIKE ? OR d.name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (available === 'true') {
        whereClause += whereClause ? ' AND (m.available = 1 AND m.copy_amount > 0)' : ' WHERE (m.available = 1 AND m.copy_amount > 0)';
    } else if (available === 'false') {
        whereClause += whereClause ? ' AND (m.available = 0 OR m.copy_amount = 0)' : ' WHERE (m.available = 0 OR m.copy_amount = 0)';
    }

    //query to get all movies w their directors
    const [movies] = await db.query(`
        SELECT
            m.movie_id,
            m.title,
            m.isan,
            m.release_date,
            m.media_type,
            m.location_section,
            m.available,
            m.copy_amount,
            b.name as branch_name,
            CONCAT(b.name, ' - ', b.address) as branch_info,
            d.name as director_name,
            p.name as publisher_name
        FROM movies m
        LEFT JOIN branches b ON m.branch_id = b.branch_id
        LEFT JOIN directors d ON m.director_id = d.director_id
        LEFT JOIN publishers p ON m.publisher_id = p.publisher_id
        ${whereClause}
        ORDER BY m.title
    `, params);

    res.json({
        success: true,
        count: movies.length,
        data: movies
    });
}));

//GET /api/movies/:id - get a single movie by movie_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[movies] = await db.query(`
        SELECT
            m.movie_id,
            m.title,
            m.isan,
            m.release_date,
            m.media_type,
            m.location_section,
            m.available,
            m.copy_amount,
            b.name as branch_name,
            d.name as director_name,
            p.name as publisher_name
        FROM movies m
        LEFT JOIN branches b ON m.branch_id = b.branch_id
        LEFT JOIN directors d ON m.director_id = d.director_id
        LEFT JOIN publishers p ON m.publisher_id = p.publisher_id
        WHERE m.movie_id = ?
    `, [id]);

    if (movies.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Movie not found'
        });
    }

    res.json({
        success: true,
        data: movies[0]
    });
}));

module.exports = router;

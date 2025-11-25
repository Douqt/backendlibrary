const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/movies - get all movies with directors
router.get('/', asyncHandler(async(req, res) =>{
    const { search, available, branch_id } = req.query;

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

    if (branch_id) {
        whereClause += whereClause ? ' AND m.branch_id = ?' : ' WHERE m.branch_id = ?';
        params.push(branch_id);
    }

    // Debug logging
    console.log('Movies API Query:', `${whereClause} AND m.deleted_at IS NULL`);
    console.log('Movies API Params:', params);

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
        ${whereClause} AND m.deleted_at IS NULL
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
        WHERE m.movie_id = ? AND m.deleted_at IS NULL
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

//POST /api/movies - Add new movie
router.post('/', asyncHandler(async(req, res) => {
    const {
        branch_id,
        title,
        isan,
        release_date,
        director_id,
        publisher_id,
        media_type,
        location_section,
        copy_amount,
        available
    } = req.body;

    // Validate required fields
    if(!branch_id || !title || !location_section || copy_amount === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, title, location_section, and copy_amount'
        });
    }

    // Validate media_type enum if provided
    if(media_type && !['DVD', 'Blu-ray', 'Digital', 'VHS'].includes(media_type)){
        return res.status(400).json({
            success: false,
            message: 'media_type must be one of: DVD, Blu-ray, Digital, VHS'
        });
    }

    // Validate copy_amount is non-negative
    if(copy_amount < 0){
        return res.status(400).json({
            success: false,
            message: 'copy_amount must be greater than or equal to 0'
        });
    }

    // Insert movie
    const [result] = await db.query(
        `INSERT INTO movies
        (branch_id, title, isan, release_date, director_id, publisher_id, media_type, location_section, copy_amount, available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            branch_id,
            title,
            isan || null,
            release_date || null,
            director_id || null,
            publisher_id || null,
            media_type || 'DVD',
            location_section,
            copy_amount,
            available !== undefined ? available : true
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Movie created successfully!',
        data: {
            movie_id: result.insertId,
            branch_id,
            title,
            isan,
            release_date,
            director_id,
            publisher_id,
            media_type: media_type || 'DVD',
            location_section,
            copy_amount,
            available: available !== undefined ? available : true
        }
    });
}));

//PUT /api/movies/:id - update movie by movie_id
router.put('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;
    const {
        branch_id,
        title,
        isan,
        release_date,
        director_id,
        publisher_id,
        media_type,
        location_section,
        copy_amount,
        available
    } = req.body;

    // Validate required fields
    if(!branch_id || !title || !location_section || copy_amount === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, title, location_section, and copy_amount'
        });
    }

    // Validate media_type enum if provided
    if(media_type && !['DVD', 'Blu-ray', 'Digital', 'VHS'].includes(media_type)){
        return res.status(400).json({
            success: false,
            message: 'media_type must be one of: DVD, Blu-ray, Digital, VHS'
        });
    }

    // Validate copy_amount is non-negative
    if(copy_amount < 0){
        return res.status(400).json({
            success: false,
            message: 'copy_amount must be greater than or equal to 0'
        });
    }

    // Check if movie exists
    const [existingMovie] = await db.query(
        'SELECT movie_id FROM movies WHERE movie_id = ?',
        [id]
    );

    if(existingMovie.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Movie not found or has been deleted'
        });
    }

    // Update movie
    const [result] = await db.query(`
        UPDATE movies
        SET
            branch_id = ?,
            title = ?,
            isan = ?,
            release_date = ?,
            director_id = ?,
            publisher_id = ?,
            media_type = ?,
            location_section = ?,
            copy_amount = ?,
            available = ?
        WHERE movie_id = ?
        `,
        [
            branch_id,
            title,
            isan || null,
            release_date || null,
            director_id || null,
            publisher_id || null,
            media_type || 'DVD',
            location_section,
            copy_amount,
            available !== undefined ? available : true,
            id
        ]
    );

    if (result.affectedRows === 0){
        return res.status(404).json({
            success: false,
            message: 'Movie not found'
        });
    }

    return res.json({
        success: true,
        message: 'Movie updated successfully',
        data: {
            movie_id: id,
            branch_id,
            title,
            isan,
            release_date,
            director_id,
            publisher_id,
            media_type: media_type || 'DVD',
            location_section,
            copy_amount,
            available: available !== undefined ? available : true
        }
    });
}));

//DELETE /api/movies/:id - soft delete a movie by movie_id
router.delete('/:id', asyncHandler(async(req, res) => {
    const {id} = req.params;

    // Check if movie exists and is not deleted
    const [existingMovie] = await db.query(
        'SELECT movie_id FROM movies WHERE movie_id = ? AND deleted_at IS NULL',
        [id]
    );

    if(existingMovie.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Movie not found or already deleted'
        });
    }

    // Soft delete
    const [result] = await db.query(
        'UPDATE movies SET deleted_at = NOW() WHERE movie_id = ?',
        [id]
    );

    if (result.affectedRows === 0){
        return res.status(404).json({
            success: false,
            message: 'Movie not found'
        });
    }

    return res.json({
        success: true,
        message: 'Movie deleted successfully'
    });
}));

module.exports = router;

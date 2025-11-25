const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/articles - get all articles with authors
router.get('/', asyncHandler(async(req, res) =>{
    const { search, available, branch_id } = req.query;

    let whereClause = '';
    const params = [];

    if (search) {
        whereClause = 'WHERE a.title LIKE ?';
        params.push(`%${search}%`);
    }

    if (available === 'true') {
        whereClause += whereClause ? ' AND a.available = 1 AND a.copies > 0' : ' WHERE a.available = 1 AND a.copies > 0';
    } else if (available === 'false') {
        whereClause += whereClause ? ' AND (a.available = 0 OR a.copies = 0)' : ' WHERE (a.available = 0 OR a.copies = 0)';
    }

    if (branch_id) {
        whereClause += whereClause ? ' AND a.branch_id = ?' : ' WHERE a.branch_id = ?';
        params.push(branch_id);
    }

    //query to get all articles w their authors
    const [articles] = await db.query(`
        SELECT
            a.artic_id as article_id,
            a.title,
            a.issn,
            a.copies,
            a.available,
            b.name as branch_name,
            CONCAT(b.name, ' - ', b.address) as branch_info,
            p.name as publisher_name,
            GROUP_CONCAT(au.name SEPARATOR ', ') as authors
        FROM articles a
        LEFT JOIN branches b ON a.branch_id = b.branch_id
        LEFT JOIN publishers p ON a.publisher_id = p.publisher_id
        LEFT JOIN article_authors aa ON a.artic_id = aa.artic_id
        LEFT JOIN authors au ON aa.author_id = au.author_id
        ${whereClause} AND a.deleted_at IS NULL
        GROUP BY a.artic_id
        ORDER BY a.title
    `, params);

    res.json({
        success: true,
        count: articles.length,
        data: articles
    });
}));

//GET /api/articles/:id - get a single article by artic_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[articles] = await db.query(`
        SELECT
            a.artic_id as article_id,
            a.title,
            a.issn,
            a.copies,
            a.available,
            b.name as branch_name,
            p.name as publisher_name,
            GROUP_CONCAT(au.name SEPARATOR ', ') as authors
        FROM articles a
        LEFT JOIN branches b ON a.branch_id = b.branch_id
        LEFT JOIN publishers p ON a.publisher_id = p.publisher_id
        LEFT JOIN article_authors aa ON a.artic_id = aa.artic_id
        LEFT JOIN authors au ON aa.author_id = au.author_id
        WHERE a.artic_id = ? AND a.deleted_at IS NULL
        GROUP BY a.artic_id
    `, [id]);

    if (articles.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Article not found'
        });
    }

    res.json({
        success: true,
        data: articles[0]
    });
}));

//POST /api/articles - Add new article
router.post('/', asyncHandler(async(req, res) => {
    const {
        branch_id,
        title,
        issn,
        publisher_id,
        copies,
        available
    } = req.body;

    // Validate required fields
    if(!branch_id || !title || copies === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, title, and copies'
        });
    }

    // Validate copies is non-negative
    if(copies < 0){
        return res.status(400).json({
            success: false,
            message: 'copies must be greater than or equal to 0'
        });
    }

    // Insert article
    const [result] = await db.query(
        `INSERT INTO articles
        (branch_id, title, issn, publisher_id, copies, available)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            branch_id,
            title,
            issn || null,
            publisher_id || null,
            copies,
            available !== undefined ? available : true
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Article created successfully!',
        data: {
            article_id: result.insertId,
            branch_id,
            title,
            issn,
            publisher_id,
            copies,
            available: available !== undefined ? available : true
        }
    });
}));

//PUT /api/articles/:id - update article by artic_id
router.put('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;
    const {
        branch_id,
        title,
        issn,
        publisher_id,
        copies,
        available
    } = req.body;

    // Validate required fields
    if(!branch_id || !title || copies === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, title, and copies'
        });
    }

    // Validate copies is non-negative
    if(copies < 0){
        return res.status(400).json({
            success: false,
            message: 'copies must be greater than or equal to 0'
        });
    }

    // Check if article exists
    const [existingArticle] = await db.query(
        'SELECT artic_id FROM articles WHERE artic_id = ?',
        [id]
    );

    if(existingArticle.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Article not found or has been deleted'
        });
    }

    // Update article
    const [result] = await db.query(`
        UPDATE articles
        SET
            branch_id = ?,
            title = ?,
            issn = ?,
            publisher_id = ?,
            copies = ?,
            available = ?
        WHERE artic_id = ?
        `,
        [
            branch_id,
            title,
            issn || null,
            publisher_id || null,
            copies,
            available !== undefined ? available : true,
            id
        ]
    );

    if (result.affectedRows === 0){
        return res.status(404).json({
            success: false,
            message: 'Article not found'
        });
    }

    return res.json({
        success: true,
        message: 'Article updated successfully',
        data: {
            article_id: id,
            branch_id,
            title,
            issn,
            publisher_id,
            copies,
            available: available !== undefined ? available : true
        }
    });
}));

//DELETE /api/articles/:id - soft delete an article by artic_id
router.delete('/:id', asyncHandler(async(req, res) => {
    const {id} = req.params;

    // Check if article exists and is not deleted
    const [existingArticle] = await db.query(
        'SELECT artic_id FROM articles WHERE artic_id = ? AND deleted_at IS NULL',
        [id]
    );

    if(existingArticle.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Article not found or already deleted'
        });
    }

    // Soft delete
    const [result] = await db.query(
        'UPDATE articles SET deleted_at = NOW() WHERE artic_id = ?',
        [id]
    );

    if (result.affectedRows === 0){
        return res.status(404).json({
            success: false,
            message: 'Article not found'
        });
    }

    return res.json({
        success: true,
        message: 'Article deleted successfully'
    });
}));

module.exports = router;

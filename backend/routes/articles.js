const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/articles - get all articles with authors
router.get('/', asyncHandler(async(req, res) =>{
    const { search, available } = req.query;

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
        ${whereClause}
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
        WHERE a.artic_id = ?
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

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/books - get all books
router.get('/', asyncHandler(async(req, res) =>{
    const { search, available } = req.query;

    let whereClause = '';
    const params = [];

    if (search) {
        whereClause += whereClause ? ' AND (b.title LIKE ? OR a.name LIKE ?)' : 'WHERE (b.title LIKE ? OR a.name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (available === 'true') {
        whereClause += whereClause ? ' AND (b.available = 1 AND b.copies > 0)' : ' WHERE (b.available = 1 AND b.copies > 0)';
    } else if (available === 'false') {
        whereClause += whereClause ? ' AND (b.available = 0 OR b.copies = 0)' : ' WHERE (b.available = 0 OR b.copies = 0)';
    }

    //query to get all books w their authors
    const [books] = await db.query(`
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.publication_year,
            b.version_type,
            b.copies,
            b.available,
            b.branch_id,
            b.section_descriptor,
            b.section_floor,
            p.name as publisher_name,
            br.name as branch_name,
            CONCAT(br.name, ' - ', br.address) as branch_info,
            GROUP_CONCAT(a.name SEPARATOR ', ') as authors
        FROM books b
        LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
        LEFT JOIN book_authors ba ON b.book_id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.author_id
        LEFT JOIN branches br ON b.branch_id = br.branch_id
        ${whereClause}
        GROUP BY b.book_id
        ORDER BY b.title
    `, params);

    res.json({
        success: true,
        count: books.length,
        data: books
    });
}));

//GET /api/books/:id - get a single book by book_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[books] = await db.query(`
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.publication_year,
            b.version_type,
            b.copies,
            b.available,
            b.branch_id,
            b.section_descriptor,
            b.section_floor,
            p.name as publisher_name,
            GROUP_CONCAT(a.name SEPARATOR ', ') as authors
        FROM books b
        LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
        LEFT JOIN book_authors ba ON b.book_id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.author_id
        WHERE b.book_id = ?
        GROUP BY b.book_id
    `, [id]);

    if (books.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    res.json({
        success: true,
        data: books[0]
    });
}));

//POST /api/books - Add new book
router.post('/', asyncHandler(async(req, res) => {
    const {
        branch_id,
        title,
        isbn,
        publication_year,
        publisher_id,
        version_type,
        copies,
        available,
        section_descriptor,
        section_floor
    } = req.body;

    // Validate required fields
    if(!branch_id || !title || !section_descriptor || section_floor === undefined || copies === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, title, section_descriptor, section_floor, and copies'
        });
    }

    // Validate version_type enum if provided          
    if(version_type && !['digital', 'physical'].includes(version_type)){
        return res.status(400).json({
            success: false,
            message: 'version_type must be either "digital" or "physical"'
        });
    }

    // Validate copies is non-negative
    if(copies < 0){
        return res.status(400).json({
            success: false,
            message: 'copies must be greater than or equal to 0'
        });
    }

    // Insert book
    const [result] = await db.query(
        `INSERT INTO books
        (branch_id, title, isbn, publication_year, publisher_id, version_type, copies, available, section_descriptor, section_floor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            branch_id,
            title,
            isbn || null,
            publication_year || null,
            publisher_id || null,
            version_type || 'physical',
            copies,
            available !== undefined ? available : true,
            section_descriptor,
            section_floor
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Book created successfully!',
        data: {
            book_id: result.insertId,
            branch_id,
            title,
            isbn,
            publication_year,
            publisher_id,
            version_type: version_type || 'physical',
            copies,
            available: available !== undefined ? available : true,
            section_descriptor,
            section_floor
        }
    });
}));

//PUT /api/books/:id - update book by book_id
router.put('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;
    const {
        branch_id,
        title,
        isbn,
        publication_year,
        publisher_id,
        version_type,
        copies,
        available,
        section_descriptor,
        section_floor
    } = req.body;

    // Validate required fields
    if(!branch_id || !title || !section_descriptor || section_floor === undefined || copies === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, title, section_descriptor, section_floor, and copies'
        });
    }

    // Validate version_type enum if provided
    if(version_type && !['digital', 'physical'].includes(version_type)){
        return res.status(400).json({
            success: false,
            message: 'version_type must be either "digital" or "physical"'
        });
    }

    // Validate copies is non-negative
    if(copies < 0){
        return res.status(400).json({
            success: false,
            message: 'copies must be greater than or equal to 0'
        });
    }

    // Check if book exists
    const [existingBook] = await db.query(
        'SELECT book_id FROM books WHERE book_id = ?',
        [id]
    );

    if(existingBook.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Book not found or has been deleted'
        });
    }

    // Update book
    const [result] = await db.query(`
        UPDATE books
        SET
            branch_id = ?,
            title = ?,
            isbn = ?,
            publication_year = ?,
            publisher_id = ?,
            version_type = ?,
            copies = ?,
            available = ?,
            section_descriptor = ?,
            section_floor = ?
        WHERE book_id = ?
        `,
        [
            branch_id,
            title,
            isbn || null,
            publication_year || null,
            publisher_id || null,
            version_type || 'physical',
            copies,
            available !== undefined ? available : true,
            section_descriptor,
            section_floor,
            id
        ]
    );

    if (result.affectedRows === 0){
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    return res.json({
        success: true,
        message: 'Book updated successfully',
        data: {
            book_id: id,
            branch_id,
            title,
            isbn,
            publication_year,
            publisher_id,
            version_type: version_type || 'physical',
            copies,
            available: available !== undefined ? available : true,
            section_descriptor,
            section_floor
        }
    });
}));

//DELETE /api/books/:id - delete a book by book_id
router.delete('/:id', asyncHandler(async(req, res) => {
    const {id} = req.params;

    // Check if book exists
    const [existingBook] = await db.query(
        'SELECT book_id FROM books WHERE book_id = ?',
        [id]
    );

    if(existingBook.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    // Hard delete
    const [result] = await db.query(
        'DELETE FROM books WHERE book_id = ?',
        [id]
    );

    if (result.affectedRows === 0){
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    return res.json({
        success: true,
        message: 'Book deleted successfully'
    });
}));

module.exports = router;

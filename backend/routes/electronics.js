const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/electronics - get all electronics
router.get('/', asyncHandler(async(req, res) =>{
    const { search, available } = req.query;

    let whereClause = '';
    const params = [];

    if (search) {
        whereClause += whereClause ? ' AND (e.device_name LIKE ? OR e.maker LIKE ?)' : 'WHERE (e.device_name LIKE ? OR e.maker LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (available === 'true') {
        whereClause += whereClause ? ' AND (e.available = 1 AND e.copy_amount > 0)' : ' WHERE (e.available = 1 AND e.copy_amount > 0)';
    } else if (available === 'false') {
        whereClause += whereClause ? ' AND (e.available = 0 OR e.copy_amount = 0)' : ' WHERE (e.available = 0 OR e.copy_amount = 0)';
    }

    //query to get all electronics
    const [electronics] = await db.query(`
        SELECT
            e.libra_id as electronics_id,
            e.device_name,
            e.serial_num,
            e.manufact_date,
            e.maker,
            e.available,
            e.copy_amount,
            b.name as branch_name,
            CONCAT(b.name, ' - ', b.address) as branch_info
        FROM electronics e
        LEFT JOIN branches b ON e.branch_id = b.branch_id
        ${whereClause}
        ORDER BY e.device_name
    `, params);

    res.json({
        success: true,
        count: electronics.length,
        data: electronics
    });
}));

//GET /api/electronics/:id - get a single electronics by libra_id
router.get('/:id', asyncHandler(async (req, res) => {
    const{id} = req.params;

    const[electronics] = await db.query(`
        SELECT
            e.libra_id as electronics_id,
            e.device_name,
            e.serial_num,
            e.manufact_date,
            e.maker,
            e.available,
            e.copy_amount,
            b.name as branch_name
        FROM electronics e
        LEFT JOIN branches b ON e.branch_id = b.branch_id
        WHERE e.libra_id = ?
    `, [id]);

    if (electronics.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Electronics item not found'
        });
    }

    res.json({
        success: true,
        data: electronics[0]
    });
}));

//POST /api/electronics - Add new electronics item
router.post('/', asyncHandler(async(req, res) => {
    const {
        branch_id,
        device_name,
        serial_num,
        manufact_date,
        maker,
        copy_amount,
        available
    } = req.body;

    // Validate required fields
    if(!branch_id || !device_name || copy_amount === undefined){
        return res.status(400).json({
            success: false,
            message: 'Please provide branch_id, device_name, and copy_amount'
        });
    }

    // Validate copy_amount is non-negative
    if(copy_amount < 0){
        return res.status(400).json({
            success: false,
            message: 'copy_amount must be greater than or equal to 0'
        });
    }

    // Insert electronics item
    const [result] = await db.query(
        `INSERT INTO electronics
        (branch_id, device_name, serial_num, manufact_date, maker, copy_amount, available)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            branch_id,
            device_name,
            serial_num || null,
            manufact_date || null,
            maker || null,
            copy_amount,
            available !== undefined ? available : true
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Electronics item created successfully!',
        data: {
            electronics_id: result.insertId,
            branch_id,
            device_name,
            serial_num,
            manufact_date,
            maker,
            copy_amount,
            available: available !== undefined ? available : true
        }
    });
}));

module.exports = router;

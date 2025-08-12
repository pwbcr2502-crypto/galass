const { query } = require('../config/database');

class Employee {
  constructor(data = {}) {
    this.id = data.id;
    this.empNo = data.emp_no;
    this.name = data.name;
    this.department = data.department;
    this.mobile = data.mobile;
    this.status = data.status || 1;
    this.lastLoginAt = data.last_login_at;
    this.createdAt = data.created_at;
  }

  // Find employee by employee number
  static async findByEmpNo(empNo) {
    const result = await query(
      'SELECT * FROM employees WHERE emp_no = $1 AND status = 1',
      [empNo]
    );
    return result.rows.length > 0 ? new Employee(result.rows[0]) : null;
  }

  // Find employee by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM employees WHERE id = $1 AND status = 1',
      [id]
    );
    return result.rows.length > 0 ? new Employee(result.rows[0]) : null;
  }

  // Get all employees
  static async findAll(limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM employees WHERE status = 1 ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows.map(row => new Employee(row));
  }

  // Count total employees
  static async count() {
    const result = await query('SELECT COUNT(*) as total FROM employees WHERE status = 1');
    return parseInt(result.rows[0].total);
  }

  // Create new employee
  static async create(employeeData) {
    const { empNo, name, department, mobile } = employeeData;
    const result = await query(
      `INSERT INTO employees (emp_no, name, department, mobile, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [empNo, name, department, mobile]
    );
    return new Employee(result.rows[0]);
  }

  // Batch create employees
  static async batchCreate(employeeList) {
    const values = employeeList.map((emp, index) => {
      const baseIndex = index * 4;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
    }).join(', ');

    const params = employeeList.flatMap(emp => [
      emp.empNo, 
      emp.name, 
      emp.department || null, 
      emp.mobile || null
    ]);

    const result = await query(
      `INSERT INTO employees (emp_no, name, department, mobile) 
       VALUES ${values} 
       ON CONFLICT (emp_no) DO UPDATE SET 
         name = EXCLUDED.name,
         department = EXCLUDED.department,
         mobile = EXCLUDED.mobile
       RETURNING *`,
      params
    );

    return result.rows.map(row => new Employee(row));
  }

  // Update employee
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'empNo') {
        const dbKey = key === 'empNo' ? 'emp_no' : 
                      key === 'lastLoginAt' ? 'last_login_at' : key;
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this;
    }

    values.push(this.id);
    const result = await query(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length > 0) {
      Object.assign(this, new Employee(result.rows[0]));
    }

    return this;
  }

  // Update last login time
  async updateLastLogin() {
    await query(
      'UPDATE employees SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [this.id]
    );
    this.lastLoginAt = new Date();
    return this;
  }

  // Check if employee has voted for a specific program
  async hasVoted(eventId, programId) {
    const result = await query(
      'SELECT id FROM votes WHERE event_id = $1 AND program_id = $2 AND employee_id = $3',
      [eventId, programId, this.id]
    );
    return result.rows.length > 0;
  }

  // Get employee's votes for an event
  async getVotes(eventId) {
    const result = await query(
      `SELECT v.*, p.title as program_title, p.performer 
       FROM votes v 
       JOIN programs p ON v.program_id = p.id 
       WHERE v.event_id = $1 AND v.employee_id = $2 
       ORDER BY v.submitted_at DESC`,
      [eventId, this.id]
    );
    return result.rows;
  }

  // Soft delete employee
  async delete() {
    await query(
      'UPDATE employees SET status = 0 WHERE id = $1',
      [this.id]
    );
    this.status = 0;
    return this;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      empNo: this.empNo,
      name: this.name,
      department: this.department,
      mobile: this.mobile,
      status: this.status,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt
    };
  }
}

module.exports = Employee;
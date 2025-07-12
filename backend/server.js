const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // CORS 미들웨어 추가

const app = express();
const port = 3000;

// CORS 설정: 모든 출처에서의 요청을 허용
app.use(cors());
app.use(express.json()); // JSON 요청 본문 파싱

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./mywallet.db', (err) => {
    if (err) {
        console.error('SQLite 데이터베이스 연결 오류:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        // 트랜잭션 테이블 생성 (없을 경우)
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, -- 'income' 또는 'expense'
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL -- YYYY-MM-DD 형식
        )`, (createErr) => {
            if (createErr) {
                console.error('transactions 테이블 생성 오류:', createErr.message);
            } else {
                console.log('transactions 테이블이 준비되었습니다.');
            }
        });
    }
});

// API 엔드포인트

// 1. 모든 내역 가져오기 (GET)
app.get('/api/transactions', (req, res) => {
    db.all("SELECT * FROM transactions", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// 2. 새 내역 추가 (POST)
app.post('/api/transactions', (req, res) => {
    const { type, amount, category, description, date } = req.body;

    // 서버 측 유효성 검사
    if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: "필수 필드(type, amount, category, date)가 누락되었습니다." });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "금액은 0보다 큰 숫자여야 합니다." });
    }
    // 날짜 형식 검사 (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)." });
    }

    const sql = `INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [type, amount, category, description, date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ message: "success", id: this.lastID });
    });
});

// 3. 내역 수정 (PUT)
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    // 서버 측 유효성 검사
    if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: "필수 필드(type, amount, category, date)가 누락되었습니다." });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "금액은 0보다 큰 숫자여야 합니다." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)." });
    }

    const sql = `UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?`;
    db.run(sql, [type, amount, category, description, date, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "해당 ID의 내역을 찾을 수 없습니다." });
        } else {
            res.json({ message: "success", changes: this.changes });
        }
    });
});

// 4. 내역 삭제 (DELETE)
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM transactions WHERE id = ?", id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "해당 ID의 내역을 찾을 수 없습니다." });
        } else {
            res.json({ message: "success", changes: this.changes });
        }
    });
});

// 5. 월별 요약 가져오기 (GET)
app.get('/api/summary/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`; // 월말일은 정확하지 않을 수 있으나, LIKE 쿼리가 더 정확

    // SQLite의 strftime 함수를 사용하여 YYYY-MM 형식으로 필터링
    const sql = `
        SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
        FROM transactions
        WHERE STRFTIME('%Y-%m', date) = ?;
    `;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    db.get(sql, [monthKey], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const totalIncome = row.totalIncome || 0;
        const totalExpense = row.totalExpense || 0;
        const netProfit = totalIncome - totalExpense;

        res.json({
            message: "success",
            data: {
                year: parseInt(year),
                month: parseInt(month),
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                netProfit: netProfit
            }
        });
    });
});

// 6. 월별 수입/지출 추이 데이터 가져오기 (새로운 API)
app.get('/api/monthly-trends', (req, res) => {
    const sql = `
        SELECT
            STRFTIME('%Y-%m', date) AS month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
        FROM transactions
        GROUP BY month
        ORDER BY month ASC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});


// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

// 애플리케이션 종료 시 데이터베이스 연결 닫기 (선택 사항)
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('데이터베이스 연결 종료 오류:', err.message);
        }
        console.log('SQLite 데이터베이스 연결이 종료되었습니다.');
        process.exit(0);
    });
});
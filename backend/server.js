const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); 
const path = require('path');

const app = express();
const port = 3000;

// 개발 중 CORS 문제를 해결할 때 사용하나, 현재 배포 구조에서는 필요하지 않을 수 있습니다.
// app.use(cors()); 

app.use(express.json()); // JSON 요청 본문 파싱 미들웨어

// SQLite 데이터베이스 연결 및 테이블 생성
const db = new sqlite3.Database('./mywallet.db', (err) => {
    if (err) {
        console.error('SQLite 데이터베이스 연결 오류:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, 
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL 
        )`, (createErr) => {
            if (createErr) {
                console.error('transactions 테이블 생성 오류:', createErr.message);
            } else {
                console.log('transactions 테이블이 준비되었습니다.');
            }
        });
    }
});

// 모든 트랜잭션 내역 가져오기
app.get('/api/transactions', (req, res) => {
    db.all("SELECT * FROM transactions", [], (err, rows) => {
        if (err) {
            console.error("내역 가져오기 중 DB 오류:", err.message);
            res.status(500).json({ error: "데이터베이스에서 내역을 가져오는 중 오류가 발생했습니다: " + err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// 새 트랜잭션 내역 추가
app.post('/api/transactions', (req, res) => {
    const { type, amount, category, description, date } = req.body;

    // 서버 측 유효성 검사
    if (!type || amount === undefined || !category || !date) { 
        return res.status(400).json({ error: "필수 필드(type, amount, category, date)가 누락되었습니다." });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "금액은 0보다 큰 숫자여야 합니다." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { 
        return res.status(400).json({ error: "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)." });
    }

    const sql = `INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [type, amount, category, description, date], function(err) {
        if (err) {
            console.error("새 내역 추가 중 DB 오류:", err.message);
            res.status(500).json({ error: "데이터베이스에 내역을 추가하는 중 오류가 발생했습니다: " + err.message });
            return; 
        }
        res.status(201).json({ message: "success", id: this.lastID });
    });
});

// 특정 ID의 트랜잭션 내역 수정
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    // 서버 측 유효성 검사
    if (!type || amount === undefined || !category || !date) {
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
            console.error("내역 수정 중 DB 오류:", err.message);
            res.status(500).json({ error: "데이터베이스에서 내역을 수정하는 중 오류가 발생했습니다: " + err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "해당 ID의 내역을 찾을 수 없습니다." });
        } else {
            res.json({ message: "success", changes: this.changes });
        }
    });
});

// 특정 ID의 트랜잭션 내역 삭제
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM transactions WHERE id = ?", id, function(err) {
        if (err) {
            console.error("내역 삭제 중 DB 오류:", err.message);
            res.status(500).json({ error: "데이터베이스에서 내역을 삭제하는 중 오류가 발생했습니다: " + err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "해당 ID의 내역을 찾을 수 없습니다." });
        } else {
            res.json({ message: "success", changes: this.changes });
        }
    });
});

// 특정 월의 수입/지출 요약 가져오기
app.get('/api/summary/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`; 

    const sql = `
        SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
        FROM transactions
        WHERE STRFTIME('%Y-%m', date) = ?;
    `;

    db.get(sql, [monthKey], (err, row) => {
        if (err) {
            console.error("월별 요약 가져오기 중 DB 오류:", err.message);
            res.status(500).json({ error: "데이터베이스에서 월별 요약을 가져오는 중 오류가 발생했습니다: " + err.message });
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

// 월별 수입/지출 추이 데이터 가져오기
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
            console.error("월별 추이 가져오기 중 DB 오류:", err.message);
            res.status(500).json({ error: "데이터베이스에서 월별 추이 데이터를 가져오는 중 오류가 발생했습니다: " + err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// 프론트엔드 정적 파일 서빙
// 모든 API 라우트 아래에 위치하여 먼저 API 요청이 처리되도록 합니다.
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA(Single Page Application) 라우팅:
// API 경로가 아닌 모든 요청에 대해 index.html을 반환하여 클라이언트 측 라우팅을 지원합니다.
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
        res.status(404).send('API endpoint not found.');
    }
});


// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    console.log(`프론트엔드는 http://localhost:${port} 로 접속하세요.`); 
});

// 애플리케이션 종료 시 데이터베이스 연결 닫기
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('데이터베이스 연결 종료 오류:', err.message);
        }
        console.log('SQLite 데이터베이스 연결이 종료되었습니다.');
        process.exit(0);
    });
});
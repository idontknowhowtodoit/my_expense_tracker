const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000; // 서버 포트

// 미들웨어 설정
app.use(cors()); // CORS 허용 (개발 시 모든 도메인 허용)
app.use(express.json()); // JSON 형식 요청 본문 파싱

// SQLite 데이터베이스 연결
// 데이터베이스 파일이 없으면 자동으로 생성돼요.
const db = new sqlite3.Database('./mywallet.db', (err) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        // 트랜잭션 테이블 생성 (없을 경우)
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,       -- 'expense' 또는 'income'
            amount REAL NOT NULL,     -- 금액 (실수형)
            category TEXT NOT NULL,   -- 카테고리 (식비, 교통비 등)
            description TEXT,         -- 내용 (선택 사항)
            date TEXT NOT NULL        -- 날짜 (YYYY-MM-DD 형식)
        )`, (err) => {
            if (err) {
                console.error('테이블 생성 오류:', err.message);
            } else {
                console.log('transactions 테이블이 준비되었습니다.');
            }
        });
    }
});

// --- API 엔드포인트 ---

// [GET] 모든 내역 조회 API
// 경로: /api/transactions
app.get('/api/transactions', (req, res) => {
    const sql = 'SELECT * FROM transactions ORDER BY date DESC, id DESC'; 
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
});

// [POST] 새로운 내역 추가 API
// 경로: /api/transactions
app.post('/api/transactions', (req, res) => {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: '필수 필드를 모두 입력해주세요: type, amount, category, date' });
    }

    const sql = `INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [type, amount, category, description, date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            message: '내역이 성공적으로 추가되었습니다.',
            id: this.lastID,
            type, amount, category, description, date
        });
    });
});

// [PUT] 내역 수정 API
// 경로: /api/transactions/:id
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: '필수 필드를 모두 입력해주세요: type, amount, category, date' });
    }

    const sql = `UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?`;
    db.run(sql, [type, amount, category, description, date, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: '해당 ID의 내역을 찾을 수 없거나 변경 사항이 없습니다.' });
        } else {
            res.json({
                message: `내역 (ID: ${id})이 성공적으로 수정되었습니다.`,
                id, type, amount, category, description, date
            });
        }
    });
});

// [DELETE] 내역 삭제 API
// 경로: /api/transactions/:id
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM transactions WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: '해당 ID의 내역을 찾을 수 없습니다.' });
        } else {
            res.json({ message: `내역 (ID: ${id})이 성공적으로 삭제되었습니다.` });
        }
    });
});

// [GET] 월별 요약 조회 API
// 경로: /api/summary/:year/:month
// 특정 연월의 총수입, 총지출, 순수익을 계산하여 반환합니다.
app.get('/api/summary/:year/:month', (req, res) => {
    const { year, month } = req.params;

    // 월을 두 자리 숫자로 포맷팅 (예: 1월 -> '01', 10월 -> '10')
    const paddedMonth = month.padStart(2, '0');
    // 해당 월의 시작일과 마지막일 패턴을 만듭니다.
    const datePattern = `${year}-${paddedMonth}-%`; // 예: '2025-07-%'

    const sql = `
        SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
        FROM transactions
        WHERE date LIKE ?;
    `;

    db.get(sql, [datePattern], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const totalIncome = row.totalIncome || 0;
        const totalExpense = row.totalExpense || 0;
        const netProfit = totalIncome - totalExpense;

        res.json({
            message: 'success',
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

// --- 서버 시작 ---
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
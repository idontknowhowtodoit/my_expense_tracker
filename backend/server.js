const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000; // 서버 포트

// 미들웨어 설정
// 다른 도메인(우리 프론트엔드)에서 이 서버로 요청을 보낼 수 있도록 허용합니다.
app.use(cors());
// 클라이언트에서 JSON 형식으로 데이터를 보낼 때, 이를 해석할 수 있도록 설정합니다.
app.use(express.json());

// SQLite 데이터베이스 연결
// 'mywallet.db' 파일을 사용합니다. 파일이 없으면 자동으로 생성돼요.
const db = new sqlite3.Database('./mywallet.db', (err) => {
    if (err) {
        // 데이터베이스 연결 중 오류가 발생하면 콘솔에 에러를 출력합니다.
        console.error('데이터베이스 연결 오류:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        // 'transactions' 테이블이 없으면 새로 생성합니다.
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,       -- 'expense' (지출) 또는 'income' (수입)
            amount REAL NOT NULL,     -- 금액 (소수점도 가능한 실수형)
            category TEXT NOT NULL,   -- 카테고리 (식비, 교통비 등)
            description TEXT,         -- 내역 설명 (선택 사항)
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

// --- 새로운 API 엔드포인트 추가 ---

// [GET] 모든 내역 조회 API
// 경로: /api/transactions
// 클라이언트에서 이 경로로 요청하면 모든 내역을 JSON 형태로 반환해요.
app.get('/api/transactions', (req, res) => {
    // 최신 날짜, 최신 id 순으로 정렬하여 내역을 가져와요.
    // 이렇게 하면 가장 최근에 추가된 내역이 목록의 맨 위에 표시됩니다.
    const sql = 'SELECT * FROM transactions ORDER BY date DESC, id DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            // 데이터베이스 조회 중 오류가 발생하면 500 에러와 함께 오류 메시지를 반환합니다.
            res.status(500).json({ error: err.message });
            return;
        }
        // 성공적으로 데이터를 가져오면 200 OK 상태와 함께 데이터를 반환합니다.
        res.json({
            message: 'success',
            data: rows
        });
    });
});

// [POST] 새로운 내역 추가 API
// 경로: /api/transactions
// 클라이언트에서 이 경로로 데이터를 보내면 데이터베이스에 새로운 내역을 추가해요.
app.post('/api/transactions', (req, res) => {
    // 클라이언트에서 보낸 요청 본문(body)에서 데이터를 추출합니다.
    const { type, amount, category, description, date } = req.body;

    // 필수 필드 유효성 검사: 이 필드들이 없으면 400 Bad Request 에러를 반환합니다.
    if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: '필수 필드를 모두 입력해주세요: type, amount, category, date' });
    }

    // SQL INSERT 문을 사용하여 데이터베이스에 새 레코드를 삽입합니다.
    // ?는 플레이스홀더로, SQL 인젝션 공격을 방지하고 데이터를 안전하게 삽입할 수 있게 해줍니다.
    const sql = `INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`;

    // db.run() 함수는 INSERT, UPDATE, DELETE와 같이 결과를 반환하지 않는 SQL 문에 사용됩니다.
    // this.lastID는 새로 삽입된 레코드의 고유 ID를 반환합니다.
    db.run(sql, [type, amount, category, description, date], function(err) {
        if (err) {
            // 데이터베이스 삽입 중 오류가 발생하면 500 에러와 함께 오류 메시지를 반환합니다.
            res.status(500).json({ error: err.message });
            return;
        }
        // 성공적으로 내역이 추가되면 201 Created 상태와 함께 성공 메시지 및 추가된 데이터를 반환합니다.
        res.status(201).json({
            message: '내역이 성공적으로 추가되었습니다.',
            id: this.lastID, // 새로 생성된 ID
            type, amount, category, description, date // 추가된 데이터
        });
    });
});

// --- 기존 서버 시작 코드 ---
// 서버가 지정된 포트에서 요청을 수신 대기하도록 합니다.
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
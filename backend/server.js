const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // CORS 미들웨어 불러오기

const app = express();
const port = 3000; // 서버가 실행될 포트 번호

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

// 기본 라우트 (서버가 잘 동작하는지 확인하기 위한 간단한 API)
// 웹 브라우저에서 http://localhost:3000/ 에 접속하면 이 메시지를 볼 수 있어요.
app.get('/', (req, res) => {
    res.send('My Expense Tracker 백엔드 서버입니다!');
});

// 서버 시작
// 위에서 설정한 포트(3000번)에서 서버를 실행합니다.
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/expense_tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB 연결 성공'))
.catch(err => console.error('MongoDB 연결 오류:', err));

// Transaction 모델 정의
const transactionSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['income', 'expense'] }, // 수입 또는 지출
    amount: { type: Number, required: true, min: 0 }, // 금액 (0 이상)
    category: { type: String, required: true, trim: true }, // 카테고리 (trim 추가)
    description: { type: String, default: '', trim: true }, // 설명 (trim 추가)
    date: { type: Date, required: true }, // 날짜
    createdAt: { type: Date, default: Date.now } // 생성일 (자동 기록)
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// 미들웨어 설정
app.use(express.json()); // JSON 요청 본문 파싱
app.use(express.static(path.join(__dirname, '../frontend'))); // 정적 파일 서비스

// API 라우트

// 1. 모든 내역 가져오기 (필터링 및 정렬 포함)
app.get('/api/transactions', async (req, res) => {
    try {
        const { type, category, startDate, endDate, sortBy, sortOrder } = req.query;
        let query = {};

        if (type && type !== 'all') {
            query.type = type;
        }
        if (category && category !== 'all') {
            query.category = category;
        }
        if (startDate) {
            query.date = { ...query.date, $gte: new Date(startDate + 'T00:00:00.000Z') };
        }
        if (endDate) {
            query.date = { ...query.date, $lte: new Date(endDate + 'T23:59:59.999Z') };
        }

        let sort = {};
        if (sortBy === 'date') {
            sort.date = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'amount') {
            sort.amount = sortOrder === 'asc' ? 1 : -1;
        } else {
            sort.date = -1; // 기본 정렬: 날짜 최신순
            sort.createdAt = -1; // 동일 날짜 시 최신 생성순
        }

        const transactions = await Transaction.find(query).sort(sort);
        res.status(200).json({ message: '내역 조회 성공', data: transactions });
    } catch (error) {
        console.error('내역 조회 오류:', error);
        res.status(500).json({ error: '내역을 불러오는 데 실패했습니다.', details: error.message });
    }
});

// 2. 새 내역 추가
app.post('/api/transactions', async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;

        // 서버 측 유효성 검사 강화
        if (!type || !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: '유효하지 않은 유형(type)입니다. "income" 또는 "expense"여야 합니다.' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: '금액은 0보다 큰 숫자여야 합니다.' });
        }
        if (!category || category.trim() === '') {
            return res.status(400).json({ error: '카테고리를 입력해주세요.' });
        }
        if (!date || isNaN(new Date(date))) {
            return res.status(400).json({ error: '유효하지 않은 날짜 형식입니다.' });
        }
        // 미래 날짜 방지
        if (new Date(date) > new Date()) {
            return res.status(400).json({ error: '미래 날짜는 입력할 수 없습니다.' });
        }

        const newTransaction = new Transaction({ type, amount, category, description, date });
        const savedTransaction = await newTransaction.save();
        res.status(201).json({ message: '내역이 성공적으로 추가되었습니다.', data: savedTransaction });
    } catch (error) {
        // Mongoose validation error handling
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message, details: error.errors });
        }
        console.error('내역 추가 오류:', error);
        res.status(500).json({ error: '내역 추가에 실패했습니다.', details: error.message });
    }
});

// 3. 내역 수정
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;

        // 서버 측 유효성 검사 강화 (추가 API와 동일)
        if (!type || !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: '유효하지 않은 유형(type)입니다. "income" 또는 "expense"여야 합니다.' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: '금액은 0보다 큰 숫자여야 합니다.' });
        }
        if (!category || category.trim() === '') {
            return res.status(400).json({ error: '카테고리를 입력해주세요.' });
        }
        if (!date || isNaN(new Date(date))) {
            return res.status(400).json({ error: '유효하지 않은 날짜 형식입니다.' });
        }
        // 미래 날짜 방지
        if (new Date(date) > new Date()) {
            return res.status(400).json({ error: '미래 날짜는 입력할 수 없습니다.' });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { type, amount, category, description, date }, // req.body 대신 개별 필드 사용
            { new: true, runValidators: true } // runValidators: true 추가
        );
        if (!updatedTransaction) {
            return res.status(404).json({ error: '해당 내역을 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '내역이 성공적으로 수정되었습니다.', data: updatedTransaction });
    } catch (error) {
        // Mongoose validation error handling
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message, details: error.errors });
        }
        console.error('내역 수정 오류:', error);
        res.status(500).json({ error: '내역 수정에 실패했습니다.', details: error.message });
    }
});

// 4. 내역 삭제
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!deletedTransaction) {
            return res.status(404).json({ error: '해당 내역을 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '내역이 성공적으로 삭제되었습니다.', data: deletedTransaction });
    } catch (error) {
        console.error('내역 삭제 오류:', error);
        res.status(500).json({ error: '내역 삭제에 실패했습니다.', details: error.message });
    }
});

// 5. 월별 요약 가져오기
app.get('/api/summary/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

        const transactions = await Transaction.find({
            date: { $gte: startDate, $lte: endDate }
        });

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });

        const netProfit = totalIncome - totalExpense;

        res.status(200).json({
            message: '월별 요약 조회 성공',
            data: {
                year: parseInt(year),
                month: parseInt(month),
                totalIncome,
                totalExpense,
                netProfit
            }
        });
    } catch (error) {
        console.error('월별 요약 오류:', error);
        res.status(500).json({ error: '월별 요약을 불러오는 데 실패했습니다.', details: error.message });
    }
});

// 6. 월별 수입/지출 추이 데이터 가져오기 (차트용)
app.get('/api/monthly-trends', async (req, res) => {
    try {
        const trends = await Transaction.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    totalIncome: 1,
                    totalExpense: 1
                }
            }
        ]);
        res.status(200).json({ message: '월별 추이 데이터 조회 성공', data: trends });
    } catch (error) {
        console.error('월별 추이 데이터 오류:', error);
        res.status(500).json({ error: '월별 추이 데이터를 불러오는 데 실패했습니다.', details: error.message });
    }
});


// 7. CSV 내보내기 API 엔드포인트
app.get('/api/transactions/export-csv', async (req, res) => {
    try {
        const { year, month } = req.query; // 쿼리 파라미터로 년, 월을 받을 수 있음
        let query = {};

        if (year && month) {
            // 특정 월의 데이터만 필터링 (ISO 날짜 형식으로 변환)
            const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 다음 달 0일 = 현재 달의 마지막 날
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

        // CSV 헤더 생성
        // 내용에 콤마(,)나 따옴표(")가 포함될 경우 CSV 규칙에 따라 처리
        const headers = '날짜,유형,카테고리,금액,내용\n';

        // CSV 본문 생성
        const csvRows = transactions.map(t => {
            const date = t.date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
            const type = t.type === 'income' ? '수입' : '지출';
            // 내용을 CSV 형식에 맞게 처리: 따옴표 안에 따옴표는 두 개로, 전체를 따옴표로 묶음
            const description = t.description ? `"${t.description.replace(/"/g, '""')}"` : ''; 
            return `${date},${type},${t.category},${t.amount},${description}`;
        });

        const csvString = headers + csvRows.join('\n');

        // CSV 파일 응답 설정
        res.setHeader('Content-Type', 'text/csv; charset=utf-8'); // UTF-8 인코딩 명시
        // 한글 파일명 처리를 위해 encodeURIComponent 적용
        const filename = `가계부_내역${year && month ? `_${year}년${month}월` : '_전체'}.csv`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.send(csvString);

    } catch (error) {
        console.error('CSV 내보내기 오류:', error);
        res.status(500).json({ error: 'CSV 내보내기 중 오류가 발생했습니다.', details: error.message });
    }
});


// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionListDiv = document.getElementById('transaction-list');

    // 현재 날짜를 기본값으로 설정
    document.getElementById('date').valueAsDate = new Date();

    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault(); // 폼 기본 제출 동작 방지

        const type = document.getElementById('type').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        // 입력된 데이터를 객체로 만듭니다.
        const newTransaction = {
            type,
            amount: parseFloat(amount), // 금액은 숫자로 변환
            category,
            description,
            date
        };

        console.log('새로운 내역:', newTransaction);

        // TODO: 나중에 이 데이터를 백엔드로 보내는 코드를 추가할 예정입니다.
        // 지금은 임시로 화면에 추가해봅니다.
        addTransactionToDisplay(newTransaction);

        // 폼 초기화
        transactionForm.reset();
        document.getElementById('date').valueAsDate = new Date(); // 날짜는 다시 오늘 날짜로
    });

    function addTransactionToDisplay(transaction) {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item'; // 스타일링을 위한 클래스 추가
        transactionItem.innerHTML = `
            <p><strong>${transaction.type === 'expense' ? '지출' : '수입'}</strong>: ${transaction.amount.toLocaleString()}원</p>
            <p>카테고리: ${transaction.category}</p>
            <p>내용: ${transaction.description || '없음'}</p>
            <p>날짜: ${transaction.date}</p>
            <hr>
        `;
        // 기존 "아직 내역이 없어요" 메시지 제거
        if (transactionListDiv.querySelector('p')) {
            transactionListDiv.innerHTML = '';
        }
        transactionListDiv.prepend(transactionItem); // 최신 내역이 위로 오도록 prepend 사용
    }
});
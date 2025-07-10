document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionListDiv = document.getElementById('transaction-list');

    // 현재 날짜를 기본값으로 설정
    // 사용자가 날짜를 직접 선택하지 않으면 오늘 날짜가 기본으로 입력됩니다.
    document.getElementById('date').valueAsDate = new Date();

    // 페이지 로드 시 기존 내역 불러오기
    // 웹 페이지가 처음 로드될 때 또는 새로고침될 때 데이터베이스의 내역을 가져와 표시합니다.
    loadTransactions();

    // 폼 제출 이벤트 리스너
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 방지합니다.

        // 폼 입력 필드의 값들을 가져옵니다.
        const type = document.getElementById('type').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        // 입력된 데이터를 객체 형태로 만듭니다.
        const newTransaction = {
            type,
            amount: parseFloat(amount), // 금액은 숫자로 변환 (문자열 방지)
            category,
            description,
            date
        };

        console.log('새로운 내역 전송 시도:', newTransaction);

        try {
            // 백엔드 API로 데이터 전송 (POST 요청)
            // fetch API를 사용하여 'http://localhost:3000/api/transactions' 엔드포인트로 데이터를 보냅니다.
            const response = await fetch('http://localhost:3000/api/transactions', {
                method: 'POST', // HTTP POST 메서드 사용
                headers: {
                    'Content-Type': 'application/json' // 보내는 데이터가 JSON 형식임을 명시
                },
                body: JSON.stringify(newTransaction) // JavaScript 객체를 JSON 문자열로 변환하여 전송
            });

            if (!response.ok) {
                // HTTP 상태 코드가 200번대가 아니면 (예: 400, 500 에러) 오류 처리
                const errorData = await response.json(); // 서버에서 보낸 오류 메시지를 파싱
                throw new Error(errorData.error || '내역 추가 중 알 수 없는 오류가 발생했습니다.');
            }

            const result = await response.json(); // 성공 응답을 JSON으로 파싱
            console.log('내역 추가 성공:', result);

            // 성공적으로 추가되면 내역 목록을 새로고침하여 화면에 반영합니다.
            loadTransactions();

            // 폼 초기화
            transactionForm.reset();
            document.getElementById('date').valueAsDate = new Date(); // 날짜 필드는 다시 오늘 날짜로 설정
            alert('내역이 성공적으로 추가되었습니다!'); // 사용자에게 성공 메시지 표시
        } catch (error) {
            console.error('내역 추가 오류:', error);
            alert('내역 추가에 실패했습니다: ' + error.message); // 사용자에게 오류 메시지 표시
        }
    });

    // 모든 내역을 백엔드에서 불러와 화면에 표시하는 함수
    async function loadTransactions() {
        try {
            // GET 요청으로 모든 내역을 가져옵니다.
            const response = await fetch('http://localhost:3000/api/transactions');
            if (!response.ok) {
                throw new Error('내역을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json(); // 응답 데이터를 JSON으로 파싱

            // 기존 내역 목록을 비우고 새로 불러온 데이터로 채웁니다.
            transactionListDiv.innerHTML = '';

            if (data.data && data.data.length > 0) {
                // 데이터가 있으면 각 내역을 화면에 추가합니다.
                data.data.forEach(transaction => {
                    addTransactionToDisplay(transaction);
                });
            } else {
                // 데이터가 없으면 "아직 내역이 없어요" 메시지를 표시합니다.
                transactionListDiv.innerHTML = '<p>아직 내역이 없어요. 새로운 내역을 추가해보세요!</p>';
            }

        } catch (error) {
            console.error('내역 불러오기 오류:', error);
            transactionListDiv.innerHTML = '<p>내역을 불러오는 데 실패했습니다.</p>';
        }
    }

    // 화면에 하나의 내역을 추가하는 보조 함수
    function addTransactionToDisplay(transaction) {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item'; // CSS 스타일링을 위한 클래스 추가

        // 날짜 포맷팅 (YYYY-MM-DD -> 보기 좋은 형식)
        // 'T00:00:00'을 추가하여 시간대 문제를 방지합니다.
        const displayDate = new Date(transaction.date + 'T00:00:00');
        const formattedDate = displayDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        transactionItem.innerHTML = `
            <p>
                <strong>${transaction.type === 'expense' ? '💸 지출' : '💰 수입'}</strong>:
                <span style="color: ${transaction.type === 'expense' ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
                    ${transaction.amount.toLocaleString()}원
                </span>
            </p>
            <p>카테고리: ${transaction.category}</p>
            <p>내용: ${transaction.description || '없음'}</p>
            <p>날짜: ${formattedDate}</p>
            <hr>
        `;
        // 최신 내역이 목록의 맨 위로 오도록 prepend를 사용합니다.
        transactionListDiv.prepend(transactionItem);
    }
});
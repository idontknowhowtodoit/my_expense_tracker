document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionListDiv = document.getElementById('transaction-list');

    // 현재 날짜를 기본값으로 설정
    document.getElementById('date').valueAsDate = new Date();

    // 페이지 로드 시 기존 내역 불러오기
    loadTransactions();

    // 폼 제출 이벤트 리스너 (새 내역 추가 또는 기존 내역 수정)
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 방지

        const transactionId = document.getElementById('transaction-id').value; // 숨겨진 ID 필드
        const type = document.getElementById('type').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        const transactionData = {
            type,
            amount: parseFloat(amount),
            category,
            description,
            date
        };

        let url = 'http://localhost:3000/api/transactions';
        let method = 'POST';
        let successMessage = '내역이 성공적으로 추가되었습니다!';
        let errorMessage = '내역 추가에 실패했습니다: ';

        if (transactionId) { // transactionId가 있으면 수정 모드
            url = `${url}/${transactionId}`;
            method = 'PUT';
            successMessage = '내역이 성공적으로 수정되었습니다!';
            errorMessage = '내역 수정에 실패했습니다: ';
        }

        console.log(`${method} 요청 시도:`, transactionData);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '알 수 없는 오류가 발생했습니다.');
            }

            const result = await response.json();
            console.log('작업 성공:', result);

            loadTransactions(); // 내역 목록 새로고침
            transactionForm.reset(); // 폼 초기화
            document.getElementById('date').valueAsDate = new Date(); // 날짜 필드 초기화
            document.getElementById('transaction-id').value = ''; // 숨겨진 ID 필드 초기화
            document.getElementById('form-title').textContent = '새로운 내역 추가하기'; // 폼 제목 변경
            document.getElementById('submit-button').textContent = '내역 추가'; // 버튼 텍스트 변경

            alert(successMessage);
        } catch (error) {
            console.error('작업 오류:', error);
            alert(errorMessage + error.message);
        }
    });

    // 모든 내역을 백엔드에서 불러와 화면에 표시하는 함수
    async function loadTransactions() {
        try {
            const response = await fetch('http://localhost:3000/api/transactions');
            if (!response.ok) {
                throw new Error('내역을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();

            transactionListDiv.innerHTML = ''; // 기존 목록 비우기

            if (data.data && data.data.length > 0) {
                data.data.forEach(transaction => {
                    addTransactionToDisplay(transaction);
                });
            } else {
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
        transactionItem.className = 'transaction-item';

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
            <div class="actions">
                <button class="edit-btn" data-id="${transaction.id}">수정</button>
                <button class="delete-btn" data-id="${transaction.id}">삭제</button>
            </div>
            <hr>
        `;
        transactionListDiv.prepend(transactionItem);

        // 수정 버튼 이벤트 리스너
        transactionItem.querySelector('.edit-btn').addEventListener('click', () => {
            editTransaction(transaction);
        });

        // 삭제 버튼 이벤트 리스너
        transactionItem.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTransaction(transaction.id);
        });
    }

    // 내역 수정 모드로 전환하는 함수
    function editTransaction(transaction) {
        document.getElementById('transaction-id').value = transaction.id; // 숨겨진 ID 필드에 ID 저장
        document.getElementById('type').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('description').value = transaction.description;
        document.getElementById('date').value = transaction.date;

        document.getElementById('form-title').textContent = '내역 수정하기'; // 폼 제목 변경
        document.getElementById('submit-button').textContent = '수정 완료'; // 버튼 텍스트 변경

        // 폼으로 스크롤 이동하여 사용자가 바로 수정할 수 있도록 함
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 내역 삭제 함수
    async function deleteTransaction(id) {
        if (!confirm('정말로 이 내역을 삭제하시겠습니까?')) {
            return; // 사용자가 취소하면 아무것도 하지 않음
        }

        try {
            const response = await fetch(`http://localhost:3000/api/transactions/${id}`, {
                method: 'DELETE' // HTTP DELETE 메서드 사용
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '내역 삭제 중 알 수 없는 오류가 발생했습니다.');
            }

            const result = await response.json();
            console.log('내역 삭제 성공:', result);

            loadTransactions(); // 내역 목록 새로고침
            alert('내역이 성공적으로 삭제되었습니다!');
        } catch (error) {
            console.error('내역 삭제 오류:', error);
            alert('내역 삭제에 실패했습니다: ' + error.message);
        }
    }
});
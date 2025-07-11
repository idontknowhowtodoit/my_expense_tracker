document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionListDiv = document.getElementById('transaction-list');
    const summaryMonthSelect = document.getElementById('summary-month-select');
    const monthlySummaryDiv = document.getElementById('monthly-summary');

    // 현재 날짜를 기본값으로 설정
    document.getElementById('date').valueAsDate = new Date();

    // 페이지 로드 시 기존 내역 불러오기
    loadTransactions();

    // 월 선택 드롭다운 채우기 및 이벤트 리스너 설정
    populateMonthSelect();
    summaryMonthSelect.addEventListener('change', displayMonthlySummary);

    // 폼 제출 이벤트 리스너 (새 내역 추가 또는 기존 내역 수정)
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const transactionId = document.getElementById('transaction-id').value;
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
            displayMonthlySummary(); // 월별 요약도 새로고침
            populateMonthSelect(); // 월 선택 드롭다운도 새로고침 (새로운 연월 내역이 추가되었을 수 있으므로)

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
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('type').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('description').value = transaction.description;
        document.getElementById('date').value = transaction.date;

        document.getElementById('form-title').textContent = '내역 수정하기';
        document.getElementById('submit-button').textContent = '수정 완료';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 내역 삭제 함수
    async function deleteTransaction(id) {
        if (!confirm('정말로 이 내역을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/transactions/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '내역 삭제 중 알 수 없는 오류가 발생했습니다.');
            }

            const result = await response.json();
            console.log('내역 삭제 성공:', result);

            loadTransactions(); // 내역 목록 새로고침
            displayMonthlySummary(); // 월별 요약도 새로고침
            populateMonthSelect(); // 월 선택 드롭다운도 새로고침

            alert('내역이 성공적으로 삭제되었습니다!');
        } catch (error) {
            console.error('내역 삭제 오류:', error);
            alert('내역 삭제에 실패했습니다: ' + error.message);
        }
    }

    // --- 월별 요약 기능 관련 함수 ---

    // 월 선택 드롭다운에 옵션 채우기
    async function populateMonthSelect() {
        // 모든 내역을 가져와서 존재하는 모든 연월을 파악합니다.
        try {
            const response = await fetch('http://localhost:3000/api/transactions');
            if (!response.ok) {
                throw new Error('내역을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            const transactions = data.data;

            const months = new Set(); // 중복을 피하기 위해 Set 사용

            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const year = date.getFullYear();
                const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
                months.add(`${year}-${month}`); // 'YYYY-M' 형식으로 저장
            });

            // Set을 배열로 변환하고 최신 월부터 정렬
            const sortedMonths = Array.from(months).sort((a, b) => {
                const [aYear, aMonth] = a.split('-').map(Number);
                const [bYear, bMonth] = b.split('-').map(Number);
                if (bYear !== aYear) return bYear - aYear; // 연도 내림차순
                return bMonth - aMonth; // 월 내림차순
            });

            summaryMonthSelect.innerHTML = '<option value="">월 선택</option>'; // 기본 옵션
            if (sortedMonths.length > 0) {
                sortedMonths.forEach(monthStr => {
                    const [year, month] = monthStr.split('-');
                    const option = document.createElement('option');
                    option.value = monthStr; // 'YYYY-M'
                    option.textContent = `${year}년 ${month}월`;
                    summaryMonthSelect.appendChild(option);
                });
                // 드롭다운에 첫 번째 (가장 최신) 월을 자동으로 선택하도록 함
                summaryMonthSelect.value = sortedMonths[0];
            } else {
                summaryMonthSelect.innerHTML = '<option value="">내역 없음</option>';
            }

            // 드롭다운 채운 후 바로 요약 정보 표시 (가장 최신 월)
            displayMonthlySummary();

        } catch (error) {
            console.error('월 선택 드롭다운 채우기 오류:', error);
            summaryMonthSelect.innerHTML = '<p>월 선택 드롭다운을 불러오는 데 실패했습니다.</p>';
        }
    }

    // 선택된 월의 요약 정보를 가져와 화면에 표시
    async function displayMonthlySummary() {
        const selectedMonth = summaryMonthSelect.value;
        if (!selectedMonth) {
            monthlySummaryDiv.innerHTML = '<p>월을 선택하면 요약을 볼 수 있어요.</p>';
            return;
        }

        const [year, month] = selectedMonth.split('-'); // 'YYYY-M' -> [YYYY, M]

        try {
            const response = await fetch(`http://localhost:3000/api/summary/${year}/${month}`);
            if (!response.ok) {
                throw new Error('월별 요약을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            const summary = data.data;

            monthlySummaryDiv.innerHTML = `
                <h3>${summary.year}년 ${summary.month}월 요약</h3>
                <p>총 수입: <span style="color: #27ae60; font-weight: bold;">${summary.totalIncome.toLocaleString()}원</span></p>
                <p>총 지출: <span style="color: #e74c3c; font-weight: bold;">${summary.totalExpense.toLocaleString()}원</span></p>
                <p>순수익: <span style="color: ${summary.netProfit >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${summary.netProfit.toLocaleString()}원</span></p>
            `;
        } catch (error) {
            console.error('월별 요약 표시 오류:', error);
            monthlySummaryDiv.innerHTML = '<p>월별 요약을 불러오는 데 실패했습니다.</p>';
        }
    }
});
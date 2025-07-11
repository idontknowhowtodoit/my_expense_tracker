document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionListDiv = document.getElementById('transaction-list');
    const summaryMonthSelect = document.getElementById('summary-month-select');
    const monthlySummaryDiv = document.getElementById('monthly-summary');
    const expenseChartCanvas = document.getElementById('expenseChart'); // 새로 추가된 캔버스 요소
    let expenseChartInstance = null; // 차트 인스턴스를 저장할 변수

    // 현재 날짜를 기본값으로 설정
    document.getElementById('date').valueAsDate = new Date();

    // 페이지 로드 시 기존 내역 불러오기
    loadTransactions();

    // 월 선택 드롭다운 채우기 및 이벤트 리스너 설정
    populateMonthSelect();
    summaryMonthSelect.addEventListener('change', () => {
        displayMonthlySummary();
        renderExpenseChart(); // 월 변경 시 차트도 새로 그림
    });

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
            renderExpenseChart(); // 차트도 새로 그림

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
            renderExpenseChart(); // 차트도 새로 그림

            alert('내역이 성공적으로 삭제되었습니다!');
        } catch (error) {
            console.error('내역 삭제 오류:', error);
            alert('내역 삭제에 실패했습니다: ' + error.message);
        }
    }

    // --- 월별 요약 기능 관련 함수 ---

    // 월 선택 드롭다운에 옵션 채우기
    async function populateMonthSelect() {
        try {
            const response = await fetch('http://localhost:3000/api/transactions');
            if (!response.ok) {
                throw new Error('내역을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            const transactions = data.data;

            const months = new Set();

            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                months.add(`${year}-${month}`);
            });

            const sortedMonths = Array.from(months).sort((a, b) => {
                const [aYear, aMonth] = a.split('-').map(Number);
                const [bYear, bMonth] = b.split('-').map(Number);
                if (bYear !== aYear) return bYear - aYear;
                return bMonth - aMonth;
            });

            summaryMonthSelect.innerHTML = '<option value="">월 선택</option>';
            if (sortedMonths.length > 0) {
                sortedMonths.forEach(monthStr => {
                    const [year, month] = monthStr.split('-');
                    const option = document.createElement('option');
                    option.value = monthStr;
                    option.textContent = `${year}년 ${month}월`;
                    summaryMonthSelect.appendChild(option);
                });
                summaryMonthSelect.value = sortedMonths[0];
            } else {
                summaryMonthSelect.innerHTML = '<option value="">내역 없음</option>';
            }

            displayMonthlySummary(); // 드롭다운 채운 후 바로 요약 정보 표시
            renderExpenseChart(); // 드롭다운 채운 후 바로 차트 그리기

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

        const [year, month] = selectedMonth.split('-');

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

    // --- 차트 기능 관련 함수 ---

    // 월별 지출 카테고리 파이 차트 그리기
    async function renderExpenseChart() {
        const selectedMonth = summaryMonthSelect.value;
        if (!selectedMonth) {
            // 차트가 표시될 캔버스 영역을 비워두거나 메시지를 표시
            if (expenseChartInstance) {
                expenseChartInstance.destroy();
                expenseChartInstance = null;
            }
            const chartContainer = expenseChartCanvas.parentElement;
            chartContainer.innerHTML = '<canvas id="expenseChart"></canvas><p style="text-align: center; margin-top: 10px;">월을 선택하면 지출 분석 차트를 볼 수 있어요.</p>';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/transactions');
            if (!response.ok) {
                throw new Error('내역을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            const transactions = data.data;

            const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);

            // 선택된 월의 지출 내역만 필터링하고 카테고리별로 금액 집계
            const categoryExpenses = {};
            transactions.forEach(t => {
                const transactionDate = new Date(t.date);
                if (t.type === 'expense' &&
                    transactionDate.getFullYear() === selectedYear &&
                    (transactionDate.getMonth() + 1) === selectedMonthNum) {
                    categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
                }
            });

            const labels = Object.keys(categoryExpenses);
            const dataValues = Object.values(categoryExpenses);

            // 데이터가 없으면 차트 대신 메시지 표시
            if (labels.length === 0) {
                if (expenseChartInstance) {
                    expenseChartInstance.destroy();
                    expenseChartInstance = null;
                }
                const chartContainer = expenseChartCanvas.parentElement;
                chartContainer.innerHTML = '<canvas id="expenseChart"></canvas><p style="text-align: center; margin-top: 10px;">선택된 월에 지출 내역이 없습니다.</p>';
                return;
            }

            // 차트 색상 정의 (더 다양한 색상 추가 가능)
            const backgroundColors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                '#E7E9ED', '#8AC926', '#F4A261', '#2A9D8F', '#E9C46A', '#F4F1DE'
            ];
            const borderColors = backgroundColors.map(color => color.replace(')', ', 1)')); // 불투명하게

            // 기존 차트 인스턴스가 있으면 파괴하고 새로 생성
            if (expenseChartInstance) {
                expenseChartInstance.destroy();
            }

            // Chart.js를 사용하여 파이 차트 생성
            const ctx = expenseChartCanvas.getContext('2d');
            expenseChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: backgroundColors.slice(0, labels.length), // 데이터 개수에 맞게 색상 사용
                        borderColor: borderColors.slice(0, labels.length),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: `${selectedYear}년 ${selectedMonthNum}월 지출 카테고리`
                        }
                    }
                }
            });
        } catch (error) {
            console.error('지출 차트 렌더링 오류:', error);
            const chartContainer = expenseChartCanvas.parentElement;
            chartContainer.innerHTML = '<canvas id="expenseChart"></canvas><p style="text-align: center; margin-top: 10px;">차트를 불러오는 데 실패했습니다.</p>';
        }
    }
});
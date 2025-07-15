document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionListDiv = document.getElementById('transaction-list');
    let summaryMonthSelect = document.getElementById('summary-month-select'); // let으로 변경하여 재할당 가능하게
    const monthlySummaryDiv = document.getElementById('monthly-summary');
    let expenseChartCanvas = document.getElementById('expenseChart'); // let으로 변경하여 재할당 가능하게
    let incomeExpenseTrendChartCanvas = document.getElementById('incomeExpenseTrendChart'); // let으로 변경하여 재할당 가능하게
    
    let expenseChartInstance = null;
    let incomeExpenseTrendChartInstance = null;

    // 필터링 및 정렬 UI 요소들
    const filterTypeSelect = document.getElementById('filter-type');
    const filterCategorySelect = document.getElementById('filter-category');
    const sortBySelect = document.getElementById('sort-by');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    // 데이터 내보내기 관련 요소
    const exportMonthSelect = document.getElementById('export-month-select');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    let allTransactions = []; // 모든 원본 내역을 저장할 배열

    // 로딩 스피너 요소
    const loadingSpinner = document.getElementById('loading-spinner');

    // 현재 날짜를 기본값으로 설정
    document.getElementById('date').valueAsDate = new Date();

    // 페이지 로드 시 모든 내역 불러오기
    fetchAllTransactions();

    // 월 선택 드롭다운 채우기 및 이벤트 리스너 설정
    populateMonthSelect(); // 초기 로드 시 한 번 호출
    summaryMonthSelect.addEventListener('change', () => {
        displayMonthlySummary();
        renderExpenseChart();
    });

    // 필터링 및 정렬 UI 요소 변경 시 이벤트 리스너
    filterTypeSelect.addEventListener('change', applyFiltersAndSort);
    filterCategorySelect.addEventListener('change', applyFiltersAndSort);
    sortBySelect.addEventListener('change', applyFiltersAndSort);
    startDateInput.addEventListener('change', applyFiltersAndSort);
    endDateInput.addEventListener('change', applyFiltersAndSort);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // CSV 내보내기 버튼 이벤트 리스너
    exportCsvBtn.addEventListener('click', async () => {
        showSpinner(); // 스피너 표시
        try {
            const selectedMonth = exportMonthSelect.value;
            let url = '/api/transactions/export-csv';

            if (selectedMonth !== 'all' && selectedMonth !== '') {
                const [year, month] = selectedMonth.split('-');
                url += `?year=${year}&month=${month}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text(); // 오류 메시지를 텍스트로 받음
                throw new Error(`CSV 내보내기 실패: ${errorText}`);
            }

            // Blob으로 응답을 받고 파일 다운로드
            const blob = await response.blob();
            // Content-Disposition 헤더에서 파일 이름 추출
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = '가계부_내역.csv'; // 기본 파일명
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1]); // 인코딩된 파일명 디코딩
                }
            }
            
            const url_object = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url_object;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url_object);

            showToast('CSV 파일이 성공적으로 내보내졌습니다!', 'success');

        } catch (error) {
            console.error('CSV 내보내기 오류:', error);
            showToast('CSV 내보내기에 실패했습니다: ' + error.message, 'error');
        } finally {
            hideSpinner(); // 스피너 숨김
        }
    });

    // 폼 제출 이벤트 리스너 (새 내역 추가 또는 기존 내역 수정)
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const transactionId = document.getElementById('transaction-id').value;
        const type = document.getElementById('type').value;
        const amountInput = document.getElementById('amount');
        const amount = parseFloat(amountInput.value);
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        // 클라이언트 측 유효성 검사 강화
        if (isNaN(amount) || amount <= 0) {
            showToast('금액은 0보다 큰 유효한 숫자여야 합니다.', 'error');
            amountInput.focus();
            return;
        }
        if (!category) {
            showToast('카테고리를 선택해주세요.', 'error');
            return;
        }
        if (!date) {
            showToast('날짜를 입력해주세요.', 'error');
            return;
        }
        if (new Date(date) > new Date()) {
            showToast('미래 날짜는 선택할 수 없습니다.', 'error');
            return;
        }

        const transactionData = {
            type,
            amount,
            category,
            description,
            date
        };

        let url = '/api/transactions'; 
        let method = 'POST';
        let successMessage = '내역이 성공적으로 추가되었습니다!';
        let errorMessage = '내역 추가에 실패했습니다: ';

        if (transactionId) {
            url = `${url}/${transactionId}`;
            method = 'PUT';
            successMessage = '내역이 성공적으로 수정되었습니다!';
            errorMessage = '내역 수정에 실패했습니다: ';
        }

        console.log(`${method} 요청 시도:`, transactionData);
        showSpinner(); // 스피너 표시 (폼 제출 시작 시)

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

            fetchAllTransactions(); // 작업 완료 후 모든 내역 새로고침
            transactionForm.reset(); // 폼 초기화
            document.getElementById('date').valueAsDate = new Date(); // 날짜 필드 초기화
            document.getElementById('transaction-id').value = ''; // hidden id 초기화
            document.getElementById('form-title').textContent = '새로운 내역 추가하기'; // 폼 제목 초기화
            document.getElementById('submit-button').textContent = '내역 추가'; // 버튼 텍스트 초기화

            showToast(successMessage, 'success');
        } catch (error) {
            console.error('작업 오류:', error);
            showToast(errorMessage + error.message, 'error');
        } finally {
            hideSpinner(); // 스피너 숨김 (폼 제출 완료 시)
        }
    });

    // --- 주요 내역 관리 함수 ---

    // 모든 내역을 백엔드에서 불러와 allTransactions 배열에 저장하는 함수
    async function fetchAllTransactions() {
        showSpinner(); // 스피너 표시
        try {
            const response = await fetch('/api/transactions');
            if (!response.ok) {
                throw new Error('내역을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            allTransactions = data.data;

            applyFiltersAndSort(); // 필터링 및 정렬 적용하여 표시
            populateMonthSelect(); // 월 선택 드롭다운 채우기 (요약 및 내보내기용)
            displayMonthlySummary(); // 월별 요약 표시
            renderExpenseChart(); // 지출 차트 렌더링
            renderIncomeExpenseTrendChart(); // 수입/지출 추이 차트 렌더링

        } catch (error) {
            console.error('내역 불러오기 오류:', error);
            transactionListDiv.innerHTML = '<p>내역을 불러오는 데 실패했습니다.</p>';
            showToast('내역을 불러오는 데 실패했습니다.', 'error');
        } finally {
            hideSpinner(); // 스피너 숨김
        }
    }

    // 필터링 및 정렬을 적용하여 내역을 표시하는 함수
    function applyFiltersAndSort() {
        let filteredTransactions = [...allTransactions]; // 원본 배열 복사

        const filterType = filterTypeSelect.value;
        const filterCategory = filterCategorySelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const sortBy = sortBySelect.value;

        // 유형 필터링
        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
        }

        // 카테고리 필터링
        if (filterCategory !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
        }

        // 날짜 범위 필터링
        if (startDate) {
            filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
        }
        if (endDate) {
            filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
        }

        // 정렬
        filteredTransactions.sort((a, b) => {
            if (sortBy === 'date-desc') {
                return new Date(b.date) - new Date(a.date);
            } else if (sortBy === 'date-asc') {
                return new Date(a.date) - new Date(b.date);
            } else if (sortBy === 'amount-desc') {
                return b.amount - a.amount;
            } else if (sortBy === 'amount-asc') {
                return a.amount - b.amount;
            }
            return 0; // 기본 정렬 없음
        });

        displayTransactions(filteredTransactions);
    }

    // 필터 초기화 함수
    function resetFilters() {
        filterTypeSelect.value = 'all';
        filterCategorySelect.value = 'all';
        sortBySelect.value = 'date-desc';
        startDateInput.value = '';
        endDateInput.value = '';
        applyFiltersAndSort();
        showToast('필터가 초기화되었습니다.', 'success');
    }

    // 내역 목록을 화면에 표시하는 함수
    function displayTransactions(transactionsToDisplay) {
        transactionListDiv.innerHTML = '';

        if (transactionsToDisplay && transactionsToDisplay.length > 0) {
            transactionsToDisplay.forEach(transaction => {
                const transactionItem = document.createElement('div');
                transactionItem.className = 'transaction-item';

                // YYYY-MM-DD 형식의 날짜를 현지화된 포맷으로 변환
                const displayDate = new Date(transaction.date + 'T00:00:00'); // 시간대 문제를 피하기 위해 'T00:00:00' 추가
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
                        <button class="edit-btn button edit" data-id="${transaction.id}">수정</button>
                        <button class="delete-btn button delete" data-id="${transaction.id}">삭제</button>
                    </div>
                    <hr>
                `;
                transactionListDiv.appendChild(transactionItem);

                // 이벤트 리스너 추가
                transactionItem.querySelector('.edit-btn').addEventListener('click', () => {
                    editTransaction(transaction);
                });

                transactionItem.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteTransaction(transaction.id);
                });
            });
        } else {
            transactionListDiv.innerHTML = '<p>해당 조건에 맞는 내역이 없어요. 새로운 내역을 추가하거나 필터를 초기화해보세요!</p>';
        }
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

        showToast('내역 수정 모드로 전환되었습니다.', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 폼으로 스크롤 이동
    }

    // 내역 삭제 함수
    async function deleteTransaction(id) {
        if (!confirm('정말로 이 내역을 삭제하시겠습니까?')) {
            return;
        }
        showSpinner(); // 스피너 표시

        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '내역 삭제 중 알 수 없는 오류가 발생했습니다.');
            }

            const result = await response.json();
            console.log('내역 삭제 성공:', result);

            fetchAllTransactions(); // 삭제 후 내역 새로고침

            showToast('내역이 성공적으로 삭제되었습니다!', 'success');
        } catch (error) {
            console.error('내역 삭제 오류:', error);
            showToast('내역 삭제에 실패했습니다: ' + error.message, 'error');
        } finally {
            hideSpinner(); // 스피너 숨김
        }
    }

    // --- 월별 요약 및 내보내기 기능 관련 함수 ---

    // 월 선택 드롭다운에 옵션 채우기 (요약 및 내보내기용)
    async function populateMonthSelect() {
        const months = new Set();
        allTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            months.add(`${year}-${month}`);
        });

        // 최신 월이 먼저 오도록 정렬
        const sortedMonths = Array.from(months).sort((a, b) => {
            const [aYear, aMonth] = a.split('-').map(Number);
            const [bYear, bMonth] = b.split('-').map(Number);
            if (bYear !== aYear) return bYear - aYear;
            return bMonth - aMonth;
        });

        // summaryMonthSelect 초기화 및 채우기
        summaryMonthSelect.innerHTML = '<option value="">월 선택</option>';
        // exportMonthSelect 초기화 및 채우기
        exportMonthSelect.innerHTML = '<option value="all">전체 내역</option>'; // '전체 내역' 옵션 추가

        if (sortedMonths.length > 0) {
            sortedMonths.forEach(monthStr => {
                const [year, month] = monthStr.split('-');
                const option = document.createElement('option');
                option.value = monthStr;
                option.textContent = `${year}년 ${month}월`;
                summaryMonthSelect.appendChild(option.cloneNode(true)); // 복사하여 요약 드롭다운에 추가
                exportMonthSelect.appendChild(option); // 원본은 내보내기 드롭다운에 추가
            });
            // 가장 최신 월을 summaryMonthSelect의 기본 선택값으로 설정
            const latestMonth = sortedMonths[0];
            if (latestMonth) {
                summaryMonthSelect.value = latestMonth;
            } else {
                summaryMonthSelect.value = '';
            }
        } else {
            summaryMonthSelect.innerHTML = '<option value="">내역 없음</option>';
            summaryMonthSelect.value = '';
        }

        // 월 선택 드롭다운이 채워진 후 요약 및 차트 업데이트
        displayMonthlySummary();
        renderExpenseChart();
    }

    // 선택된 월의 요약 정보를 가져와 화면에 표시
    async function displayMonthlySummary() {
        const selectedMonth = summaryMonthSelect.value;
        if (!selectedMonth) {
            monthlySummaryDiv.innerHTML = '<p>월을 선택하면 요약을 볼 수 있어요.</p>';
            return;
        }
        showSpinner(); // 스피너 표시

        const [year, month] = selectedMonth.split('-');

        try {
            const response = await fetch(`/api/summary/${year}/${month}`);
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
            showToast('월별 요약을 불러오는 데 실패했습니다.', 'error');
        } finally {
            hideSpinner(); // 스피너 숨김
        }
    }

    // --- 차트 기능 관련 함수 ---

    // 월별 지출 카테고리 파이 차트 그리기
    async function renderExpenseChart() {
        const selectedMonth = summaryMonthSelect.value;
        
        // 기존 캔버스 요소를 참조
        let currentExpenseChartCanvas = document.getElementById('expenseChart');

        if (!selectedMonth) {
            if (expenseChartInstance) {
                expenseChartInstance.destroy(); // 기존 차트 파괴
                expenseChartInstance = null;
            }
            const chartContainer = currentExpenseChartCanvas.parentElement;
            // 캔버스를 제거하고 다시 생성하여 Chart.js의 재 초기화 문제 방지
            chartContainer.innerHTML = '<canvas id="expenseChart"></canvas><p style="text-align: center; margin-top: 10px;">월을 선택하면 지출 분석 차트를 볼 수 있어요.</p>';
            expenseChartCanvas = document.getElementById('expenseChart'); // 새로 생성된 캔버스 요소를 다시 참조
            return;
        }

        const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);

        const categoryExpenses = {};
        allTransactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (t.type === 'expense' &&
                transactionDate.getFullYear() === selectedYear &&
                (transactionDate.getMonth() + 1) === selectedMonthNum) {
                categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
            }
        });

        const labels = Object.keys(categoryExpenses);
        const dataValues = Object.values(categoryExpenses);

        if (labels.length === 0) {
            if (expenseChartInstance) {
                expenseChartInstance.destroy(); // 기존 차트 파괴
                expenseChartInstance = null;
            }
            const chartContainer = currentExpenseChartCanvas.parentElement;
            chartContainer.innerHTML = '<canvas id="expenseChart"></canvas><p style="text-align: center; margin-top: 10px;">선택된 월에 지출 내역이 없습니다.</p>';
            expenseChartCanvas = document.getElementById('expenseChart'); // 새로 생성된 캔버스 요소를 다시 참조
            return;
        }

        const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#E7E9ED', '#8AC926', '#F4A261', '#2A9D8F', '#E9C46A', '#F4F1DE'
        ];
        const borderColors = backgroundColors.map(color => color + 'B3'); // B3는 70% 투명도

        if (expenseChartInstance) {
            expenseChartInstance.destroy(); // 기존 차트 파괴
        }

        const ctx = expenseChartCanvas.getContext('2d');
        expenseChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors.slice(0, labels.length),
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
    }

    // 월별 수입/지출 추이 차트 그리기
    async function renderIncomeExpenseTrendChart() {
        showSpinner(); // 스피너 표시
        try {
            const response = await fetch('/api/monthly-trends');
            if (!response.ok) {
                throw new Error('월별 추이 데이터를 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            const trends = data.data;

            let currentIncomeExpenseTrendChartCanvas = document.getElementById('incomeExpenseTrendChart');

            if (trends.length === 0) {
                if (incomeExpenseTrendChartInstance) {
                    incomeExpenseTrendChartInstance.destroy(); // 기존 차트 파괴
                    incomeExpenseTrendChartInstance = null;
                }
                const chartContainer = currentIncomeExpenseTrendChartCanvas.parentElement;
                chartContainer.innerHTML = '<canvas id="incomeExpenseTrendChart"></canvas><p style="text-align: center; margin-top: 10px;">수입/지출 추이 데이터를 표시할 내역이 없습니다.</p>';
                incomeExpenseTrendChartCanvas = document.getElementById('incomeExpenseTrendChart'); // 새로 생성된 캔버스 요소를 다시 참조
                return;
            }

            // 월 데이터를 'YYYY-MM' 형식으로 변환하고 정렬
            const sortedTrends = trends.sort((a, b) => {
                const dateA = new Date(a.year, a.month - 1);
                const dateB = new Date(b.year, b.month - 1);
                return dateA - dateB;
            });

            const labels = sortedTrends.map(t => `${t.year}년 ${t.month}월`);
            const incomes = sortedTrends.map(t => t.totalIncome);
            const expenses = sortedTrends.map(t => t.totalExpense);

            if (incomeExpenseTrendChartInstance) {
                incomeExpenseTrendChartInstance.destroy(); // 기존 차트 파괴
            }

            const ctx = incomeExpenseTrendChartCanvas.getContext('2d');
            incomeExpenseTrendChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '총 수입',
                            data: incomes,
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.2)',
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: '총 지출',
                            data: expenses,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.2)',
                            fill: true,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: '월별 수입/지출 추이'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '월'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '금액 (원)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

        } catch (error) {
            console.error('월별 수입/지출 추이 차트 렌더링 오류:', error);
            const chartContainer = incomeExpenseTrendChartCanvas.parentElement;
            chartContainer.innerHTML = '<canvas id="incomeExpenseTrendChart"></canvas><p style="text-align: center; margin-top: 10px;">수입/지출 추이 차트를 불러오는 데 실패했습니다.</p>';
            showToast('수입/지출 추이 차트를 불러오는 데 실패했습니다.', 'error');
        } finally {
            hideSpinner(); // 스피너 숨김
        }
    }

    // 사용자에게 메시지를 표시하는 토스트 알림 함수
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.warn("Toast container not found. Alerting instead:", message);
            alert(message); // 토스트 컨테이너가 없으면 alert로 대체
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // 짧은 지연 후 'show' 클래스 추가하여 트랜지션 시작
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 지정된 시간 후 'show' 클래스 제거 및 제거
        setTimeout(() => {
            toast.classList.remove('show');
            // 트랜지션이 끝난 후 토스트 제거
            toast.addEventListener('transitionend', () => {
                toast.remove();
            }, { once: true }); // 이벤트 리스너는 한 번만 실행되도록 설정
        }, duration);
    }

    // 로딩 스피너 표시 함수
    function showSpinner() {
        loadingSpinner.classList.add('show');
    }

    // 로딩 스피너 숨김 함수
    function hideSpinner() {
        loadingSpinner.classList.remove('show');
    }
});
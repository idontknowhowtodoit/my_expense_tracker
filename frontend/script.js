/* 기본 스타일 */
body {
    font-family: 'Noto Sans KR', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f7f6;
    color: #333;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    background-color: #2c3e50;
    color: #fff;
    padding: 20px 0;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

header h1 {
    margin: 0;
    font-size: 2.2em;
    letter-spacing: 1px;
}

main {
    padding: 20px;
    max-width: 1000px;
    margin: 20px auto;
}

/* 카드 스타일 */
.card {
    background-color: #fff;
    padding: 25px;
    margin-bottom: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    transition: transform 0.2s ease-in-out;
}

.card:hover {
    transform: translateY(-3px);
}

.card h2 {
    color: #34495e;
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.8em;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
    text-align: center;
}

/* 폼 스타일 */
.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select {
    width: calc(100% - 20px);
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1em;
    box-sizing: border-box; /* 패딩이 너비에 포함되도록 */
}

.form-group input[type="number"]::-webkit-inner-spin-button,
.form-group input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.form-group input[type="number"] {
    -moz-appearance: textfield; /* Firefox */
}


.button {
    display: inline-block;
    padding: 12px 25px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1em;
    font-weight: bold;
    transition: background-color 0.3s ease;
    width: 100%; /* 폼 버튼 너비 조정 */
    box-sizing: border-box;
}

.button.primary {
    background-color: #3498db;
    color: #fff;
}

.button.primary:hover {
    background-color: #2980b9;
}

.button.edit {
    background-color: #f39c12;
    color: #fff;
    padding: 8px 15px; /* 작은 버튼 패딩 */
    font-size: 0.9em;
    width: auto;
    margin-right: 10px;
}

.button.edit:hover {
    background-color: #e67e22;
}

.button.delete {
    background-color: #e74c3c;
    color: #fff;
    padding: 8px 15px; /* 작은 버튼 패딩 */
    font-size: 0.9em;
    width: auto;
}

.button.delete:hover {
    background-color: #c0392b;
}

/* 내역 목록 스타일 */
#transaction-list .transaction-item {
    background-color: #fcfcfc;
    border: 1px solid #eee;
    padding: 15px 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap; /* 작은 화면에서 줄바꿈 */
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.2s ease-in-out;
}

#transaction-list .transaction-item:hover {
    background-color: #f0f0f0;
}

#transaction-list .transaction-item p {
    margin: 5px 0;
    flex-basis: 45%; /* 두 개의 단락이 한 줄에 오도록 */
}

#transaction-list .transaction-item p:first-child {
    font-weight: bold;
    font-size: 1.1em;
    flex-basis: 100%; /* 첫 번째 p는 항상 한 줄 */
}

#transaction-list .transaction-item .actions {
    flex-basis: 100%; /* 버튼은 항상 새로운 줄에 */
    text-align: right;
    margin-top: 10px;
}

#transaction-list hr {
    border: none;
    border-top: 1px dashed #eee;
    margin: 20px 0;
}

#transaction-list .transaction-item:last-of-type hr {
    display: none; /* 마지막 아이템에는 구분선 없음 */
}

/* 월별 요약 스타일 */
#monthly-summary {
    background-color: #ecf0f1;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    margin-top: 20px;
}

#monthly-summary h3 {
    color: #2c3e50;
    margin-top: 0;
    font-size: 1.6em;
}

#monthly-summary p {
    font-size: 1.1em;
    margin: 8px 0;
}

/* 차트 섹션 스타일 */
.chart-container {
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    margin-bottom: 20px;
    text-align: center;
}

.chart-container h3 {
    color: #34495e;
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.6em;
}

/* 토스트 알림 */
#toast-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.toast {
    background-color: #333;
    color: #fff;
    padding: 10px 20px;
    border-radius: 5px;
    margin-bottom: 10px;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    min-width: 250px;
    text-align: center;
}

.toast.show {
    opacity: 1;
    transform: translateY(0);
}

.toast.success {
    background-color: #28a745; /* Green */
}

.toast.error {
    background-color: #dc3545; /* Red */
}

.toast.info {
    background-color: #17a2b8; /* Blue */
}


/* 푸터 스타일 */
footer {
    text-align: center;
    padding: 20px;
    margin-top: 30px;
    background-color: #2c3e50;
    color: #ecf0f1;
    font-size: 0.9em;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    header h1 {
        font-size: 1.8em;
    }

    .card {
        padding: 15px;
    }

    .card h2 {
        font-size: 1.5em;
    }

    .form-group input,
    .form-group select,
    .button {
        padding: 10px;
        font-size: 0.95em;
    }

    #transaction-list .transaction-item p {
        flex-basis: 100%; /* 작은 화면에서는 각 단락이 한 줄에 */
        text-align: left;
    }

    #transaction-list .transaction-item .actions {
        text-align: left;
        margin-top: 5px;
    }
}

/* 필터링 및 정렬 섹션 스타일 */
.filters-sort-section {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.filters-sort-section h2 {
    color: #333;
    margin-bottom: 15px;
    font-size: 1.4em;
    text-align: center;
}

.filter-controls {
    display: flex;
    flex-wrap: wrap; /* 작은 화면에서 줄바꿈 */
    gap: 15px; /* 요소들 사이의 간격 */
    margin-bottom: 20px;
    justify-content: center; /* 중앙 정렬 */
}

.filter-group {
    display: flex;
    flex-direction: column; /* 라벨과 입력 필드를 세로로 정렬 */
    align-items: flex-start; /* 왼쪽 정렬 */
    min-width: 150px; /* 최소 너비 설정 */
}

.filter-group label {
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
    font-size: 0.9em;
}

.filter-group select,
.filter-group input[type="date"] {
    padding: 8px 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 0.95em;
    width: 100%; /* 부모에 맞춰 너비 조절 */
    box-sizing: border-box; /* 패딩 포함 너비 계산 */
}

#reset-filters-btn {
    display: block; /* 블록 요소로 만들어 너비 100% 사용 */
    width: fit-content; /* 내용에 맞는 너비 */
    margin: 15px auto 0; /* 중앙 정렬 및 위쪽 마진 */
    padding: 10px 20px;
    background-color: #007bff; /* 파란색 */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease;
}

#reset-filters-btn:hover {
    background-color: #0056b3;
}

/* 반응형 디자인을 위한 미디어 쿼리 (선택 사항, 필요시 추가) */
@media (max-width: 768px) {
    .filter-controls {
        flex-direction: column; /* 작은 화면에서는 세로로 쌓기 */
        align-items: stretch; /* 전체 너비 사용 */
    }
    .filter-group {
        min-width: unset; /* 최소 너비 제한 해제 */
        width: 100%; /* 전체 너비 사용 */
    }
}

/* 로딩 스피너 스타일 */
.spinner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8); /* 반투명 흰색 배경 */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* 다른 요소들 위에 표시 */
    opacity: 0; /* 기본적으로 숨김 */
    visibility: hidden; /* 기본적으로 숨김 */
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.spinner-overlay.show {
    opacity: 1;
    visibility: visible;
}

.spinner {
    border: 8px solid #f3f3f3; /* Light grey */
    border-top: 8px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner-overlay p {
    color: #555;
    font-size: 1.2em;
    font-weight: bold;
}
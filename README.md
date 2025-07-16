# my_expense_tracker: 나만의 스마트 가계부

이 프로젝트는 Node.js (Express), MongoDB (Mongoose), 그리고 HTML/CSS/Vanilla JavaScript를 사용하여 개발된 풀스택 웹 기반 가계부 애플리케이션입니다. 사용자들은 자신의 수입과 지출 내역을 기록하고, 필터링 및 정렬하여 조회하며, 월별 요약 및 다양한 시각화 차트를 통해 재정 상태를 한눈에 파악할 수 있습니다. 또한, 필요에 따라 가계부 데이터를 CSV 파일로 내보내는 기능도 제공합니다.

---

## ✨ 주요 기능

* **내역 추가/수정/삭제 (CRUD):** 수입/지출 내역을 쉽고 간편하게 입력, 수정, 삭제할 수 있습니다.
* **유형 및 카테고리 분류:** 수입과 지출을 명확하게 구분하고, 다양한 카테고리로 분류하여 관리할 수 있습니다.
* **내역 필터링 및 정렬:**
    * 유형(수입/지출), 카테고리, 날짜 범위별로 내역을 필터링할 수 있습니다.
    * 날짜 및 금액 기준으로 내역을 정렬하여 볼 수 있습니다.
* **월별 재정 요약:** 선택한 월의 총 수입, 총 지출, 순수익을 한눈에 확인할 수 있습니다.
* **데이터 시각화 (차트):**
    * 월별 지출 카테고리 파이 차트로 지출 분포를 시각적으로 보여줍니다.
    * 월별 수입/지출 추이 라인 차트로 장기적인 재정 흐름을 파악할 수 있습니다.
* **데이터 내보내기 (CSV):** 특정 월 또는 전체 가계부 내역을 CSV 파일로 다운로드할 수 있습니다.
* **사용자 경험 (UI/UX) 개선:** 로딩 스피너, 토스트 알림, 반응형 디자인을 적용하여 사용자 친화적인 인터페이스를 제공합니다.
* **데이터 유효성 검사:** 백엔드와 프론트엔드 모두에서 입력 데이터의 유효성을 검사하여 데이터 무결성을 강화했습니다.

---

## 🛠️ 기술 스택

* **Backend:**
    * Node.js
    * Express.js
    * Mongoose (MongoDB ODM)
    * MongoDB (데이터베이스)
* **Frontend:**
    * HTML5
    * CSS3
    * Vanilla JavaScript (ES6+)
    * Chart.js (차트 시각화 라이브러리)
* **Development Tools:**
    * Git (버전 관리)
    * VS Code (통합 개발 환경)

---

## 🚀 시작하는 방법 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계를 따르세요.

### 1. 전제 조건

* **Node.js (v14 이상 권장) 및 npm** (Node Package Manager) 설치
* **MongoDB Community Server** 설치 및 실행
    * **⚠️ MongoDB 서버 실행 필수:** 프로젝트 실행 전에 MongoDB 서버가 백그라운드에서 실행 중인지 확인하세요. (일반적으로 서비스로 설치되며, 시작 유형은 자동입니다.)
    * **[MongoDB Community Server 다운로드](https://www.mongodb.com/try/download/community)**
    * **Docker 사용 시:** Docker Desktop 설치 후 다음 명령어로 MongoDB 컨테이너 실행
        ```bash
        docker pull mongo:latest
        docker run --name my-mongo -p 27017:27017 -d mongo
        ```
    * **클라우드 (MongoDB Atlas) 사용 시:** `backend/server.js` 파일의 MongoDB 연결 문자열을 Atlas에서 제공하는 문자열로 변경해야 합니다.

### 2. 프로젝트 클론 및 설치

1.  **GitHub 리포지토리 클론:**
    ```bash
    git clone [당신의 GitHub 레포지토리 URL]
    cd my_expense_tracker
    ```

2.  **백엔드 종속성 설치:**
    ```bash
    cd backend
    npm install
    ```
    (이 명령어를 통해 `mongoose` 및 `express` 등 백엔드에 필요한 모든 패키지가 설치됩니다.)

3.  **프론트엔드는 별도의 `npm install`이 필요 없습니다.** (Chart.js는 CDN으로 로드됩니다.)

### 3. 애플리케이션 실행

1.  **백엔드 서버 실행:**
    `backend` 폴더 내에서 다음 명령어를 실행합니다.
    ```bash
    node server.js
    ```
    서버가 성공적으로 실행되면 `서버가 http://localhost:3000 에서 실행 중입니다.` 메시지가 터미널에 표시됩니다.

2.  **프론트엔드 접속:**
    웹 브라우저를 열고 다음 주소로 접속합니다.
    ```
    http://localhost:3000
    ```
    이제 "my_expense_tracker" 가계부 애플리케이션을 사용할 수 있습니다!
# loadbalancer

## 할 일

- 서버 부하 기준 설정 및 서버 증설 테스트
- 증설된 서버 사용자 유입 테스트
- 적정 부하로 돌아왔을 때 사용자 유입 변경하는 테스트
- 빈 서버 종료 테스트?

## 백앤드 로드밸런서 구성

아키텍처는 다음과 같습니다.

[backend architecture](https://github.com/pg-kkn1125/loadbalancer/blob/main/backend/README.md)

## 프론트 구성

vite로 환경을 구축. port는 5000번.

```bash
yarn start
```

### 로그인

로그인 창 시점에서 접속되어 있는 플레이어가 움직이는 데이터를 받아 표시.

### 로그인 후

서버 측에서 플레이어 데이터를 저장하고 움직일 때는 유저 deviceID와 로케이션 데이터만 broadcast 됨.

### 새로고침 또는 페이지 나가기

소켓이 끊어지면서 렌더링 되는 유저 리스트에서 제외

### 서버

PM2에서 지원하는 클러스터를 서버라 함

### 공간

유저가 공간을 URL형태로 받아 접속하게 됨

### 채널

공간에는 여러 채널을 가지는데 채널당 유저 제한은 50명이며, 해당 채널에 있는 인원만 서로를 인지 가능

### 뷰어 데이터 규격

```javascript
const viewer = {
  id: 1,
  type: "viewer",
  timestamp: new Date().getTime(),
  deviceID: deviceID,
  server: se,
  space: sp,
  // channel: ch,
  host: host,
};
```

### 플레이어 데이터 규격

```javascript
const player = {
  id: 1,
  type: "player",
  timestamp: new Date().getTime(),
  deviceID: deviceID,
  server: se,
  space: sp,
  // channel: ch,
  host: host,
};
```

### 로케이션 데이터 규격

작성 중 ...

### 로그인 데이터 규격

작성 중 ...

## 채팅 데이터 규격

작성 중 ...

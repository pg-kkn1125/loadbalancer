/**
 * viewer
 * {
 *   id: "",
 *   device: "",
 * }
 *
 * player
 * {
 *   id: "",
 *   device: "",
 *   authority: "",
 *   avatar: "",
 *   pox: "",
 *   poy: "",
 *   poz: "",
 *   roy: "",
 *   state: "",
 * }
 */

/**
 * 사용자 생성 클래스
 */
class User {
  type = null;
  timestamp = null;
  deviceID = null;
  server = null;
  space = null;
  channel = null;
  device = null;
  host = null;
  id = null;
  nickname = null;
  authority = null;
  avatar = null;
  pox = null;
  poy = null;
  poz = null;
  roy = null;
  state = null;
  /**
   * 사용자 생성자
   * @param {object} data 사용자 데이터
   * @requires @param {'viewer'|'player'} data.type 사용자 타입 (서버 할당) [ viewer | player ]
   * @param {number} data.timestamp 생성 시간 (서버 할당) [ viewer | player ]
   * @param {number} data.deviceID 디바이스 아이디 (서버 할당) [ viewer | player ]
   * @param {number} data.server 서버 (서버 할당) [ viewer | player ]
   * @param {string} data.space 공간 (서버 할당) [ viewer | player ]
   * @param {number} data.channel 채널 (서버 할당) [ viewer | player ]
   * @param {string} data.device 디바이스 정보 [ viewer | player ]
   * @param {string} data.host 호스트 경로 [ viewer | player ]
   *
   * 플레이어 타입 필드
   * @param {number} data.id 아이디 [ player ]
   * @param {string} data.nickname 닉네임 [ player ]
   * @param {string} data.authority 권한 [ player ]
   * @param {string} data.avatar 아바타 [ player ]
   * @param {number} data.pox 캐릭터 x값 [ player ]
   * @param {number} data.poy 캐릭터 y값 [ player ]
   * @param {number} data.poz 캐릭터 z값 [ player ]
   * @param {number} data.roy ?? [ player ]
   * @param {string} data.state 상태(online/offline) [ player ]
   */
  constructor(data) {
    const isViewer = data.type === "viewer" && "Viewer";
    const isPlayer = data.type === "player" && "Player";

    if (isViewer) this.#createViewerData(data);
    if (isPlayer) this.#createPlayerData(data);
  }

  #createViewerData({
    type,
    server,
    space,
    channel,
    device,
    deviceID,
    host,
    timestamp,
  }) {
    this.type = type;
    this.server = server;
    this.space = space;
    this.channel = channel;
    this.device = device;
    this.deviceID = deviceID;
    this.host = host;
    this.timestamp = timestamp;
  }

  #createPlayerData({
    type,
    id,
    nickname,
    server,
    space,
    channel,
    device,
    deviceID,
    authority,
    avatar,
    pox,
    poy,
    poz,
    roy,
    state,
    host,
    timestamp,
  }) {
    this.type = type;
    this.id = id;
    this.nickname = nickname;
    this.server = server;
    this.space = space;
    this.channel = channel;
    this.device = device;
    this.deviceID = deviceID;
    this.authority = authority;
    this.avatar = avatar;
    this.pox = pox;
    this.poy = poy;
    this.poz = poz;
    this.roy = roy;
    this.state = state;
    this.host = host;
    this.timestamp = timestamp;
  }

  toJSON() {
    return Object.entries(this).reduce((acc, [key, value]) => {
      if (Boolean(value)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}

export default User;

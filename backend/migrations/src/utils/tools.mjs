/**
 * 채널 현황 로그
 * @param {string} sp - 공간
 * @param {number} ch - 채널
 * @param {boolean} disable - 로그 비활성화 default: false
 */

const checkLog =
  (sp, ch, disable = false) =>
  (spaces) => {
    if (disable) return;

    const channelUserCount = spaces.checkChannelUserAmount(sp, ch);
    const channelViewerCount = spaces.checkChannelUserAmountByType(
      sp,
      ch,
      "viewer"
    );
    const channelPlayerCount = spaces.checkChannelUserAmountByType(
      sp,
      ch,
      "player"
    );
    const spaceUserCount = spaces.checkSpaceUserAmount(sp);

    console.log(
      `[${sp}공간|${ch}채널]`,
      `채널 내 유저 인원: ${channelUserCount} 명`.padStart(20, " ")
    );
    console.log(
      `[${sp}공간|${ch}채널]`,
      `채널 내 뷰어 인원: ${channelViewerCount} 명`.padStart(20, " ")
    );
    console.log(
      `[${sp}공간|${ch}채널]`,
      `채널 내 플레이어 인원: ${channelPlayerCount} 명`.padStart(18, " ")
    );
    console.log(
      `[${sp}공간|${ch}채널]`,
      `공간 내 유저 인원: ${spaceUserCount} 명`.padStart(20, " ")
    );
  };
export { checkLog };

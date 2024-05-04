enum ERedisSubEvents {
  joinRoom = 'currentRoomJoinToTargetRoom',
  leaveRoom = 'kickTargetRoomFromCurrentRoom',
  sendToRoom = 'sendToRoom',
}

export { ERedisSubEvents };

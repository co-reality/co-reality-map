const { VideoRoomIdSchema } = require("../types/videoRoom");

const checkIfValidVideoRoomId = (venueId) =>
  VideoRoomIdSchema.isValidSync(venueId);

exports.checkIfValidVideoRoomId = checkIfValidVideoRoomId;

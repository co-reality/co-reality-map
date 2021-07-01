const yup = require("yup");

const VIDEO_ROOM_ID_REGEX = /[a-z0-9_]{1,250}/;

export const VideoRoomIdSchema = yup
  .string()
  .matches(VIDEO_ROOM_ID_REGEX)
  .required();

export const VideoRoomRequestSchema = yup.object().shape({
  hostUserId: yup.string().required(),
  hostUserLocation: yup.string().required(),
  invitedUserId: yup.string().required(),
  state: yup.string().required(),
  createdAt: yup.number().required(),
});

export const VideoRoomStateSchema = yup.object().shape({
  videoRoomId: VideoRoomIdSchema,
  state: yup.string().required(),
});

export const AcceptVideoRoomRequestSchema = yup.object().shape({
  videoRoomId: VideoRoomIdSchema,
  state: yup.string().required(),
  invitedUserLocation: yup.string().required(),
});

export const VideoRoomInviteSchema = yup.object().shape({
  videoRoomId: VideoRoomIdSchema,
  videoRoomRequest: VideoRoomRequestSchema,
});

exports.VideoRoomIdSchema = VideoRoomIdSchema;
exports.VideoRoomStateSchema = VideoRoomStateSchema;
exports.AcceptVideoRoomRequestSchema = AcceptVideoRoomRequestSchema;
exports.VideoRoomInviteSchema = VideoRoomInviteSchema;

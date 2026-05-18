export const getGroupMeetingsHref = (groupId: string) => `/group/${groupId}/meetings`

export const getMeetingDetailHref = (meetingId: string, groupId?: string | null) =>
  groupId ? `/group/${groupId}/meetings/${meetingId}` : `/meeting/${meetingId}`

export const getMeetingSessionHref = (meetingId: string, groupId?: string | null) =>
  groupId ? `/group/${groupId}/meetings/${meetingId}/session` : `/meeting/${meetingId}/session`

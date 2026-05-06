"use client"

import { VideoTrack, isTrackReference, type TrackReferenceOrPlaceholder } from "@livekit/components-react"
import { Hand, Mic, MicOff, MonitorUp, Video, VideoOff } from "lucide-react"
import { Track } from "livekit-client"
import type { MeetingParticipantSignalState } from "@/components/meeting-room/types"

type ParticipantTileProps = {
  trackRef: TrackReferenceOrPlaceholder
  isActiveSpeaker: boolean
  isHost: boolean
  isCurrentUser: boolean
  isSingleParticipant: boolean
  layout?: "grid" | "stage" | "filmstrip"
  participantSignal?: MeetingParticipantSignalState
}

function getParticipantLabel(trackRef: TrackReferenceOrPlaceholder) {
  return (
    trackRef.participant.name ||
    trackRef.participant.attributes?.email ||
    trackRef.participant.identity
  )
}

export function ParticipantTile({
  trackRef,
  isActiveSpeaker,
  isHost,
  isCurrentUser,
  isSingleParticipant,
  layout = "grid",
  participantSignal,
}: ParticipantTileProps) {
  const participant = trackRef.participant
  const isScreenShare = trackRef.source === Track.Source.ScreenShare
  const showVideo = isTrackReference(trackRef) && trackRef.publication.isSubscribed
  const label = getParticipantLabel(trackRef)
  const isFilmstrip = layout === "filmstrip"
  const isStage = layout === "stage"
  const raisedHand = participantSignal?.raisedHand ?? false
  const reactionEmoji = participantSignal?.reactionEmoji

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-md border bg-card shadow-sm transition-all",
        isFilmstrip
          ? "h-36 min-h-36 border-border xl:h-full xl:min-h-0"
          : isStage
            ? "h-full min-h-0 border-primary/30"
            : isScreenShare
              ? "h-full min-h-0 border-primary/30 lg:col-span-2"
              : isSingleParticipant
                ? "h-full min-h-0 border-border"
                : "h-full min-h-0 border-border",
        isActiveSpeaker ? "ring-2 ring-emerald-300 shadow-md" : "",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-linear-to-br from-gray-950 via-gray-900 to-gray-800" />

      {showVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(17,24,39,0.95)_55%)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl font-semibold text-white backdrop-blur">
            {label.slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

      <div className={["absolute left-4 top-4 flex flex-wrap items-center gap-2", isFilmstrip ? "right-4" : ""].join(" ")}>
        {isActiveSpeaker ? (
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-emerald-950">
            Active speaker
          </span>
        ) : null}
        {isScreenShare ? (
          <span className="rounded-full bg-white/90 dark:bg-gray-800/90 px-3 py-1 text-[11px] font-semibold text-gray-900 dark:text-gray-100">
            Screen share
          </span>
        ) : null}
        {isHost ? (
          <span className="rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-950">
            Host
          </span>
        ) : null}
        {raisedHand ? (
          <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
            <Hand className="size-3" />
            Hand raised
          </span>
        ) : null}
      </div>

      {reactionEmoji ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/35 px-5 py-3 text-5xl shadow-lg backdrop-blur-md">
            {reactionEmoji}
          </div>
        </div>
      ) : null}

      <div className={["absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4", isFilmstrip ? "p-3" : ""].join(" ")}>
        <div className="min-w-0">
          <p className={["truncate font-semibold text-white", isFilmstrip ? "text-sm" : "text-base"].join(" ")}>
            {label}
            {isCurrentUser ? " (You)" : ""}
          </p>
          <p className="mt-1 text-xs text-white/75">
            {isActiveSpeaker ? "Speaking now" : "Live in room"}
          </p>
        </div>

        <div className={["flex items-center gap-2 rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-md", isFilmstrip ? "px-2.5 py-1.5" : "px-3 py-2"].join(" ")}>
          <span
            className={[
              "flex items-center gap-1 text-xs",
              participant.isMicrophoneEnabled ? "text-emerald-300" : "text-rose-300",
            ].join(" ")}
          >
            {participant.isMicrophoneEnabled ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
            Mic
          </span>
          <span
            className={[
              "flex items-center gap-1 text-xs",
              participant.isCameraEnabled || isScreenShare ? "text-sky-300" : "text-white/60",
            ].join(" ")}
          >
            {isScreenShare ? (
              <MonitorUp className="size-3.5" />
            ) : participant.isCameraEnabled ? (
              <Video className="size-3.5" />
            ) : (
              <VideoOff className="size-3.5" />
            )}
            {isScreenShare ? "Share" : "Cam"}
          </span>
        </div>
      </div>
    </article>
  )
}

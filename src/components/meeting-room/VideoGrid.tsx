"use client"

import { useMemo } from "react"
import { useParticipants, useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react"
import { Track, RoomEvent } from "livekit-client"
import { ParticipantTile } from "@/components/meeting-room/ParticipantTile"
import type { MeetingParticipantSignalState } from "@/components/meeting-room/types"

type VideoGridProps = {
  hostIdentity?: string
  currentUserIdentity?: string
  participantSignals: Record<string, MeetingParticipantSignalState>
}

function sortTrackRefs(trackRefs: TrackReferenceOrPlaceholder[], activeSpeakers: Set<string>) {
  return [...trackRefs].sort((left, right) => {
    const leftIsScreen = left.source === Track.Source.ScreenShare
    const rightIsScreen = right.source === Track.Source.ScreenShare

    if (leftIsScreen !== rightIsScreen) {
      return leftIsScreen ? -1 : 1
    }

    const leftIsActive = activeSpeakers.has(left.participant.identity)
    const rightIsActive = activeSpeakers.has(right.participant.identity)

    if (leftIsActive !== rightIsActive) {
      return leftIsActive ? -1 : 1
    }

    return left.participant.identity.localeCompare(right.participant.identity)
  })
}

function getGridClass(count: number) {
  if (count <= 1) {
    return "grid-cols-1 auto-rows-fr"
  }

  if (count === 2) {
    return "grid-cols-1 auto-rows-[minmax(280px,1fr)] lg:grid-cols-2"
  }

  if (count <= 4) {
    return "grid-cols-1 auto-rows-[minmax(240px,1fr)] md:grid-cols-2"
  }

  if (count <= 6) {
    return "grid-cols-1 auto-rows-[minmax(220px,1fr)] md:grid-cols-2 2xl:grid-cols-3"
  }

  return "grid-cols-1 auto-rows-[minmax(190px,1fr)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
}

export function VideoGrid({ hostIdentity, currentUserIdentity, participantSignals }: VideoGridProps) {
  const participants = useParticipants()
  const trackRefs = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    {
      onlySubscribed: false,
      updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
    }
  )

  const activeSpeakers = useMemo(
    () => new Set(participants.filter((participant) => participant.isSpeaking).map((participant) => participant.identity)),
    [participants]
  )

  const sortedTrackRefs = useMemo(
    () => sortTrackRefs(trackRefs, activeSpeakers),
    [trackRefs, activeSpeakers]
  )
  const screenShareTrackRefs = sortedTrackRefs.filter((trackRef) => trackRef.source === Track.Source.ScreenShare)
  const cameraTrackRefs = sortedTrackRefs.filter((trackRef) => trackRef.source !== Track.Source.ScreenShare)
  const featuredScreenShare = screenShareTrackRefs[0] ?? null
  const filmstripTrackRefs = cameraTrackRefs.length > 0 ? cameraTrackRefs : screenShareTrackRefs.slice(1)
  const participantCount = sortedTrackRefs.length
  const isSingleParticipant = participantCount <= 1

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col rounded-md border border-border bg-card/70 p-3 shadow-sm sm:p-4">

      {featuredScreenShare ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1 xl:flex-row xl:items-stretch">
          <div className="min-h-0 flex-1">
            <ParticipantTile
              key={`${featuredScreenShare.participant.identity}-${featuredScreenShare.source}`}
              trackRef={featuredScreenShare}
              isActiveSpeaker={activeSpeakers.has(featuredScreenShare.participant.identity)}
              isHost={featuredScreenShare.participant.identity === hostIdentity}
              isCurrentUser={featuredScreenShare.participant.identity === currentUserIdentity}
              isSingleParticipant={false}
              layout="stage"
              participantSignal={participantSignals[featuredScreenShare.participant.identity]}
            />
          </div>

          {filmstripTrackRefs.length > 0 ? (
            <div className="flex w-full min-w-0 flex-col gap-1 xl:max-w-[20rem]">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Participants</h3>
                <p className="text-xs text-muted-foreground">Screen sharing is active</p>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-2 xl:auto-rows-fr xl:grid-cols-1">
                {filmstripTrackRefs.map((trackRef) => (
                  <ParticipantTile
                    key={`${trackRef.participant.identity}-${trackRef.source}`}
                    trackRef={trackRef}
                    isActiveSpeaker={activeSpeakers.has(trackRef.participant.identity)}
                    isHost={trackRef.participant.identity === hostIdentity}
                    isCurrentUser={trackRef.participant.identity === currentUserIdentity}
                    isSingleParticipant={false}
                    layout="filmstrip"
                    participantSignal={participantSignals[trackRef.participant.identity]}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={["grid min-h-0 flex-1 gap-1 sm:gap-4", getGridClass(participantCount)].join(" ")}>
          {sortedTrackRefs.map((trackRef) => (
            <ParticipantTile
              key={`${trackRef.participant.identity}-${trackRef.source}`}
              trackRef={trackRef}
              isActiveSpeaker={activeSpeakers.has(trackRef.participant.identity)}
              isHost={trackRef.participant.identity === hostIdentity}
              isCurrentUser={trackRef.participant.identity === currentUserIdentity}
              isSingleParticipant={isSingleParticipant}
              participantSignal={participantSignals[trackRef.participant.identity]}
            />
          ))}
        </div>
      )}
    </section>
  )
}

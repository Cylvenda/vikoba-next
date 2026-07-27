"use client"

import { useRef, useState } from "react"
import { useLocalParticipant } from "@livekit/components-react"
import { FileText, Hand, MessageSquareText, Mic, MicOff, MonitorUp, PhoneOff, SmilePlus, Users, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MeetingSidebarTab } from "@/components/meeting-room/types"
import { useLanguage } from "@/components/language/language-provider"

type ControlBarProps = {
  raisedHand: boolean
  canAccessMinutes: boolean
  activeDocumentsPanel: Extract<MeetingSidebarTab, "agenda" | "minutes"> | null
  activePeoplePanel: Extract<MeetingSidebarTab, "chat" | "attendance"> | null
  onToggleRaisedHand: () => void
  onSendReaction: (emoji: string) => void
  onLeave: () => void
  onOpenDocumentsPanel: (tab: Extract<MeetingSidebarTab, "agenda" | "minutes">) => void
  onOpenPeoplePanel: (tab: Extract<MeetingSidebarTab, "chat" | "attendance">) => void
}

const REACTION_EMOJIS = ["👍", "👏", "🎉", "❤️", "😂", "😮"]

function ControlButton({
  active,
  danger = false,
  children,
  size = "default",
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  active?: boolean
  danger?: boolean
  size?: "default" | "sm" | "lg"
}) {
  const stateClasses = active
    ? "bg-chart-3 text-white hover:bg-chart-3/90"
    : danger
      ? ""
      : "text-muted-foreground hover:text-foreground"

  return (
    <Button
      variant={active ? "default" : danger ? "destructive" : "outline"}
      size={size}
      className={`shadow-sm transition-colors ${stateClasses} ${className ?? ""}`}
      {...props}
    >
      {children}
    </Button>
  )
}

function QuickPanelButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={[
        "rounded-xl shadow-sm transition-colors",
        active
          ? "bg-chart-3 text-white hover:bg-chart-3/90"
          : "text-muted-foreground hover:text-foreground",
        "text-xs sm:text-sm",
      ].join(" ")}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

export function ControlBar({
  raisedHand,
  canAccessMinutes,
  activeDocumentsPanel,
  activePeoplePanel,
  onToggleRaisedHand,
  onSendReaction,
  onLeave,
  onOpenDocumentsPanel,
  onOpenPeoplePanel,
}: ControlBarProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant()
  const [mediaActionPending, setMediaActionPending] = useState<null | "microphone" | "camera" | "screen-share">(null)
  const mediaActionInFlightRef = useRef(false)

  const runMediaAction = async (
    action: "microphone" | "camera" | "screen-share",
    callback: () => Promise<void>
  ) => {
    if (mediaActionInFlightRef.current) {
      return
    }

    mediaActionInFlightRef.current = true
    setMediaActionPending(action)

    try {
      await callback()
    } finally {
      mediaActionInFlightRef.current = false
      setMediaActionPending(null)
    }
  }

  const toggleMicrophone = () => {
    void runMediaAction("microphone", async () => {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
    })
  }

  const toggleCamera = () => {
    void runMediaAction("camera", async () => {
      await localParticipant.setCameraEnabled(!isCameraEnabled)
    })
  }

  const toggleScreenShare = async () => {
    await runMediaAction("screen-share", async () => {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
    })
  }

  return (
    <footer className="border-t border-border bg-background px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ControlButton
            type="button"
            active={isMicrophoneEnabled}
            onClick={toggleMicrophone}
            disabled={mediaActionPending !== null}
            className="rounded-xl px-2 sm:px-4 text-xs sm:text-sm"
          >
            {isMicrophoneEnabled ? <Mic className="size-3.5 sm:size-4" /> : <MicOff className="size-3.5 sm:size-4" />}
            <span className="hidden sm:inline">{isMicrophoneEnabled ? tt("Mic on", "Maikrofoni imewashwa") : tt("Mic off", "Maikrofoni imezimwa")}</span>
          </ControlButton>

          <ControlButton
            type="button"
            active={isCameraEnabled}
            onClick={toggleCamera}
            disabled={mediaActionPending !== null}
            className="rounded-xl px-2 sm:px-4 text-xs sm:text-sm"
          >
            {isCameraEnabled ? <Video className="size-3.5 sm:size-4" /> : <VideoOff className="size-3.5 sm:size-4" />}
            <span className="hidden sm:inline">{isCameraEnabled ? tt("Camera on", "Kamera imewashwa") : tt("Camera off", "Kamera imezimwa")}</span>
          </ControlButton>

          <ControlButton
            type="button"
            active={isScreenShareEnabled}
            onClick={toggleScreenShare}
            disabled={mediaActionPending !== null}
            className="rounded-xl px-2 sm:px-4 text-xs sm:text-sm"
          >
            <MonitorUp className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">{isScreenShareEnabled ? tt("Stop share", "Acha kushiriki") : tt("Share screen", "Shiriki skrini")}</span>
          </ControlButton>

          <ControlButton type="button" active={raisedHand} onClick={onToggleRaisedHand} className="rounded-xl px-2 sm:px-4 text-xs sm:text-sm">
            <Hand className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">{raisedHand ? tt("Hand raised", "Mkono umeinuliwa") : tt("Raise hand", "Inua mkono")}</span>
          </ControlButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ControlButton type="button" className="rounded-xl px-2 sm:px-4 text-xs sm:text-sm">
                <SmilePlus className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">{tt("Reactions", "Mwitikio")}</span>
              </ControlButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-md">
              <DropdownMenuLabel>{tt("Quick reactions", "Mwitikio wa haraka")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-row flex-wrap gap-2 p-2">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onSendReaction(emoji)}
                    className="rounded-lg bg-muted/50 px-3 py-2 text-xl transition-all hover:bg-chart-3 hover:text-white focus:outline-none focus:ring-2 focus:ring-chart-3 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 xl:flex">
            <QuickPanelButton
              active={activeDocumentsPanel === "agenda"}
              icon={<FileText className="size-4" />}
              label={tt("Agenda", "Ajenda")}
              onClick={() => onOpenDocumentsPanel("agenda")}
            />
            {canAccessMinutes ? (
              <QuickPanelButton
                active={activeDocumentsPanel === "minutes"}
                icon={<FileText className="size-4" />}
                label={tt("Minutes note", "Kumbukumbu")}
                onClick={() => onOpenDocumentsPanel("minutes")}
              />
            ) : null}
            <QuickPanelButton
              active={activePeoplePanel === "attendance"}
              icon={<Users className="size-4" />}
              label={tt("Attendance", "Mahudhurio")}
              onClick={() => onOpenPeoplePanel("attendance")}
            />
            <QuickPanelButton
              active={activePeoplePanel === "chat"}
              icon={<MessageSquareText className="size-4" />}
              label={tt("Chats", "Ujumbe")}
              onClick={() => onOpenPeoplePanel("chat")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 xl:hidden">
            <QuickPanelButton
              active={activeDocumentsPanel === "agenda"}
              icon={<FileText className="size-3.5 sm:size-4" />}
              label={tt("Agenda", "Ajenda")}
              onClick={() => onOpenDocumentsPanel("agenda")}
            />
            {canAccessMinutes ? (
              <QuickPanelButton
                active={activeDocumentsPanel === "minutes"}
                icon={<FileText className="size-3.5 sm:size-4" />}
                label={tt("Minutes", "Kumbukumbu")}
                onClick={() => onOpenDocumentsPanel("minutes")}
              />
            ) : null}
            <QuickPanelButton
              active={activePeoplePanel === "attendance"}
              icon={<Users className="size-3.5 sm:size-4" />}
              label={tt("Attendance", "Mahudhurio")}
              onClick={() => onOpenPeoplePanel("attendance")}
            />
            <QuickPanelButton
              active={activePeoplePanel === "chat"}
              icon={<MessageSquareText className="size-3.5 sm:size-4" />}
              label={tt("Chats", "Ujumbe")}
              onClick={() => onOpenPeoplePanel("chat")}
            />
          </div>

          <ControlButton type="button" danger size="sm" onClick={onLeave} className="rounded-xl">
            <PhoneOff className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">{tt("Leave", "Ondoka")}</span>
          </ControlButton>
        </div>
      </div>
    </footer>
  )
}

"use client"

import type { ReactNode } from "react"
import { useRef, useState } from "react"
import { useLocalParticipant } from "@livekit/components-react"
import { FileText, Hand, MessageSquareText, Mic, MicOff, MonitorUp, MoreVertical, PhoneOff, SmilePlus, Users, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  mobileEndSessionAction?: ReactNode
  onToggleRaisedHand: () => void
  onSendReaction: (emoji: string) => void
  onLeave: () => void
  onOpenDocumentsPanel: (tab: Extract<MeetingSidebarTab, "agenda" | "minutes">) => void
  onOpenPeoplePanel: (tab: Extract<MeetingSidebarTab, "chat" | "attendance">) => void
}

const REACTION_EMOJIS = ["👍", "❤️", "👏", "😂", "😮", "🎉", "👋"]

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
        "min-h-11 min-w-11 rounded-xl shadow-sm transition-colors",
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
  mobileEndSessionAction,
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
    <footer className="z-20 shrink-0 border-t border-border bg-background/95 px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,.08)] backdrop-blur sm:px-5 sm:py-3">
      <div className="mx-auto flex w-fit max-w-full items-center justify-center gap-2 rounded-2xl bg-muted/70 p-1.5 sm:hidden">
        <ControlButton
          type="button"
          active={isCameraEnabled}
          onClick={toggleCamera}
          disabled={mediaActionPending !== null}
          aria-label={isCameraEnabled ? tt("Turn camera off", "Zima kamera") : tt("Turn camera on", "Washa kamera")}
          className="size-11 rounded-full px-0"
        >
          {isCameraEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </ControlButton>

        <ControlButton
          type="button"
          active={isMicrophoneEnabled}
          onClick={toggleMicrophone}
          disabled={mediaActionPending !== null}
          aria-label={isMicrophoneEnabled ? tt("Turn microphone off", "Zima maikrofoni") : tt("Turn microphone on", "Washa maikrofoni")}
          className="size-11 rounded-full px-0"
        >
          {isMicrophoneEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </ControlButton>

        <ControlButton
          type="button"
          active={raisedHand}
          onClick={onToggleRaisedHand}
          aria-label={raisedHand ? tt("Lower hand", "Shusha mkono") : tt("Raise hand", "Inua mkono")}
          className="size-11 rounded-full px-0"
        >
          <Hand className="size-5" />
        </ControlButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ControlButton
              type="button"
              aria-label={tt("More meeting controls", "Vidhibiti zaidi vya kikao")}
              className="size-11 rounded-full px-0"
            >
              <MoreVertical className="size-5" />
            </ControlButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            sideOffset={12}
            className="z-[100] w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
          >
            <DropdownMenuLabel>{tt("More meeting controls", "Vidhibiti zaidi vya kikao")}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="grid grid-cols-2 gap-2 p-1">
              <DropdownMenuItem className="h-11" onSelect={() => void toggleScreenShare()}>
                <MonitorUp className="size-4" />
                {isScreenShareEnabled ? tt("Stop share", "Acha skrini") : tt("Share screen", "Shiriki skrini")}
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11" onSelect={() => onOpenDocumentsPanel("agenda")}>
                <FileText className="size-4" />
                {tt("Agenda", "Ajenda")}
              </DropdownMenuItem>
              {canAccessMinutes ? (
                <DropdownMenuItem className="h-11" onSelect={() => onOpenDocumentsPanel("minutes")}>
                  <FileText className="size-4" />
                  {tt("Minutes", "Kumbukumbu")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem className="h-11" onSelect={() => onOpenPeoplePanel("attendance")}>
                <Users className="size-4" />
                {tt("Attendance", "Mahudhurio")}
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11" onSelect={() => onOpenPeoplePanel("chat")}>
                <MessageSquareText className="size-4" />
                {tt("Chat", "Ujumbe")}
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <SmilePlus className="size-4" />
              {tt("Reactions", "Miitikio")}
            </DropdownMenuLabel>
            <div className="grid grid-cols-7 gap-1 p-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSendReaction(emoji)}
                  aria-label={`${tt("Send reaction", "Tuma mwitikio")} ${emoji}`}
                  className="flex size-10 items-center justify-center rounded-xl text-xl transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {mobileEndSessionAction}

        <ControlButton
          type="button"
          danger
          size="sm"
          onClick={onLeave}
          aria-label={tt("Leave meeting", "Ondoka kwenye kikao")}
          className="size-11 rounded-full px-0"
        >
          <PhoneOff className="size-5" />
        </ControlButton>
      </div>

      <div className="app-scrollbar hidden items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 sm:flex sm:justify-between sm:gap-3">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ControlButton
            type="button"
            active={isMicrophoneEnabled}
            onClick={toggleMicrophone}
            disabled={mediaActionPending !== null}
            aria-label={isMicrophoneEnabled ? tt("Turn microphone off", "Zima maikrofoni") : tt("Turn microphone on", "Washa maikrofoni")}
            className="size-11 rounded-xl px-0 text-xs sm:w-auto sm:px-4 sm:text-sm"
          >
            {isMicrophoneEnabled ? <Mic className="size-3.5 sm:size-4" /> : <MicOff className="size-3.5 sm:size-4" />}
            <span className="hidden sm:inline">{isMicrophoneEnabled ? tt("Mic on", "Maikrofoni imewashwa") : tt("Mic off", "Maikrofoni imezimwa")}</span>
          </ControlButton>

          <ControlButton
            type="button"
            active={isCameraEnabled}
            onClick={toggleCamera}
            disabled={mediaActionPending !== null}
            aria-label={isCameraEnabled ? tt("Turn camera off", "Zima kamera") : tt("Turn camera on", "Washa kamera")}
            className="size-11 rounded-xl px-0 text-xs sm:w-auto sm:px-4 sm:text-sm"
          >
            {isCameraEnabled ? <Video className="size-3.5 sm:size-4" /> : <VideoOff className="size-3.5 sm:size-4" />}
            <span className="hidden sm:inline">{isCameraEnabled ? tt("Camera on", "Kamera imewashwa") : tt("Camera off", "Kamera imezimwa")}</span>
          </ControlButton>

          <ControlButton
            type="button"
            active={isScreenShareEnabled}
            onClick={toggleScreenShare}
            disabled={mediaActionPending !== null}
            aria-label={isScreenShareEnabled ? tt("Stop screen sharing", "Acha kushiriki skrini") : tt("Share screen", "Shiriki skrini")}
            className="size-11 rounded-xl px-0 text-xs sm:w-auto sm:px-4 sm:text-sm"
          >
            <MonitorUp className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">{isScreenShareEnabled ? tt("Stop share", "Acha kushiriki") : tt("Share screen", "Shiriki skrini")}</span>
          </ControlButton>

          <ControlButton type="button" active={raisedHand} onClick={onToggleRaisedHand} aria-label={raisedHand ? tt("Lower hand", "Shusha mkono") : tt("Raise hand", "Inua mkono")} className="size-11 rounded-xl px-0 text-xs sm:w-auto sm:px-4 sm:text-sm">
            <Hand className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">{raisedHand ? tt("Hand raised", "Mkono umeinuliwa") : tt("Raise hand", "Inua mkono")}</span>
          </ControlButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ControlButton type="button" aria-label={tt("Open reactions", "Fungua miitikio")} className="size-11 rounded-xl px-0 text-xs sm:w-auto sm:px-4 sm:text-sm">
                <SmilePlus className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">{tt("Reactions", "Mwitikio")}</span>
              </ControlButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={10} className="z-[100] max-w-[calc(100vw-1rem)] w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-md">
              <DropdownMenuLabel>{tt("Quick reactions", "Mwitikio wa haraka")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-row flex-wrap gap-2 p-2">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onSendReaction(emoji)}
                    aria-label={`${tt("Send reaction", "Tuma mwitikio")} ${emoji}`}
                    className="flex size-11 items-center justify-center rounded-lg bg-muted/50 text-xl transition-all hover:bg-chart-3 hover:text-white focus:outline-none focus:ring-2 focus:ring-chart-3 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

          <div className="flex items-center gap-2 sm:gap-3 xl:hidden">
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

          <ControlButton type="button" danger size="sm" onClick={onLeave} aria-label={tt("Leave meeting", "Ondoka kwenye kikao")} className="size-11 rounded-xl px-0 sm:w-auto sm:px-3">
            <PhoneOff className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">{tt("Leave", "Ondoka")}</span>
          </ControlButton>
        </div>
      </div>
    </footer>
  )
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  CheckCircle,
  Circle,
  Play,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { meetingServices } from "@/api/services/meeting.service";
import type {
  AgendaItem,
  AdditionalNote as HistoryAdditionalNote,
  AgendaMinuteNote as HistoryAgendaMinuteNote,
} from "@/store/meeting/meeting.types";
import { useLanguage } from "@/components/language/language-provider";
import { exportRowsAsDocx } from "@/lib/report-export";
import { useGroupStore } from "@/store/group/groupUser.store";

export interface AgendaMinuteNote {
  id: string;
  agendaItemId: string;
  agendaItemTitle: string;
  agendaItemDescription?: string;
  allocatedMinutes: number;
  notes: string;
  hostNotes: string;
  status: "pending" | "ongoing" | "completed";
  startTime?: string;
  endTime?: string;
}

interface AgendaMinutesHistoryProps {
  meetingId?: string;
  meetingTitle?: string;
  agendaItems: AgendaItem[];
  isHost?: boolean;
  minuteNotes?: HistoryAgendaMinuteNote[];
  additionalNotes?: HistoryAdditionalNote[];
}

type AgendaMinuteNoteApi = {
  id: string;
  agenda_item_id?: string | null;
  notes?: string | null;
  host_notes?: string | null;
  status?: "pending" | "ongoing" | "completed";
  start_time?: string | null;
  end_time?: string | null;
};

export function AgendaMinutesHistory({
  meetingId,
  meetingTitle,
  agendaItems,
  isHost = false,
  minuteNotes: initialMinuteNotes,
  additionalNotes = [],
}: AgendaMinutesHistoryProps) {
  const { language } = useLanguage();
  const { selectedGroup } = useGroupStore();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;
  const resolvedMeetingTitle = meetingTitle || tt("Meeting", "Kikao");
  const [fetchedMinuteNotes, setFetchedMinuteNotes] = useState<
    AgendaMinuteNote[]
  >([]);
  const [loading, setLoading] = useState(
    Boolean(meetingId && !initialMinuteNotes),
  );

  const mappedInitialMinuteNotes = useMemo<AgendaMinuteNote[]>(
    () =>
      (initialMinuteNotes || []).map((note) => ({
        id: note.id,
        agendaItemId: note.agenda_item_id,
        agendaItemTitle: note.agenda_item_title,
        agendaItemDescription: note.agenda_item_description || undefined,
        allocatedMinutes: note.allocated_minutes || 0,
        notes: note.notes || "",
        hostNotes: note.host_notes || "",
        status: note.status || "pending",
        startTime: note.start_time || undefined,
        endTime: note.end_time || undefined,
      })),
    [initialMinuteNotes],
  );

  useEffect(() => {
    if (mappedInitialMinuteNotes.length > 0 || !meetingId) return;

    const loadMinuteNotes = async () => {
      if (!meetingId) return;

      try {
        setLoading(true);
        const response = await meetingServices.getAgendaMinuteNotes(meetingId);
        if (response.status >= 200 && response.status < 300 && response.data) {
          const notesWithDetails: AgendaMinuteNote[] = response.data.map(
            (note: AgendaMinuteNoteApi) => {
              const agendaItem = agendaItems.find(
                (item) => item.id === note.agenda_item_id,
              );
              return {
                id: note.id,
                agendaItemId: note.agenda_item_id ?? "",
                agendaItemTitle: agendaItem?.title || (language === "sw" ? "Hoja Isiyojulikana" : "Unknown Agenda Item"),
                agendaItemDescription: agendaItem?.description,
                allocatedMinutes: agendaItem?.allocated_minutes || 0,
                notes: note.notes || "",
                hostNotes: note.host_notes || "",
                status: note.status || "pending",
                startTime: note.start_time || undefined,
                endTime: note.end_time || undefined,
              };
            },
          );
          setFetchedMinuteNotes(notesWithDetails);
        }
      } catch (error) {
        console.error("Failed to load minute notes:", error);
        toast.error(language === "sw" ? "Imeshindikana kupakia kumbukumbu za kikao" : "Failed to load meeting minutes");
      } finally {
        setLoading(false);
      }
    };

    loadMinuteNotes();
  }, [agendaItems, language, mappedInitialMinuteNotes, meetingId]);

  const minuteNotes =
    mappedInitialMinuteNotes.length > 0
      ? mappedInitialMinuteNotes
      : fetchedMinuteNotes;

  const getAgendaStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "ongoing":
        return <Play className="w-4 h-4 text-blue-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgendaStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:bg-green-950/30";
      case "ongoing":
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/30";
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-900/50";
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return tt("Not started", "Haijaanza");
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration} min`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return tt("Not recorded", "Haijarekodiwa");
    return new Date(dateString).toLocaleString();
  };

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================
  const exportMinutesPdf = () => {
    try {
      if (minuteNotes.length === 0 && additionalNotes.length === 0) {
        toast.error(tt("No minutes to export.", "Hakuna kumbukumbu za kuhamisha."));
        return;
      }

      const htmlContent = `
        <html>
        <head>
          <title>Minutes_${resolvedMeetingTitle}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { color: #111; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 5px; }
            h3 { color: #555; text-align: center; margin-top: 0; }
            .meta-header { text-align: center; color: #777; font-size: 14px; margin-bottom: 30px; }
            
            .agenda-section { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
            .agenda-title { color: #2c3e50; font-size: 20px; margin-bottom: 5px; }
            .agenda-meta { color: #7f8c8d; font-size: 13px; margin-top: 0; margin-bottom: 15px; }
            .agenda-meta strong { color: #555; }
            
            .minutes-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; white-space: pre-wrap; font-size: 15px; margin-top: 10px; }
            .host-notes-box { background-color: #fdf2e9; padding: 15px; border-left: 4px solid #e67e22; white-space: pre-wrap; font-size: 14px; color: #d35400; margin-top: 10px; }
            
            .additional-title { color: #2c3e50; font-size: 22px; margin-top: 40px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
            .desc { font-style: italic; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
            <h1>${tt("Official Meeting Minutes", "Kumbukumbu Rasmi za Kikao")}</h1>
            <h3>${tt("Group", "Kikundi")}: ${selectedGroup?.name || tt("Not recorded", "Hakijarekodiwa")}</h3>
            <h3>${tt("Session", "Kikao")}: ${resolvedMeetingTitle}</h3>
            <div class="meta-header">${tt("Date Exported", "Tarehe ya Kuhamisha")}: ${new Date().toLocaleDateString()}</div>
            
            ${minuteNotes.map(note => `
                <div class="agenda-section">
                    <h2 class="agenda-title">${note.agendaItemTitle}</h2>
                    <p class="agenda-meta">
                        <strong>${tt("Status", "Hali")}:</strong> <span style="text-transform: uppercase;">${note.status}</span> &nbsp;|&nbsp; 
                        <strong>${tt("Allocated", "Zimetengwa")}:</strong> ${note.allocatedMinutes} ${tt("min", "dak")} &nbsp;|&nbsp; 
                        <strong>${tt("Actual Time", "Muda Halisi")}:</strong> ${formatDuration(note.startTime, note.endTime)}
                    </p>
                    ${note.agendaItemDescription ? `<p class="desc">${note.agendaItemDescription}</p>` : ''}
                    
                    <h4 style="margin-bottom: 5px; color: #34495e;">${tt("Minutes", "Kumbukumbu")}:</h4>
                    <div class="minutes-box">
                        ${note.notes || `<em>${tt("No official minutes recorded for this point.", "Hakuna kumbukumbu rasmi kwa hoja hii.")}</em>`}
                    </div>

                    ${isHost && note.hostNotes ? `
                        <h4 style="margin-bottom: 5px; color: #c0392b;">${tt("Host Notes (Private)", "Maelezo ya Mwenyeji (Faragha)")}:</h4>
                        <div class="host-notes-box">
                            ${note.hostNotes}
                        </div>
                    ` : ''}
                </div>
            `).join('')}

            ${additionalNotes.length > 0 ? `
                <h2 class="additional-title">${tt("Additional Notes & Action Items", "Maelezo ya Ziada na Hatua za Utekelezaji")}</h2>
                ${additionalNotes.map(note => `
                    <div class="agenda-section" style="border: none;">
                        <h3 style="color: #34495e; font-size: 18px; margin-bottom: 5px;">${note.title}</h3>
                        <p class="agenda-meta" style="margin-bottom: 10px;">
                            <strong>${tt("Created", "Imeundwa")}:</strong> ${formatDateTime(note.created_at)}
                            ${note.created_by_name || note.created_by_email ? `${tt("by", "na")} ${note.created_by_name || note.created_by_email}` : ''}
                        </p>
                        <div class="minutes-box" style="border-left-color: #9b59b6;">
                            ${note.notes}
                        </div>
                        ${isHost && note.host_notes ? `
                            <h4 style="margin-bottom: 5px; color: #c0392b; margin-top: 15px;">${tt("Host Notes (Private)", "Maelezo ya Mwenyeji (Faragha)")}:</h4>
                            <div class="host-notes-box">
                                ${note.host_notes}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            ` : ''}

            <script>
                window.onload = () => { window.print(); }
            </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        toast.error(tt("Please allow popups to export as PDF.", "Tafadhali ruhusu madirisha ibukizi ili kuhamisha PDF."));
      }
    } catch (error) {
      console.error("Export PDF failed:", error);
      toast.error(tt("Failed to export to PDF", "Imeshindikana kuhamisha PDF"));
    }
  };

  const exportMinutesWord = () => {
    try {
      if (minuteNotes.length === 0 && additionalNotes.length === 0) {
        toast.error(tt("No minutes to export.", "Hakuna kumbukumbu za kuhamisha."));
        return;
      }

      const rows = [
        [tt("Official Meeting Minutes", "Kumbukumbu Rasmi za Kikao"), resolvedMeetingTitle],
        [tt("Group", "Kikundi"), selectedGroup?.name || tt("Not recorded", "Hakijarekodiwa")],
        [tt("Date Exported", "Tarehe ya Kuhamisha"), new Date().toLocaleDateString()],
        [],
        [tt("Agenda Item", "Hoja ya Ajenda"), tt("Status", "Hali"), tt("Allocated Minutes", "Dakika Zilizotengwa"), tt("Actual Time", "Muda Halisi"), tt("Minutes", "Kumbukumbu"), tt("Host Notes", "Maelezo ya Mwenyeji")],
        ...minuteNotes.map((note) => [
          note.agendaItemTitle,
          note.status,
          note.allocatedMinutes,
          formatDuration(note.startTime, note.endTime),
          note.notes || tt("No official minutes recorded for this point.", "Hakuna kumbukumbu rasmi kwa hoja hii."),
          isHost ? note.hostNotes : "",
        ]),
        [],
        [tt("Additional Notes & Action Items", "Maelezo ya Ziada na Hatua za Utekelezaji")],
        ...additionalNotes.map((note) => [
          note.title,
          note.notes,
          isHost ? note.host_notes : "",
          note.created_by_name || note.created_by_email || "",
          formatDateTime(note.created_at),
        ]),
      ];
      exportRowsAsDocx(rows, `Minutes ${resolvedMeetingTitle}`, tt("Official Meeting Minutes", "Kumbukumbu Rasmi za Kikao"));

      toast.success(tt("Meeting minutes exported to Word", "Kumbukumbu zimehamishwa kwenda Word"));
    } catch (error) {
      console.error("Export Word failed:", error);
      toast.error(tt("Failed to export to Word", "Imeshindikana kuhamisha Word"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">{tt("Loading meeting minutes...", "Inapakia kumbukumbu za kikao...")}</div>
      </div>
    );
  }

  if (minuteNotes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{tt("No meeting minutes recorded", "Hakuna kumbukumbu za kikao zilizorekodiwa")}</p>
          {isHost && (
            <p className="text-sm mt-2">
              {tt("Minutes will appear here once the meeting is conducted and notes are saved.", "Kumbukumbu zitaonekana hapa baada ya kikao kufanyika na maelezo kuhifadhiwa.")}
            </p>
          )}
        </div>

        {additionalNotes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{tt("Additional Notes", "Maelezo ya Ziada")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {additionalNotes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{note.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(note.created_at)}
                        {note.created_by_name || note.created_by_email
                          ? ` by ${note.created_by_name || note.created_by_email}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm">
                    {note.notes}
                  </div>
                  {isHost && note.host_notes ? (
                    <div className="mt-3 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-3 text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                      {note.host_notes}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{tt("Meeting Minutes", "Kumbukumbu za Kikao")}</h3>
          <p className="text-sm text-muted-foreground">
            {minuteNotes.length} {tt("agenda item(s) documented", "hoja za ajenda zimerekodiwa")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full shadow-sm font-bold border-border/80 hover:bg-chart-3/10 hover:text-chart-3 transition-colors">
              <Download className="w-4 h-4 mr-1.5" />
              {tt("Export", "Hamisha")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={exportMinutesWord} className="font-medium cursor-pointer">
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              {tt("Export for Word (.docx)", "Hamisha kwa Word (.docx)")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportMinutesPdf} className="font-medium cursor-pointer">
              <FileText className="w-4 h-4 mr-2 text-red-500" />
              {tt("Export as PDF (.pdf)", "Hamisha kama PDF (.pdf)")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {minuteNotes
          .sort((a, b) => {
            // Sort by agenda item order (assuming agenda items are ordered)
            const aOrder = agendaItems.findIndex(
              (item) => item.id === a.agendaItemId,
            );
            const bOrder = agendaItems.findIndex(
              (item) => item.id === b.agendaItemId,
            );
            return aOrder - bOrder;
          })
          .map((note) => (
            <Card
              key={note.id}
              className={`${getAgendaStatusColor(note.status)} shadow-sm border-border/60`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getAgendaStatusIcon(note.status)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium">
                        {note.agendaItemTitle}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formatDuration(note.startTime, note.endTime)}
                          </span>
                        </div>
                        <span>{tt("Allocated:", "Zimetengwa:")} {note.allocatedMinutes} {tt("min", "dak")}</span>
                        {note.startTime && (
                          <span>{tt("Started:", "Ilianza:")} {new Date(note.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {note.agendaItemDescription && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                      {tt("Description", "Maelezo")}
                    </p>
                    <p className="text-sm bg-background/50 p-3 rounded-xl border border-border/40">{note.agendaItemDescription}</p>
                  </div>
                )}

                {note.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                      {tt("Meeting Minutes", "Kumbukumbu za Kikao")}
                    </p>
                    <div className="bg-background border border-border/60 p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                      {note.notes}
                    </div>
                  </div>
                )}

                {isHost && note.hostNotes && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-orange-500 mb-1">
                      {tt("Host Notes (Private)", "Maelezo ya Mwenyeji (Faragha)")}
                    </p>
                    <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30 text-sm whitespace-pre-wrap text-orange-700 dark:text-orange-300">
                      {note.hostNotes}
                    </div>
                  </div>
                )}

                {!note.notes && !note.hostNotes && (
                  <div className="text-center py-4 bg-background/50 rounded-xl border border-dashed border-border/60 text-muted-foreground text-sm">
                    {tt("No notes recorded for this agenda item.", "Hakuna maelezo yaliyorekodiwa kwa hoja hii.")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {additionalNotes.length > 0 ? (
        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>{tt("Additional Notes", "Maelezo ya Ziada")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {additionalNotes.map((note) => (
              <div key={note.id} className="rounded-xl border bg-card/60 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base">{note.title}</h4>
                    <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      {formatDateTime(note.created_at)}
                      {note.created_by_name || note.created_by_email
                        ? ` • By ${note.created_by_name || note.created_by_email}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-background border border-border/60 p-4 rounded-xl whitespace-pre-wrap text-sm leading-relaxed">
                  {note.notes}
                </div>
                {isHost && note.host_notes ? (
                  <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-700 dark:text-orange-300 whitespace-pre-wrap">
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">{tt("Private Host Note", "Maelezo Binafsi ya Mwenyeji")}</p>
                    {note.host_notes}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

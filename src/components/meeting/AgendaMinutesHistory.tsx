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
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { meetingServices } from "@/api/services/meeting.service";
import type {
  AgendaItem,
  AdditionalNote as HistoryAdditionalNote,
  AgendaMinuteNote as HistoryAgendaMinuteNote,
} from "@/store/meeting/meeting.types";

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
  meetingTitle = "Meeting",
  agendaItems,
  isHost = false,
  minuteNotes: initialMinuteNotes,
  additionalNotes = [],
}: AgendaMinutesHistoryProps) {
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
                agendaItemTitle: agendaItem?.title || "Unknown Agenda Item",
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
        toast.error("Failed to load meeting minutes");
      } finally {
        setLoading(false);
      }
    };

    loadMinuteNotes();
  }, [agendaItems, mappedInitialMinuteNotes, meetingId]);

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
    if (!startTime) return "Not started";
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration} min`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not recorded";
    return new Date(dateString).toLocaleString();
  };

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================
  const exportMinutesPdf = () => {
    try {
      if (minuteNotes.length === 0 && additionalNotes.length === 0) {
        toast.error("No minutes to export.");
        return;
      }

      const htmlContent = `
        <html>
        <head>
          <title>Minutes_${meetingTitle}</title>
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
            <h1>Official Meeting Minutes</h1>
            <h3>Session: ${meetingTitle}</h3>
            <div class="meta-header">Date Exported: ${new Date().toLocaleDateString()}</div>
            
            ${minuteNotes.map(note => `
                <div class="agenda-section">
                    <h2 class="agenda-title">${note.agendaItemTitle}</h2>
                    <p class="agenda-meta">
                        <strong>Status:</strong> <span style="text-transform: uppercase;">${note.status}</span> &nbsp;|&nbsp; 
                        <strong>Allocated:</strong> ${note.allocatedMinutes} min &nbsp;|&nbsp; 
                        <strong>Actual Time:</strong> ${formatDuration(note.startTime, note.endTime)}
                    </p>
                    ${note.agendaItemDescription ? `<p class="desc">${note.agendaItemDescription}</p>` : ''}
                    
                    <h4 style="margin-bottom: 5px; color: #34495e;">Minutes:</h4>
                    <div class="minutes-box">
                        ${note.notes || "<em>No official minutes recorded for this point.</em>"}
                    </div>

                    ${isHost && note.hostNotes ? `
                        <h4 style="margin-bottom: 5px; color: #c0392b;">Host Notes (Private):</h4>
                        <div class="host-notes-box">
                            ${note.hostNotes}
                        </div>
                    ` : ''}
                </div>
            `).join('')}

            ${additionalNotes.length > 0 ? `
                <h2 class="additional-title">Additional Notes & Action Items</h2>
                ${additionalNotes.map(note => `
                    <div class="agenda-section" style="border: none;">
                        <h3 style="color: #34495e; font-size: 18px; margin-bottom: 5px;">${note.title}</h3>
                        <p class="agenda-meta" style="margin-bottom: 10px;">
                            <strong>Created:</strong> ${formatDateTime(note.created_at)}
                            ${note.created_by_name || note.created_by_email ? `by ${note.created_by_name || note.created_by_email}` : ''}
                        </p>
                        <div class="minutes-box" style="border-left-color: #9b59b6;">
                            ${note.notes}
                        </div>
                        ${isHost && note.host_notes ? `
                            <h4 style="margin-bottom: 5px; color: #c0392b; margin-top: 15px;">Host Notes (Private):</h4>
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
        toast.error("Please allow popups to export as PDF.");
      }
    } catch (error) {
      console.error("Export PDF failed:", error);
      toast.error("Failed to export to PDF");
    }
  };

  const exportMinutesWord = () => {
    try {
      if (minuteNotes.length === 0 && additionalNotes.length === 0) {
        toast.error("No minutes to export.");
        return;
      }

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Meeting Minutes</title></head>
        <body style="font-family: Arial, sans-serif;">
            <h1 style="color: #333; text-align: center;">Official Meeting Minutes</h1>
            <h3 style="color: #555; text-align: center;">Session: ${meetingTitle}</h3>
            <p style="text-align: center;"><strong>Date Exported:</strong> ${new Date().toLocaleDateString()}</p>
            <hr style="margin: 20px 0; border: 1px solid #ddd;"/>
            
            ${minuteNotes.map(note => `
                <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 5px;">${note.agendaItemTitle}</h2>
                    <p style="color: #7f8c8d; font-size: 12px; margin-top: 0;">
                        <strong>Status:</strong> <span style="text-transform: uppercase;">${note.status}</span> &nbsp;|&nbsp; 
                        <strong>Allocated:</strong> ${note.allocatedMinutes} min &nbsp;|&nbsp; 
                        <strong>Actual Time:</strong> ${formatDuration(note.startTime, note.endTime)}
                    </p>
                    ${note.agendaItemDescription ? `<p style="font-style: italic; color: #555; font-size: 13px;">${note.agendaItemDescription}</p>` : ''}
                    
                    <h4 style="margin-bottom: 5px; color: #34495e;">Minutes:</h4>
                    <div style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #3498db; white-space: pre-wrap; font-size: 14px;">
                        ${note.notes || "<em>No official minutes recorded for this point.</em>"}
                    </div>

                    ${isHost && note.hostNotes ? `
                        <h4 style="margin-bottom: 5px; color: #c0392b;">Host Notes (Private):</h4>
                        <div style="background-color: #fdf2e9; padding: 10px; border-left: 4px solid #e67e22; white-space: pre-wrap; font-size: 14px; color: #d35400;">
                            ${note.hostNotes}
                        </div>
                    ` : ''}
                </div>
            `).join('')}

            ${additionalNotes.length > 0 ? `
                <h2 style="color: #2c3e50; font-size: 20px; margin-top: 30px; border-bottom: 2px solid #ccc; padding-bottom: 5px;">Additional Notes & Action Items</h2>
                ${additionalNotes.map(note => `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #34495e; font-size: 16px;">${note.title}</h3>
                        <p style="color: #7f8c8d; font-size: 12px; margin-top: 0;">
                            <strong>Created:</strong> ${formatDateTime(note.created_at)}
                            ${note.created_by_name || note.created_by_email ? `by ${note.created_by_name || note.created_by_email}` : ''}
                        </p>
                        <div style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #9b59b6; white-space: pre-wrap; font-size: 14px;">
                            ${note.notes}
                        </div>
                        ${isHost && note.host_notes ? `
                            <h4 style="margin-bottom: 5px; color: #c0392b;">Host Notes (Private):</h4>
                            <div style="background-color: #fdf2e9; padding: 10px; border-left: 4px solid #e67e22; white-space: pre-wrap; font-size: 14px; color: #d35400;">
                                ${note.host_notes}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            ` : ''}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Minutes_${meetingTitle}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Meeting minutes exported to Word");
    } catch (error) {
      console.error("Export Word failed:", error);
      toast.error("Failed to export to Word");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading meeting minutes...</div>
      </div>
    );
  }

  if (minuteNotes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No meeting minutes recorded</p>
          {isHost && (
            <p className="text-sm mt-2">
              Minutes will appear here once the meeting is conducted and notes
              are saved.
            </p>
          )}
        </div>

        {additionalNotes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
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
          <h3 className="text-lg font-semibold">Meeting Minutes</h3>
          <p className="text-sm text-muted-foreground">
            {minuteNotes.length} agenda item
            {minuteNotes.length !== 1 ? "s" : ""} documented
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full shadow-sm font-bold border-border/80 hover:bg-chart-3/10 hover:text-chart-3 transition-colors">
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={exportMinutesWord} className="font-medium cursor-pointer">
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Export as Word (.doc)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportMinutesPdf} className="font-medium cursor-pointer">
              <FileText className="w-4 h-4 mr-2 text-red-500" />
              Export as PDF (.pdf)
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
                        <span>Allocated: {note.allocatedMinutes} min</span>
                        {note.startTime && (
                          <span>Started: {new Date(note.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                      Description
                    </p>
                    <p className="text-sm bg-background/50 p-3 rounded-xl border border-border/40">{note.agendaItemDescription}</p>
                  </div>
                )}

                {note.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                      Meeting Minutes
                    </p>
                    <div className="bg-background border border-border/60 p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                      {note.notes}
                    </div>
                  </div>
                )}

                {isHost && note.hostNotes && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-orange-500 mb-1">
                      Host Notes (Private)
                    </p>
                    <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30 text-sm whitespace-pre-wrap text-orange-700 dark:text-orange-300">
                      {note.hostNotes}
                    </div>
                  </div>
                )}

                {!note.notes && !note.hostNotes && (
                  <div className="text-center py-4 bg-background/50 rounded-xl border border-dashed border-border/60 text-muted-foreground text-sm">
                    No notes recorded for this agenda item.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {additionalNotes.length > 0 ? (
        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
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
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">Private Host Note</p>
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

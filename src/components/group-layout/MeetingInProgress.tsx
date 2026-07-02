import Link from "next/link";
import { Play, Radio, UsersRound } from "lucide-react";
import { Button } from "../ui/button";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import { getMeetingSessionHref } from "@/lib/meeting-routes";
import { useLanguage } from "@/components/language/language-provider";

export default function MeetingInProgress() {
  const { meetings } = useMeetingStore();
  const { selectedGroup } = useGroupStore();
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;
  const activeMeeting = meetings.find(
    (meeting) =>
      meeting.group === selectedGroup?.id && meeting.status === "ongoing",
  );

  if (!activeMeeting) {
    return (
      <div className="rounded-md border border-chart-4/20 bg-chart-2 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              {tt("Live Session Status", "Hali ya Kikao cha Moja kwa Moja")}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {tt("No meeting is currently live", "Hakuna kikao kinachoendelea sasa")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              {tt("Start a meeting when the group is ready to review savings, decisions, fines, or loan matters together.", "Anzisha kikao kikundi kinapokuwa tayari kukagua akiba, maamuzi, faini, au masuala ya mikopo pamoja.")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85">
            {tt("The next live VICOBA session will appear here automatically.", "Kikao kijacho cha VICOBA kitaonekana hapa moja kwa moja.")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-chart-4/20 bg-chart-2 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
            <Radio className="size-3.5" />
            {tt("Live Session", "Kikao cha Moja kwa Moja")}
          </div>
          <h2 className="mt-3 text-2xl font-bold">{activeMeeting.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span>{tt("Host:", "Mwenyeji:")} {activeMeeting.host_email}</span>
            <span className="inline-flex items-center gap-1">
              <UsersRound className="size-4" />
              {tt("Group members can join now", "Wanachama wanaweza kujiunga sasa")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant={"outline"}
            className="border-white/20 bg-white text-black hover:bg-white/90"
          >
            <Link
              href={getMeetingSessionHref(
                activeMeeting.id,
                activeMeeting.group,
              )}
            >
              <Play /> {tt("Join Now", "Jiunge Sasa")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

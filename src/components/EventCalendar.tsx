import React, { useState } from "react";
import { ClubEvent } from "../types";
import { cn } from "../lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  User,
  DollarSign,
  Cpu,
  Target,
  ExternalLink,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  events: ClubEvent[];
  onFeedbackClick?: (event: ClubEvent) => void;
}

export default function EventCalendar({ events, onFeedbackClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Helper to extract or match YYYY-MM-DD from an event
  const getEventDateStr = (event: ClubEvent): string | null => {
    if (event.date) return event.date;
    if (event.dateTime) {
      const match = event.dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    return null;
  };

  // Get events for a specific day index in the current month
  const getEventsForDay = (day: number) => {
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month + 1).padStart(2, "0");
    const targetDateStr = `${year}-${monthStr}-${dayStr}`;

    return events.filter((e) => {
      const eventDate = getEventDateStr(e);
      return eventDate === targetDateStr;
    });
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Selected Day Events
  const selectedEvents = events.filter((e) => {
    if (!selectedDateStr) return false;
    const eventDate = getEventDateStr(e);
    return eventDate === selectedDateStr;
  });

  // Category Color Map
  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "Competition":
        return { bg: "bg-rose-500", text: "text-rose-500", bgLight: "bg-rose-50" };
      case "Seminar":
        return { bg: "bg-purple-500", text: "text-purple-500", bgLight: "bg-purple-50" };
      case "Festival":
        return { bg: "bg-amber-500", text: "text-amber-500", bgLight: "bg-amber-50" };
      case "Course":
        return { bg: "bg-blue-500", text: "text-blue-500", bgLight: "bg-blue-50" };
      default:
        return { bg: "bg-[#006a4e]", text: "text-[#006a4e]", bgLight: "bg-blue-50" };
    }
  };

  // Format date display for headers
  const formatSelectedDateDisplay = () => {
    if (!selectedDateStr) return "Select a date";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Generate calendar grid array
  const calendarCells: { day: number | null; hasEvents: boolean; events: ClubEvent[] }[] = [];
  
  // Fill starting blanks
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ day: null, hasEvents: false, events: [] });
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = getEventsForDay(d);
    calendarCells.push({
      day: d,
      hasEvents: dayEvents.length > 0,
      events: dayEvents,
    });
  }

  const todayStr = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper Banner Section */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#006a4e]/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-blue-50 text-[#006a4e] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
              📅 Chrono Node
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-black text-gray-900 tracking-tight mt-3">
              Rajshahi University Event Calendar
            </h3>
            <p className="text-gray-400 font-medium italic text-xs md:text-sm mt-1">
              Synchronize your academic schedule with university club contests, hacks, workshops, and fests.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Monthly Calendar Grid */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
            <h4 className="font-display font-black text-xl text-gray-800">
              {months[month]} {year}
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-800 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-wider text-[#006a4e] hover:bg-blue-50 active:scale-95 transition-all"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-800 active:scale-95 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekdays Labels */}
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <span
                key={dayName}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-1"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return (
                  <div
                    key={`blank-${idx}`}
                    className="aspect-square bg-gray-50/40 rounded-2xl border border-dashed border-gray-100/50"
                  />
                );
              }

              const dayStr = String(cell.day).padStart(2, "0");
              const monthStr = String(month + 1).padStart(2, "0");
              const currentCellDateStr = `${year}-${monthStr}-${dayStr}`;

              const isSelected = selectedDateStr === currentCellDateStr;
              const isToday = todayStr === currentCellDateStr;

              return (
                <button
                  key={`day-${cell.day}`}
                  onClick={() => setSelectedDateStr(currentCellDateStr)}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-between p-2 border relative transition-all active:scale-95 group cursor-pointer",
                    isSelected
                      ? "bg-[#006a4e] border-[#006a4e] text-white shadow-lg shadow-[#006a4e]/20"
                      : isToday
                      ? "bg-blue-50/50 border-[#ffd700] text-[#006a4e] font-black hover:bg-blue-50"
                      : "bg-white border-gray-100 text-gray-700 hover:border-[#006a4e]/20 hover:bg-gray-50"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-black w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      isSelected ? "bg-white/10" : ""
                    )}
                  >
                    {cell.day}
                  </span>

                  {/* Colored Dots for categories */}
                  {cell.hasEvents && (
                    <div className="flex gap-1 justify-center max-w-full overflow-hidden px-1">
                      {cell.events.slice(0, 3).map((ev, evIdx) => {
                        const style = getCategoryStyles(ev.category);
                        return (
                          <span
                            key={ev.id || evIdx}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              isSelected ? "bg-white" : style.bg
                            )}
                            title={`${ev.title} (${ev.category})`}
                          />
                        );
                      })}
                      {cell.events.length > 3 && (
                        <span
                          className={cn(
                            "text-[8px] font-black leading-none self-center shrink-0",
                            isSelected ? "text-white" : "text-[#006a4e]"
                          )}
                        >
                          +
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick legend */}
          <div className="mt-8 pt-6 border-t border-gray-50 flex flex-wrap gap-4 items-center justify-center text-xs text-gray-500">
            <span className="font-bold text-gray-400">Categories:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Contest / Hack
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Seminar / Workshop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Festival / Expo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Bootcamps / Courses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006a4e]" /> General Meetups
            </span>
          </div>
        </div>

        {/* Right Side: Event Details for Selected Day */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">
              Selected Schedule Frame
            </h4>
            <p className="font-display font-black text-lg text-[#006a4e] mt-2">
              {formatSelectedDateDisplay()}
            </p>

            <div className="mt-6 space-y-6">
              {selectedEvents.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                  <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-gray-400 font-bold text-xs">No events scheduled today.</p>
                  <p className="text-[10px] text-gray-300">
                    Select other days with dots to view their activities, or browse upcoming events below.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedEvents.map((event) => {
                    const styles = getCategoryStyles(event.category);
                    return (
                      <div
                        key={event.id}
                        className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-all shadow-sm space-y-4 hover:shadow-md relative group overflow-hidden"
                      >
                        {/* Left edge colored stripe */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", styles.bg)} />

                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                              styles.text,
                              styles.bgLight,
                              event.category === "Competition"
                                ? "border-rose-100"
                                : event.category === "Seminar"
                                ? "border-purple-100"
                                : event.category === "Festival"
                                ? "border-amber-100"
                                : event.category === "Course"
                                ? "border-blue-100"
                                : "border-blue-100"
                            )}
                          >
                            {event.category}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            🕒 {event.time || "TBD"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h5 className="font-display font-black text-gray-900 text-base leading-snug">
                            {event.title}
                          </h5>
                          <p className="text-xs font-bold text-gray-400">
                            By {event.adminName || "Club Authority"}
                          </p>
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">
                          {event.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-gray-600 border-t pt-3">
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {event.venue || "TBD"}
                          </span>
                          {event.mentors && (
                            <span className="flex items-center gap-1.5 truncate" title={event.mentors}>
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {event.mentors}
                            </span>
                          )}
                          {event.fee && (
                            <span className="flex items-center gap-1.5 truncate">
                              <DollarSign className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              {event.fee}
                            </span>
                          )}
                          {event.duration && (
                            <span className="flex items-center gap-1.5 truncate">
                              <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              {event.duration}
                            </span>
                          )}
                        </div>

                        {event.contact?.joinLink && (
                          <div className="pt-2">
                            <a
                              href={event.contact.joinLink}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#006a4e] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#004d39] transition-all"
                            >
                              Register Now
                              <ExternalLink className="w-3 h-3 text-[#ffd700]" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick list of other upcoming events in this month */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#ffd700]" /> Month Overview Node
            </h4>
            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
              {events.filter((e) => {
                const eventDate = getEventDateStr(e);
                if (!eventDate) return false;
                const [, m, ] = eventDate.split("-").map(Number);
                return m === month + 1;
              }).length === 0 ? (
                <p className="text-center text-xs text-gray-400 font-medium py-6">
                  No activities cataloged for this entire month.
                </p>
              ) : (
                events
                  .filter((e) => {
                    const eventDate = getEventDateStr(e);
                    if (!eventDate) return false;
                    const [, m, ] = eventDate.split("-").map(Number);
                    return m === month + 1;
                  })
                  .slice(0, 4)
                  .map((e) => (
                    <button
                      key={`month-ov-${e.id}`}
                      onClick={() => {
                        const eventDate = getEventDateStr(e);
                        if (eventDate) setSelectedDateStr(eventDate);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-50 hover:border-gray-100 transition-all text-left group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-800 truncate group-hover:text-[#006a4e] transition-colors">
                          {e.title}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {e.date || e.dateTime}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#006a4e] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

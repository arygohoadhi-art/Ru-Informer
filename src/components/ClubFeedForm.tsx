import { Sparkles, Loader2, Send } from "lucide-react";
import { cn } from "../lib/utils";

export function ClubFeedForm({ 
  club, 
  clubFeedData, 
  setClubFeedData, 
  handlePublishClubFeed, 
  publishingClubFeed 
}: any) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await handlePublishClubFeed(club.id);
      }}
      className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4 shadow-inner"
    >
      <div className="flex items-center gap-2 text-[#004d39]">
        <Sparkles className="w-4 h-4 text-[#ffd700] fill-[#ffd700]" />
        <span className="font-display font-black text-xs uppercase tracking-widest">
          Feed Broadcast to {club.id} Node (Type: {clubFeedData.type})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Title
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Weekly Workshop, Recruitment Notice 2026"
            value={clubFeedData.title}
            onChange={(e) =>
              setClubFeedData({
                ...clubFeedData,
                title: e.target.value,
              })
            }
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Classification
          </label>
          <select
            value={clubFeedData.type}
            onChange={(e) =>
              setClubFeedData({
                ...clubFeedData,
                type: e.target.value as any,
              })
            }
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="News">News Update</option>
            <option value="Event">Upcoming Event</option>
            <option value="History">Club History</option>
            <option value="Achievement">Club Achievement</option>
            <option value="Ceremony">Ceremony / Gala</option>
            <option value="Update">Club Updates</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
          Content Description
        </label>
        <textarea
          required
          placeholder="Write news highlights, agenda points, or guidelines..."
          value={clubFeedData.description}
          onChange={(e) =>
            setClubFeedData({
              ...clubFeedData,
              description: e.target.value,
            })
          }
          className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-medium h-24"
        />
      </div>

      {clubFeedData.type === "Event" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Venue
            </label>
            <input
              type="text"
              placeholder="e.g. TSC Auditoriums, Online Zoom"
              value={clubFeedData.venue}
              onChange={(e) =>
                setClubFeedData({
                  ...clubFeedData,
                  venue: e.target.value,
                })
              }
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#004d39]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Event Date
            </label>
            <input
              type="date"
              value={clubFeedData.date}
              onChange={(e) =>
                setClubFeedData({
                  ...clubFeedData,
                  date: e.target.value,
                })
              }
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#004d39]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Event Time
            </label>
            <input
              type="time"
              value={clubFeedData.time}
              onChange={(e) =>
                setClubFeedData({
                  ...clubFeedData,
                  time: e.target.value,
                })
              }
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#004d39]"
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Form URL / Join link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={clubFeedData.joinLink}
              onChange={(e) =>
                setClubFeedData({
                  ...clubFeedData,
                  joinLink: e.target.value,
                })
              }
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs"
            />
          </div>
        </div>
      )}

      <button
        disabled={publishingClubFeed === club.id}
        type="submit"
        className="w-full py-4 bg-[#004d39] hover:bg-[#003c2b] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
      >
        {publishingClubFeed === club.id ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4 text-[#ffd700]" />
            Publish to {club.id} Feed
          </>
        )}
      </button>
    </form>
  );
}

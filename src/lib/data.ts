/* Craig's Saloon — static demo data for the in-app WhatsApp booking preview
   (components/screens/WhatsAppFlow.tsx). The live bot lives in lib/whatsapp/bot.ts;
   this is just the scripted walkthrough shown on the /chat screen. */

export interface ChatStep {
  id: string;
  from: "client" | "bot";
  text?: string;
  replies?: { label: string; go: string; primary?: boolean }[];
  list?: { title: string; options: { label: string; meta?: string; go: string }[] };
  slots?: { day: string; time: string; go: string }[];
  card?: { title: string; lines: string[] };
  end?: boolean;
}

export const chat: { clientName: string; steps: ChatStep[] } = {
  clientName: "Tendai",
  steps: [
    { id: "start", from: "client", text: "Hi" },
    {
      id: "welcome",
      from: "bot",
      text: "Welcome to Craig's Saloon 💈\nHow can I help you today?",
      replies: [
        { label: "Book Appointment", go: "area" },
        { label: "My Bookings", go: "bookings" },
        { label: "Talk to Us", go: "bookings" },
      ],
    },
    {
      id: "area",
      from: "bot",
      text: "Great. Which saloon would you like?",
      list: {
        title: "Choose a location",
        options: [
          { label: "Avondale", meta: "Avondale Shops", go: "service" },
          { label: "Borrowdale", meta: "Sam Levy's Village", go: "service" },
          { label: "Highlands", meta: "Arundel Village", go: "service" },
          { label: "Mount Pleasant", meta: "Mt Pleasant Centre", go: "service" },
        ],
      },
    },
    {
      id: "service",
      from: "bot",
      text: "What would you like done?",
      list: {
        title: "Select a service",
        options: [
          { label: "Haircut & Beard Trim", meta: "$15 · 45 min", go: "slot" },
          { label: "Skin Fade", meta: "$12 · 40 min", go: "slot" },
          { label: "Gel Manicure", meta: "$20 · 50 min", go: "slot" },
          { label: "Facial", meta: "$30 · 60 min", go: "slot" },
        ],
      },
    },
    {
      id: "slot",
      from: "bot",
      text: "Nice pick, Tendai 💈 Here's what's open at Avondale — pick a time:",
      slots: [
        { day: "Wed 11 Jun", time: "10:00", go: "confirm" },
        { day: "Wed 11 Jun", time: "14:30", go: "confirm" },
        { day: "Fri 13 Jun", time: "10:00", go: "confirm" },
        { day: "Fri 13 Jun", time: "15:30", go: "confirm" },
      ],
    },
    {
      id: "confirm",
      from: "bot",
      card: {
        title: "Haircut & Beard Trim",
        lines: ["Craig's Saloon · Avondale", "Fri 13 Jun · 10:00 AM", "with Tafara · Barber Chair 1"],
      },
      replies: [
        { label: "Confirm booking", go: "done", primary: true },
        { label: "Change time", go: "slot" },
      ],
    },
    {
      id: "done",
      from: "bot",
      text: "You're booked! 🎉 You'll get a reminder 24 hours and 1 hour before.\n\nReply CHANGE to reschedule or CANCEL anytime.",
      end: true,
    },
  ],
};

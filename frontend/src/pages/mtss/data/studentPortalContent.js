import { BookOpenCheck, CalendarHeart, MessageCircleHeart } from "lucide-react";

const scheduleEntry = (day, title, room, note) => ({ day, title, room, note });
const chartPoint = (label, value) => ({ label, value });
const messageEntry = (from, date, text) => ({ from, date, text });

export const studentTabs = [
    { key: "progress", label: "My Progress", icon: BookOpenCheck },
    { key: "schedule", label: "Schedule", icon: CalendarHeart },
    { key: "messages", label: "Messages", icon: MessageCircleHeart },
];

export const playfulStudents = [
    {
        id: "marcus",
        name: "Student A",
        grade: "5th Grade • Tier 2",
        focus: "Reading Fluency",
        mentor: "Ms. Johnson",
        accent: "from-[#fda4af] via-[#f472b6] to-[#c084fc]",
        statAccent: "from-[#fcd34d] to-[#f97316]",
        data: {
            goal: "Improve reading fluency to 90 words per minute",
            progress: "79 wpm",
            status: "Reading speed (wpm)",
            nextSession: {
                label: "Tomorrow",
                detail: "Tuesday • Nov 5, 2025 • 2:00 PM - 3:00 PM",
                room: "Room 204 with Ms. Johnson",
            },
            chart: [chartPoint("Oct 15", 45), chartPoint("Oct 22", 60), chartPoint("Oct 29", 72), chartPoint("Nov 5", 79)],
            updates: [
                { date: "Nov 1, 2025", note: "Marcus is showing more confidence when reading aloud. Keep up the sparkle!" },
                { date: "Oct 25, 2025", note: "Steady gains from mini fluency games and weekend practice." },
            ],
            schedule: {
                thisWeek: [
                    scheduleEntry("Tuesday, Nov 5 • 2:00 PM", "Reading Fluency Practice", "Room 204", "Paired reading + word games"),
                    scheduleEntry("Thursday, Nov 7 • 2:00 PM", "Coach Check-in", "Room 204", "Celebrate wins & set micro-goals"),
                ],
                nextWeek: [
                    scheduleEntry("Tuesday, Nov 12 • 2:00 PM", "Fluency Lab", "Room 204", "Reader's theater + expression focus"),
                    scheduleEntry("Thursday, Nov 14 • 2:00 PM", "Family Bridge Call", "Room 204", "Share strategies with parents"),
                ],
            },
            messages: [
                messageEntry("Ms. Johnson", "Nov 3, 2025", "Hi Marcus! Remember to bring your comic book for tomorrow's reading celebration."),
                messageEntry("You", "Nov 3, 2025", "Got it, Ms. J! I can't wait to share the funny parts."),
                messageEntry("Ms. Johnson", "Nov 1, 2025", "Amazing progress this week. Your expression and pacing are awesome!"),
            ],
        },
    },
    {
        id: "emily",
        name: "Student B",
        grade: "6th Grade • Tier 3",
        focus: "Math Problem Solving",
        mentor: "Mr. Brown",
        accent: "from-[#fef3c7] via-[#fcd34d] to-[#fb923c]",
        statAccent: "from-[#c7d2fe] to-[#a5b4fc]",
        data: {
            goal: "Reach 80% accuracy on multi-step problems",
            progress: "62% accuracy",
            status: "Problem-solving accuracy",
            nextSession: {
                label: "Next Session",
                detail: "Wednesday • Nov 6, 2025 • 11:00 AM - 11:40 AM",
                room: "Math Lab with Mr. Brown",
            },
            chart: [chartPoint("Sep 30", 48), chartPoint("Oct 7", 55), chartPoint("Oct 23", 58), chartPoint("Nov 4", 62)],
            updates: [
                { date: "Nov 4, 2025", note: "Emily reasoned through every step. Verbalizing helped to keep track of each operation." },
                { date: "Oct 28, 2025", note: "Math lab manipulatives made fractions and ratios feel less scary—awesome teamwork!" },
            ],
            schedule: {
                thisWeek: [
                    scheduleEntry("Tuesday, Nov 5 • 10:30 AM", "Tier 3 Math Intervention", "Math Lab", "Multi-step word problems + math games"),
                    scheduleEntry("Friday, Nov 8 • 9:00 AM", "Mentor Reflection", "Math Lab", "Mini quiz + growth reflections"),
                ],
                nextWeek: [
                    scheduleEntry("Tuesday, Nov 12 • 10:30 AM", "Problem Solving Workshop", "Math Lab", "Strategy cards + math journaling"),
                    scheduleEntry("Friday, Nov 15 • 9:00 AM", "Peer Collaboration", "Math Lab", "Pair-share solutions + celebration"),
                ],
            },
            messages: [
                messageEntry("Mr. Brown", "Nov 4, 2025", "Way to go! You explained every step in your own words."),
                messageEntry("You", "Nov 3, 2025", "Thanks! The checklist helped me keep track."),
                messageEntry("Mr. Brown", "Oct 30, 2025", "Remember to bring your math journal for the next lab."),
            ],
        },
    },
];

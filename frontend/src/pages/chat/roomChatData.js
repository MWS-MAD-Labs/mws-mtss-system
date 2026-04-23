export const chatList = [
    { id: 1, name: "Budi Santoso", initials: "B", online: true },
    { id: 2, name: "Citra Dewi", initials: "C", online: false },
    { id: 3, name: "Andi W.", initials: "A", online: false },
];

export const initialMessages = [
    { id: 1, sender: "other", text: "Hello, I’m on my way to your location.", time: "10:30" },
    { id: 2, sender: "me", text: "Okay, I’ll wait. Let me know when you’re close.", time: "10:31" },
    { id: 3, sender: "other", text: "Got it!", time: "10:31" },
];

export const sanitizeMessage = (value = "", maxLen = 800) =>
    String(value || "")
        .replace(/<[^>]*>/g, "")
        .replace(/\b(?:https?:|mailto:|ftp:|javascript:)[^\s]*/gi, "")
        .replace(/https?:\/\/[^\s]+/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, maxLen);

export const currentTime = () => {
    const date = new Date();
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const HONORIFIC_REGEX = /^(mr|ms|mrs|miss|sir|ibu|bpk|bapak)\.?\s+/i;

const PLACEHOLDER_VALUES = new Set([
    "",
    "-",
    "tbd",
    "mtss mentor",
    "mentor",
    "n/a",
]);

const toReadableToken = (value = "") =>
    value
        .toString()
        .trim()
        .split(/[\s._-]+/)
        .filter(Boolean)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
        .join(" ");

const stripHonorific = (value = "") => value.toString().trim().replace(HONORIFIC_REGEX, "");

const hasExistingHonorific = (value = "") => /^(mr|ms|mrs|miss|sir|ibu|bpk|bapak)\.?(\s|$)/i.test(value.trim());

const resolveHonorific = (gender, rawName = "") => {
    if (/^mr\.?/i.test(rawName)) return "Mr.";
    if (/^ms\.?/i.test(rawName) || /^mrs\.?/i.test(rawName) || /^miss\.?/i.test(rawName)) return "Ms.";

    const normalizedGender = String(gender || "").toLowerCase();
    if (normalizedGender === "male") return "Mr.";
    if (normalizedGender === "female") return "Ms.";
    return "Ms.";
};

const pickNickname = ({ nickname, username, name }) => {
    if (nickname) {
        return toReadableToken(nickname);
    }

    if (username) {
        const usernameToken = username.toString().trim().split("@")[0];
        return toReadableToken(usernameToken);
    }

    const baseName = stripHonorific(name || "");
    const firstName = baseName.split(/\s+/).filter(Boolean)[0] || "";
    return toReadableToken(firstName);
};

const formatMentorDisplay = ({ name, nickname, username, gender } = {}) => {
    const rawName = String(name || "").trim();
    const rawNickname = String(nickname || "").trim();
    const rawUsername = String(username || "").trim();
    const normalized = rawName.toLowerCase();

    if (!rawName && !rawNickname && !rawUsername) return "MTSS Mentor";
    if (PLACEHOLDER_VALUES.has(normalized)) return "MTSS Mentor";

    if (hasExistingHonorific(rawName) && !rawNickname && !rawUsername) {
        return rawName;
    }

    const nicknameToken = pickNickname({
        nickname: rawNickname,
        username: rawUsername,
        name: rawName,
    });
    const honorific = resolveHonorific(gender, rawName);

    if (!nicknameToken) {
        return hasExistingHonorific(rawName) ? rawName : `${honorific} Mentor`;
    }

    return `${honorific} ${nicknameToken}`;
};

const formatMentorDisplayFromText = (name, gender) => formatMentorDisplay({ name, gender });

const formatMentorRoster = (mentors = []) => {
    if (!Array.isArray(mentors)) return [];
    return mentors
        .map((mentor) => {
            if (!mentor) return null;
            if (typeof mentor === "string") {
                return formatMentorDisplay({ name: mentor });
            }
            return formatMentorDisplay({
                name: mentor.name,
                nickname: mentor.nickname,
                username: mentor.username,
                gender: mentor.gender,
            });
        })
        .filter(Boolean);
};

export {
    formatMentorDisplay,
    formatMentorDisplayFromText,
    formatMentorRoster,
};

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import gsap from "gsap";
import { animate, stagger } from "animejs";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";
import {
    MWS_STUDENT_CARD_ASSET_IDS,
    MWS_STUDENT_CUTOUT_ASSET_IDS,
} from "@/data/mwsStudentsDesignAssets";
import "@/pages/styles/workforce-humanistic.css";

const CLD_BASE = "https://res.cloudinary.com/deldcwiji/image/upload";
const cardPhoto = (id, w = 252, h = 324) => `${CLD_BASE}/c_fill,w_${w},h_${h},g_auto,f_auto,q_auto/${id}`;
const cutoutPhoto = (id, w = 380) => `${CLD_BASE}/c_scale,w_${w},f_auto,q_auto/${id}`;

const WORKFORCE_ROLES = new Set([
    "teacher",
    "se_teacher",
    "staff",
    "support_staff",
    "nurse",
    "head_unit",
    "principal",
    "directorate",
    "admin",
    "superadmin",
]);

const routeMatches = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

const hashString = (value = "") => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash);
};

const positiveIndex = (value, length) => {
    if (!length) return 0;
    return ((value % length) + length) % length;
};

const seededShuffle = (items, seedBase = 0) => {
    const next = [...items];
    let seed = (seedBase % 2147483647) || 1;
    const random = () => {
        seed = (seed * 48271) % 2147483647;
        return seed / 2147483647;
    };

    for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }

    return next;
};

const CARD_FRAME_CLASSES = ["whl-card--soft", "whl-card--capsule", "whl-card--snap", "whl-card--story"];
const CUTOUT_STYLE_CLASSES = ["whl-cutout--soft", "whl-cutout--lift", "whl-cutout--clean"];

const COLLAGE_VARIANTS = {
    "atlas-ribbon": [
        { id: "ar-l-cutout", type: "cutout", density: "core", left: "-2.8%", top: "8%", width: "clamp(120px, 12vw, 202px)", height: "clamp(170px, 18.4vw, 296px)", rotate: "-5deg", opacity: 0.68, depth: 14, aos: "fade-right", delay: 70, hideMobile: true },
        { id: "ar-l-card-1", type: "card", density: "core", left: "1.2%", top: "22%", width: "clamp(80px, 6.2vw, 120px)", height: "clamp(104px, 8vw, 170px)", rotate: "-6deg", opacity: 0.62, depth: 10, aos: "fade-right", delay: 110 },
        { id: "ar-l-card-2", type: "card", density: "plus", left: "1.5%", top: "46%", width: "clamp(78px, 6vw, 116px)", height: "clamp(100px, 7.7vw, 164px)", rotate: "4deg", opacity: 0.58, depth: 9, aos: "fade-right", delay: 150 },
        { id: "ar-l-card-3", type: "card", density: "max", left: "2.2%", bottom: "8%", width: "clamp(76px, 5.8vw, 112px)", height: "clamp(96px, 7.2vw, 156px)", rotate: "-2deg", opacity: 0.54, depth: 8, aos: "fade-right", delay: 190, hideTablet: true },
        { id: "ar-r-cutout", type: "cutout", density: "core", right: "-2.9%", top: "9%", width: "clamp(120px, 12vw, 204px)", height: "clamp(172px, 18.4vw, 298px)", rotate: "5deg", opacity: 0.68, depth: 14, aos: "fade-left", delay: 90, hideMobile: true },
        { id: "ar-r-card-1", type: "card", density: "core", right: "1.2%", top: "22%", width: "clamp(80px, 6.2vw, 120px)", height: "clamp(104px, 8vw, 170px)", rotate: "6deg", opacity: 0.62, depth: 10, aos: "fade-left", delay: 120 },
        { id: "ar-r-card-2", type: "card", density: "plus", right: "1.6%", top: "46%", width: "clamp(78px, 6vw, 116px)", height: "clamp(100px, 7.7vw, 164px)", rotate: "-4deg", opacity: 0.58, depth: 9, aos: "fade-left", delay: 160 },
        { id: "ar-r-card-3", type: "card", density: "max", right: "2.3%", bottom: "8%", width: "clamp(76px, 5.8vw, 112px)", height: "clamp(96px, 7.2vw, 156px)", rotate: "2deg", opacity: 0.54, depth: 8, aos: "fade-left", delay: 200, hideTablet: true },
        { id: "ar-top-l", type: "card", density: "plus", left: "13.5%", top: "2.4%", width: "clamp(74px, 5.5vw, 106px)", height: "clamp(96px, 7.1vw, 150px)", rotate: "-3deg", opacity: 0.5, depth: 7, aos: "fade-down", delay: 210, hideMobile: true },
        { id: "ar-top-r", type: "card", density: "plus", right: "13.5%", top: "2.4%", width: "clamp(74px, 5.5vw, 106px)", height: "clamp(96px, 7.1vw, 150px)", rotate: "3deg", opacity: 0.5, depth: 7, aos: "fade-down", delay: 210, hideMobile: true },
        { id: "ar-bottom-l", type: "cutout", density: "max", left: "-1.7%", bottom: "2%", width: "clamp(98px, 9.8vw, 164px)", height: "clamp(130px, 13.2vw, 220px)", rotate: "-3deg", opacity: 0.58, depth: 11, aos: "fade-up", delay: 240, hideTablet: true },
        { id: "ar-bottom-r", type: "cutout", density: "max", right: "-1.6%", bottom: "2%", width: "clamp(98px, 9.8vw, 164px)", height: "clamp(130px, 13.2vw, 220px)", rotate: "3deg", opacity: 0.58, depth: 11, aos: "fade-up", delay: 240, hideTablet: true },
    ],
    "story-orbit": [
        { id: "so-l-cutout-top", type: "cutout", density: "core", left: "-3.2%", top: "12%", width: "clamp(120px, 12vw, 206px)", height: "clamp(162px, 17vw, 284px)", rotate: "-4deg", opacity: 0.66, depth: 14, aos: "fade-right", delay: 70, hideMobile: true },
        { id: "so-l-card-top", type: "card", density: "core", left: "1.4%", top: "16%", width: "clamp(82px, 6.2vw, 122px)", height: "clamp(108px, 8.2vw, 172px)", rotate: "-5deg", opacity: 0.62, depth: 10, aos: "fade-right", delay: 110 },
        { id: "so-l-card-mid", type: "card", density: "plus", left: "2.6%", top: "40%", width: "clamp(78px, 5.9vw, 116px)", height: "clamp(102px, 7.8vw, 166px)", rotate: "4deg", opacity: 0.58, depth: 9, aos: "fade-right", delay: 150 },
        { id: "so-l-cutout-low", type: "cutout", density: "max", left: "-2%", bottom: "6%", width: "clamp(104px, 10vw, 174px)", height: "clamp(140px, 14.4vw, 236px)", rotate: "-2deg", opacity: 0.6, depth: 12, aos: "fade-right", delay: 190, hideTablet: true },
        { id: "so-r-cutout-top", type: "cutout", density: "core", right: "-3.2%", top: "12%", width: "clamp(120px, 12vw, 206px)", height: "clamp(162px, 17vw, 284px)", rotate: "4deg", opacity: 0.66, depth: 14, aos: "fade-left", delay: 90, hideMobile: true },
        { id: "so-r-card-top", type: "card", density: "core", right: "1.4%", top: "16%", width: "clamp(82px, 6.2vw, 122px)", height: "clamp(108px, 8.2vw, 172px)", rotate: "5deg", opacity: 0.62, depth: 10, aos: "fade-left", delay: 120 },
        { id: "so-r-card-mid", type: "card", density: "plus", right: "2.6%", top: "40%", width: "clamp(78px, 5.9vw, 116px)", height: "clamp(102px, 7.8vw, 166px)", rotate: "-4deg", opacity: 0.58, depth: 9, aos: "fade-left", delay: 160 },
        { id: "so-r-cutout-low", type: "cutout", density: "max", right: "-2%", bottom: "6%", width: "clamp(104px, 10vw, 174px)", height: "clamp(140px, 14.4vw, 236px)", rotate: "2deg", opacity: 0.6, depth: 12, aos: "fade-left", delay: 200, hideTablet: true },
        { id: "so-top-center-l", type: "card", density: "plus", left: "23%", top: "1.7%", width: "clamp(72px, 5.3vw, 104px)", height: "clamp(94px, 6.9vw, 146px)", rotate: "-5deg", opacity: 0.48, depth: 7, aos: "fade-down", delay: 210, hideMobile: true },
        { id: "so-top-center-r", type: "card", density: "plus", right: "23%", top: "1.7%", width: "clamp(72px, 5.3vw, 104px)", height: "clamp(94px, 6.9vw, 146px)", rotate: "5deg", opacity: 0.48, depth: 7, aos: "fade-down", delay: 210, hideMobile: true },
        { id: "so-bottom-card-l", type: "card", density: "max", left: "8%", bottom: "1.8%", width: "clamp(70px, 5.1vw, 100px)", height: "clamp(92px, 6.6vw, 142px)", rotate: "3deg", opacity: 0.46, depth: 6, aos: "fade-up", delay: 250, hideTablet: true },
        { id: "so-bottom-card-r", type: "card", density: "max", right: "8%", bottom: "1.8%", width: "clamp(70px, 5.1vw, 100px)", height: "clamp(92px, 6.6vw, 142px)", rotate: "-3deg", opacity: 0.46, depth: 6, aos: "fade-up", delay: 250, hideTablet: true },
    ],
    "studio-zigzag": [
        { id: "sz-l1", type: "card", density: "core", left: "1%", top: "12%", width: "clamp(80px, 6vw, 118px)", height: "clamp(104px, 7.9vw, 168px)", rotate: "-7deg", opacity: 0.62, depth: 10, aos: "fade-right", delay: 90 },
        { id: "sz-l2", type: "cutout", density: "core", left: "-2.6%", top: "28%", width: "clamp(110px, 11.2vw, 186px)", height: "clamp(148px, 15.8vw, 252px)", rotate: "-3deg", opacity: 0.64, depth: 13, aos: "fade-right", delay: 130, hideMobile: true },
        { id: "sz-l3", type: "card", density: "plus", left: "2.4%", top: "52%", width: "clamp(76px, 5.8vw, 112px)", height: "clamp(98px, 7.3vw, 158px)", rotate: "5deg", opacity: 0.58, depth: 9, aos: "fade-right", delay: 170 },
        { id: "sz-l4", type: "card", density: "max", left: "1.6%", bottom: "8%", width: "clamp(74px, 5.6vw, 108px)", height: "clamp(96px, 7vw, 154px)", rotate: "-4deg", opacity: 0.54, depth: 8, aos: "fade-right", delay: 210, hideTablet: true },
        { id: "sz-r1", type: "card", density: "core", right: "1%", top: "16%", width: "clamp(80px, 6vw, 118px)", height: "clamp(104px, 7.9vw, 168px)", rotate: "7deg", opacity: 0.62, depth: 10, aos: "fade-left", delay: 90 },
        { id: "sz-r2", type: "cutout", density: "core", right: "-2.6%", top: "34%", width: "clamp(110px, 11.2vw, 186px)", height: "clamp(148px, 15.8vw, 252px)", rotate: "3deg", opacity: 0.64, depth: 13, aos: "fade-left", delay: 130, hideMobile: true },
        { id: "sz-r3", type: "card", density: "plus", right: "2.4%", top: "58%", width: "clamp(76px, 5.8vw, 112px)", height: "clamp(98px, 7.3vw, 158px)", rotate: "-5deg", opacity: 0.58, depth: 9, aos: "fade-left", delay: 170 },
        { id: "sz-r4", type: "card", density: "max", right: "1.6%", bottom: "6%", width: "clamp(74px, 5.6vw, 108px)", height: "clamp(96px, 7vw, 154px)", rotate: "4deg", opacity: 0.54, depth: 8, aos: "fade-left", delay: 210, hideTablet: true },
        { id: "sz-top-left", type: "cutout", density: "plus", left: "10.8%", top: "1.2%", width: "clamp(96px, 9.2vw, 158px)", height: "clamp(122px, 11.6vw, 198px)", rotate: "-6deg", opacity: 0.54, depth: 8, aos: "fade-down", delay: 230, hideMobile: true },
        { id: "sz-top-right", type: "cutout", density: "plus", right: "10.8%", top: "1.2%", width: "clamp(96px, 9.2vw, 158px)", height: "clamp(122px, 11.6vw, 198px)", rotate: "6deg", opacity: 0.54, depth: 8, aos: "fade-down", delay: 230, hideMobile: true },
        { id: "sz-bottom-left", type: "card", density: "max", left: "13%", bottom: "1.4%", width: "clamp(70px, 5.2vw, 102px)", height: "clamp(92px, 6.7vw, 144px)", rotate: "4deg", opacity: 0.46, depth: 6, aos: "fade-up", delay: 260, hideTablet: true },
        { id: "sz-bottom-right", type: "card", density: "max", right: "13%", bottom: "1.4%", width: "clamp(70px, 5.2vw, 102px)", height: "clamp(92px, 6.7vw, 144px)", rotate: "-4deg", opacity: 0.46, depth: 6, aos: "fade-up", delay: 260, hideTablet: true },
    ],
    "playful-cascade": [
        { id: "pc-l-cutout-main", type: "cutout", density: "core", left: "-3.6%", top: "10%", width: "clamp(126px, 12.8vw, 214px)", height: "clamp(170px, 18.6vw, 300px)", rotate: "-6deg", opacity: 0.68, depth: 15, aos: "fade-right", delay: 60, hideMobile: true },
        { id: "pc-l-card-1", type: "card", density: "core", left: "0.8%", top: "24%", width: "clamp(84px, 6.4vw, 126px)", height: "clamp(110px, 8.4vw, 176px)", rotate: "-5deg", opacity: 0.64, depth: 10, aos: "fade-right", delay: 110 },
        { id: "pc-l-card-2", type: "card", density: "plus", left: "2.2%", top: "48%", width: "clamp(78px, 5.9vw, 116px)", height: "clamp(100px, 7.6vw, 164px)", rotate: "6deg", opacity: 0.58, depth: 9, aos: "fade-right", delay: 160 },
        { id: "pc-l-cutout-low", type: "cutout", density: "max", left: "-2.4%", bottom: "3.4%", width: "clamp(104px, 10vw, 172px)", height: "clamp(136px, 13.6vw, 226px)", rotate: "-3deg", opacity: 0.6, depth: 12, aos: "fade-right", delay: 210, hideTablet: true },
        { id: "pc-r-cutout-main", type: "cutout", density: "core", right: "-3.6%", top: "11%", width: "clamp(126px, 12.8vw, 214px)", height: "clamp(170px, 18.6vw, 300px)", rotate: "6deg", opacity: 0.68, depth: 15, aos: "fade-left", delay: 80, hideMobile: true },
        { id: "pc-r-card-1", type: "card", density: "core", right: "0.8%", top: "26%", width: "clamp(84px, 6.4vw, 126px)", height: "clamp(110px, 8.4vw, 176px)", rotate: "5deg", opacity: 0.64, depth: 10, aos: "fade-left", delay: 120 },
        { id: "pc-r-card-2", type: "card", density: "plus", right: "2.2%", top: "51%", width: "clamp(78px, 5.9vw, 116px)", height: "clamp(100px, 7.6vw, 164px)", rotate: "-6deg", opacity: 0.58, depth: 9, aos: "fade-left", delay: 170 },
        { id: "pc-r-cutout-low", type: "cutout", density: "max", right: "-2.4%", bottom: "3.4%", width: "clamp(104px, 10vw, 172px)", height: "clamp(136px, 13.6vw, 226px)", rotate: "3deg", opacity: 0.6, depth: 12, aos: "fade-left", delay: 220, hideTablet: true },
        { id: "pc-top-left", type: "card", density: "plus", left: "16%", top: "1.2%", width: "clamp(72px, 5.2vw, 102px)", height: "clamp(92px, 6.8vw, 142px)", rotate: "-7deg", opacity: 0.48, depth: 7, aos: "fade-down", delay: 230, hideMobile: true },
        { id: "pc-top-right", type: "card", density: "plus", right: "16%", top: "1.2%", width: "clamp(72px, 5.2vw, 102px)", height: "clamp(92px, 6.8vw, 142px)", rotate: "7deg", opacity: 0.48, depth: 7, aos: "fade-down", delay: 230, hideMobile: true },
        { id: "pc-mid-left", type: "card", density: "max", left: "8%", top: "70%", width: "clamp(68px, 4.9vw, 96px)", height: "clamp(88px, 6.4vw, 136px)", rotate: "4deg", opacity: 0.45, depth: 6, aos: "fade-up", delay: 260, hideTablet: true },
        { id: "pc-mid-right", type: "card", density: "max", right: "8%", top: "72%", width: "clamp(68px, 4.9vw, 96px)", height: "clamp(88px, 6.4vw, 136px)", rotate: "-4deg", opacity: 0.45, depth: 6, aos: "fade-up", delay: 260, hideTablet: true },
    ],
    "sunrise-bands": [
        { id: "sb-top-left", type: "card", density: "core", left: "5.2%", top: "2.1%", width: "clamp(78px, 5.8vw, 114px)", height: "clamp(102px, 7.6vw, 162px)", rotate: "-4deg", opacity: 0.58, depth: 8, aos: "fade-down", delay: 90 },
        { id: "sb-top-mid-left", type: "card", density: "core", left: "18.6%", top: "1.6%", width: "clamp(74px, 5.4vw, 108px)", height: "clamp(98px, 7.2vw, 154px)", rotate: "-2deg", opacity: 0.56, depth: 8, aos: "fade-down", delay: 120, hideMobile: true },
        { id: "sb-top-mid-right", type: "card", density: "core", right: "18.6%", top: "1.6%", width: "clamp(74px, 5.4vw, 108px)", height: "clamp(98px, 7.2vw, 154px)", rotate: "2deg", opacity: 0.56, depth: 8, aos: "fade-down", delay: 120, hideMobile: true },
        { id: "sb-top-right", type: "card", density: "core", right: "5.2%", top: "2.1%", width: "clamp(78px, 5.8vw, 114px)", height: "clamp(102px, 7.6vw, 162px)", rotate: "4deg", opacity: 0.58, depth: 8, aos: "fade-down", delay: 90 },
        { id: "sb-left-cutout", type: "cutout", density: "plus", left: "-3.2%", top: "22%", width: "clamp(114px, 11.4vw, 196px)", height: "clamp(154px, 16.2vw, 266px)", rotate: "-3deg", opacity: 0.64, depth: 13, aos: "fade-right", delay: 150, hideMobile: true },
        { id: "sb-left-card", type: "card", density: "plus", left: "1.5%", top: "48%", width: "clamp(78px, 5.9vw, 114px)", height: "clamp(100px, 7.4vw, 160px)", rotate: "5deg", opacity: 0.56, depth: 9, aos: "fade-right", delay: 190 },
        { id: "sb-right-cutout", type: "cutout", density: "plus", right: "-3.2%", top: "22%", width: "clamp(114px, 11.4vw, 196px)", height: "clamp(154px, 16.2vw, 266px)", rotate: "3deg", opacity: 0.64, depth: 13, aos: "fade-left", delay: 150, hideMobile: true },
        { id: "sb-right-card", type: "card", density: "plus", right: "1.5%", top: "48%", width: "clamp(78px, 5.9vw, 114px)", height: "clamp(100px, 7.4vw, 160px)", rotate: "-5deg", opacity: 0.56, depth: 9, aos: "fade-left", delay: 190 },
        { id: "sb-bottom-left-cutout", type: "cutout", density: "max", left: "-1.8%", bottom: "2.6%", width: "clamp(98px, 9.6vw, 162px)", height: "clamp(130px, 13.4vw, 220px)", rotate: "-4deg", opacity: 0.56, depth: 11, aos: "fade-up", delay: 230, hideTablet: true },
        { id: "sb-bottom-right-cutout", type: "cutout", density: "max", right: "-1.8%", bottom: "2.6%", width: "clamp(98px, 9.6vw, 162px)", height: "clamp(130px, 13.4vw, 220px)", rotate: "4deg", opacity: 0.56, depth: 11, aos: "fade-up", delay: 230, hideTablet: true },
        { id: "sb-bottom-left-card", type: "card", density: "max", left: "14%", bottom: "1.4%", width: "clamp(68px, 4.9vw, 96px)", height: "clamp(88px, 6.5vw, 136px)", rotate: "4deg", opacity: 0.44, depth: 6, aos: "fade-up", delay: 260, hideTablet: true },
        { id: "sb-bottom-right-card", type: "card", density: "max", right: "14%", bottom: "1.4%", width: "clamp(68px, 4.9vw, 96px)", height: "clamp(88px, 6.5vw, 136px)", rotate: "-4deg", opacity: 0.44, depth: 6, aos: "fade-up", delay: 260, hideTablet: true },
    ],
};

const VARIANT_KEYS = Object.keys(COLLAGE_VARIANTS);

const PAGE_VARIANT_OVERRIDES = [
    ["/emotional-checkin/teacher-dashboard", "playful-cascade"],
    ["/emotional-checkin/dashboard", "story-orbit"],
    ["/emotional-checkin/staff", "studio-zigzag"],
    ["/user-management", "sunrise-bands"],
    ["/profile/personal-stats", "sunrise-bands"],
    ["/profile/emotional-history", "atlas-ribbon"],
    ["/profile/emotional-patterns", "playful-cascade"],
    ["/profile", "atlas-ribbon"],
    ["/notifications", "story-orbit"],
    ["/emotional-wellness", "studio-zigzag"],
    ["/mtss/admin", "sunrise-bands"],
    ["/mtss/student", "story-orbit"],
];

const resolveVariantKey = (pathname = "") => {
    for (const [prefix, variant] of PAGE_VARIANT_OVERRIDES) {
        if (routeMatches(pathname, prefix)) return variant;
    }
    return VARIANT_KEYS[hashString(pathname) % VARIANT_KEYS.length] || "atlas-ribbon";
};

const resolveScenario = (pathname) => {
    if (
        routeMatches(pathname, "/emotional-checkin/dashboard")
        || routeMatches(pathname, "/emotional-checkin/teacher-dashboard")
        || routeMatches(pathname, "/user-management")
        || routeMatches(pathname, "/mtss/admin")
    ) {
        return "dense";
    }

    if (
        routeMatches(pathname, "/emotional-checkin/staff")
        || routeMatches(pathname, "/profile")
        || routeMatches(pathname, "/notifications")
        || routeMatches(pathname, "/mtss/student")
    ) {
        return "medium";
    }

    return "light";
};

const densityRank = {
    core: 1,
    plus: 2,
    max: 3,
};

const scenarioRank = {
    light: 1,
    medium: 2,
    dense: 3,
};

const selectScenarioSlots = (slots, scenario) => {
    const threshold = scenarioRank[scenario] || scenarioRank.light;
    return slots.filter((slot) => (densityRank[slot.density || "core"] || 1) <= threshold);
};

const parseRotateDeg = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return 0;
    const parsed = Number.parseFloat(value.replace("deg", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const pickEvenly = (items, target) => {
    if (items.length <= target) return [...items];
    const result = [];
    const step = (items.length - 1) / Math.max(target - 1, 1);
    for (let index = 0; index < target; index += 1) {
        result.push(items[Math.round(index * step)]);
    }
    return result;
};

const TARGET_RAIL_COUNT = {
    mobile: { light: 2, medium: 3, dense: 4 },
    tablet: { light: 3, medium: 4, dense: 5 },
    desktop: { light: 4, medium: 6, dense: 7 },
};

const resolveTargetRailCount = (scenario, deviceTier) => {
    const tier = TARGET_RAIL_COUNT[deviceTier] ? deviceTier : "desktop";
    const mode = scenarioRank[scenario] ? scenario : "light";
    return TARGET_RAIL_COUNT[tier][mode];
};

const toPercentNumber = (value, fallback = 50) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return fallback;
    const parsed = Number.parseFloat(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
};

const buildBalancedRailFiller = ({
    side,
    index,
    seed,
    deviceTier,
    nextCardSlot,
    nextCutoutSlot,
}) => {
    const slotSeed = hashString(`${seed}:balance:${side}:${index}`);
    const preferCutout = deviceTier === "desktop" && slotSeed % 9 === 0;
    const baseSlot = preferCutout ? nextCutoutSlot(slotSeed) : nextCardSlot(slotSeed);
    return {
        ...baseSlot,
        id: `bal-${side}-${index}`,
        density: "core",
        isFiller: true,
        aos: side === "left" ? "fade-right" : "fade-left",
        delay: 90 + (index * 18),
        depth: preferCutout ? 7 : 6,
    };
};

const balanceRailSlots = ({
    slots,
    scenario,
    deviceTier,
    seed,
    nextCardSlot,
    nextCutoutSlot,
}) => {
    const leftRail = [];
    const rightRail = [];
    const centerSlots = [];

    slots.forEach((slot) => {
        if (slot.left !== undefined && slot.right === undefined) {
            leftRail.push(slot);
            return;
        }
        if (slot.right !== undefined && slot.left === undefined) {
            rightRail.push(slot);
            return;
        }
        centerSlots.push(slot);
    });

    const targetCount = resolveTargetRailCount(scenario, deviceTier);

    const normalizeRailCount = (rail, side) => {
        const sorted = [...rail].sort((a, b) => (
            toPercentNumber(a.top, 50) - toPercentNumber(b.top, 50)
        ));
        const trimmed = pickEvenly(sorted, targetCount);
        const result = [...trimmed];
        while (result.length < targetCount) {
            result.push(buildBalancedRailFiller({
                side,
                index: result.length,
                seed,
                deviceTier,
                nextCardSlot,
                nextCutoutSlot,
            }));
        }
        return result;
    };

    const leftNormalized = normalizeRailCount(leftRail, "left");
    const rightNormalized = normalizeRailCount(rightRail, "right");

    const spreadRail = (slotsBySide, side) => {
        if (slotsBySide.length === 0) return [];

        const metricByTier = {
            mobile: {
                card: {
                    width: "clamp(72px, 19vw, 108px)",
                    height: "clamp(98px, 24vw, 148px)",
                    span: 17.4,
                },
                cutout: {
                    width: "clamp(92px, 24vw, 142px)",
                    height: "clamp(124px, 31vw, 194px)",
                    span: 20.8,
                },
                gap: 3.2,
                start: 5.2,
                end: 95,
                laneOffsets: [1.2],
                laneStarts: [6.2],
            },
            tablet: {
                card: {
                    width: "clamp(82px, 8.2vw, 124px)",
                    height: "clamp(112px, 11vw, 174px)",
                    span: 16.8,
                },
                cutout: {
                    width: "clamp(102px, 10.8vw, 170px)",
                    height: "clamp(138px, 14.4vw, 224px)",
                    span: 20,
                },
                gap: 3,
                start: 4.4,
                end: 95.5,
                laneOffsets: [0.8, 10.2],
                laneStarts: [5.2, 14],
            },
            desktop: {
                card: {
                    width: "clamp(92px, 6.8vw, 136px)",
                    height: "clamp(124px, 9.2vw, 188px)",
                    span: 15.8,
                },
                cutout: {
                    width: "clamp(112px, 9.2vw, 190px)",
                    height: "clamp(150px, 12vw, 250px)",
                    span: 18.8,
                },
                gap: 2.8,
                start: 4,
                end: 96,
                laneOffsets: [0.4, 11.4],
                laneStarts: [5.2, 12],
            },
        };
        const tier = metricByTier[deviceTier] ? deviceTier : "desktop";
        const metric = metricByTier[tier];
        const laneCount = metric.laneOffsets.length;
        const lanes = metric.laneOffsets.map((offset, laneIndex) => ({
            offset,
            cursor: metric.laneStarts[laneIndex] ?? metric.start,
        }));
        const sorted = [...slotsBySide].sort((a, b) => (
            toPercentNumber(a.top, 50) - toPercentNumber(b.top, 50)
        ));

        return sorted.map((slot) => {
            let laneIndex = 0;
            for (let index = 1; index < laneCount; index += 1) {
                if (lanes[index].cursor < lanes[laneIndex].cursor) laneIndex = index;
            }

            const lane = lanes[laneIndex];
            const sizeProfile = slot.type === "cutout" ? metric.cutout : metric.card;
            const slotSpan = slot.isFiller ? sizeProfile.span * 0.92 : sizeProfile.span;
            const topPercent = clamp(lane.cursor, metric.start, metric.end - slotSpan);
            lane.cursor = topPercent + slotSpan + metric.gap;

            return {
                ...slot,
                left: side === "left" ? `${lane.offset.toFixed(2)}%` : undefined,
                right: side === "right" ? `${lane.offset.toFixed(2)}%` : undefined,
                top: `${topPercent.toFixed(2)}%`,
                bottom: undefined,
                width: sizeProfile.width,
                height: sizeProfile.height,
            };
        });
    };

    return [
        ...spreadRail(leftNormalized, "left"),
        ...spreadRail(rightNormalized, "right"),
        ...centerSlots,
    ];
};

const slotStyleVars = (slot) => ({
    "--whl-left": slot.left ?? "auto",
    "--whl-right": slot.right ?? "auto",
    "--whl-top": slot.top ?? "auto",
    "--whl-bottom": slot.bottom ?? "auto",
    "--whl-width": slot.width ?? "auto",
    "--whl-height": slot.height ?? "auto",
    "--whl-rotate": slot.normalizedRotate ?? slot.rotate ?? "0deg",
    "--whl-opacity": slot.opacity ?? 0.56,
    "--whl-shift-x": `${slot.shiftX ?? 0}px`,
    "--whl-shift-y": `${slot.shiftY ?? 0}px`,
    "--whl-rotate-extra": `${slot.rotateExtra ?? 0}deg`,
});

const slotVisibilityClasses = (slot) => (
    `${slot.hideTablet ? " whl-hide-tablet" : ""}${slot.hideMobile ? " whl-hide-mobile" : ""}`
);

const WorkforceHumanisticLayer = memo(() => {
    const layerRef = useRef(null);
    const loopsRef = useRef([]);
    const location = useLocation();
    const user = useSelector((state) => state.auth?.user);
    const lowMotion = usePreferLowMotion();
    const pathname = location.pathname || "";
    const normalizedRole = String(user?.role || "").trim().toLowerCase();
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window === "undefined" ? 1280 : window.innerWidth
    ));

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        let frame = 0;
        const onResize = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => setViewportWidth(window.innerWidth));
        };

        window.addEventListener("resize", onResize, { passive: true });
        return () => {
            window.removeEventListener("resize", onResize);
            window.cancelAnimationFrame(frame);
        };
    }, []);

    const shouldRender = useMemo(() => {
        if (!WORKFORCE_ROLES.has(normalizedRole)) return false;
        if (routeMatches(pathname, "/student")) return false;
        if (routeMatches(pathname, "/mtss/student-portal")) return false;
        if (routeMatches(pathname, "/emotional-checkin/staff")) return false;
        if (pathname === "/support-hub" || pathname === "/mtss/teacher") return false;
        if (routeMatches(pathname, "/emotional-checkin/teacher-dashboard")) return false;
        return true;
    }, [normalizedRole, pathname]);

    const scenario = useMemo(() => resolveScenario(pathname), [pathname]);
    const variantKey = useMemo(() => resolveVariantKey(pathname), [pathname]);
    const variantSlots = useMemo(() => (
        COLLAGE_VARIANTS[variantKey] || COLLAGE_VARIANTS["atlas-ribbon"]
    ), [variantKey]);
    const scenarioSlots = useMemo(() => selectScenarioSlots(variantSlots, scenario), [scenario, variantSlots]);

    const deviceTier = useMemo(() => {
        if (viewportWidth <= 768) return "mobile";
        if (viewportWidth <= 1024) return "tablet";
        return "desktop";
    }, [viewportWidth]);

    const visibleSlots = useMemo(() => scenarioSlots.filter((slot) => {
        if (deviceTier === "mobile" && slot.hideMobile) return false;
        if ((deviceTier === "mobile" || deviceTier === "tablet") && slot.hideTablet) return false;
        return true;
    }), [deviceTier, scenarioSlots]);

    const resolvedSlots = useMemo(() => {
        const cycleStamp = `${new Date().toISOString().slice(0, 10)}-${Math.floor(new Date().getHours() / 6)}`;
        const seed = hashString(`${pathname}|${normalizedRole}|${variantKey}|${scenario}|${cycleStamp}`);
        const cardPool = seededShuffle(MWS_STUDENT_CARD_ASSET_IDS, seed + 17);
        const cutoutPool = seededShuffle(MWS_STUDENT_CUTOUT_ASSET_IDS, seed + 97);
        let cardCursor = 0;
        let cutoutCursor = 0;

        const nextCardSlot = (slotSeed = seed) => {
            const assetId = cardPool[positiveIndex(cardCursor, cardPool.length)];
            const frameClass = CARD_FRAME_CLASSES[positiveIndex(slotSeed + cardCursor, CARD_FRAME_CLASSES.length)];
            cardCursor += 1;
            return {
                type: "card",
                src: cardPhoto(assetId),
                frameClass,
            };
        };

        const nextCutoutSlot = (slotSeed = seed) => {
            const assetId = cutoutPool[positiveIndex(cutoutCursor, cutoutPool.length)];
            const frameClass = CUTOUT_STYLE_CLASSES[positiveIndex(slotSeed + cutoutCursor, CUTOUT_STYLE_CLASSES.length)];
            cutoutCursor += 1;
            return {
                type: "cutout",
                src: cutoutPhoto(assetId),
                frameClass,
            };
        };

        const mappedSlots = visibleSlots.map((slot, index) => {
            const slotSeed = hashString(`${slot.id}:${seed}:${index}`);
            const shiftXRange = slot.type === "cutout" ? 1 : 2;
            const shiftYRange = slot.type === "cutout" ? 2 : 3;
            const shiftX = (slotSeed % ((shiftXRange * 2) + 1)) - shiftXRange;
            const shiftY = (Math.floor(slotSeed / 7) % ((shiftYRange * 2) + 1)) - shiftYRange;
            const baseRotate = parseRotateDeg(slot.rotate);
            const rotateMicro = ((Math.floor(slotSeed / 13) % 5) - 2) * (slot.type === "cutout" ? 0.05 : 0.12);
            const normalizedRotateDeg = slot.type === "cutout"
                ? clamp(baseRotate * 0.16, -1.1, 1.1)
                : clamp(baseRotate * 0.3, -2.2, 2.2);
            const rotateExtra = rotateMicro;
            const normalizedRotate = `${(normalizedRotateDeg).toFixed(2)}deg`;

            if (slot.type === "card") {
                const assigned = nextCardSlot(slotSeed);
                return {
                    ...slot,
                    src: assigned.src,
                    frameClass: assigned.frameClass,
                    shiftX,
                    shiftY,
                    normalizedRotate,
                    rotateExtra,
                };
            }

            const assigned = nextCutoutSlot(slotSeed);
            return {
                ...slot,
                src: assigned.src,
                frameClass: assigned.frameClass,
                shiftX,
                shiftY,
                normalizedRotate,
                rotateExtra,
            };
        });

        return balanceRailSlots({
            slots: mappedSlots,
            scenario,
            deviceTier,
            seed,
            nextCardSlot,
            nextCutoutSlot,
        });
    }, [deviceTier, normalizedRole, pathname, scenario, variantKey, visibleSlots]);

    useEffect(() => {
        if (!shouldRender || lowMotion || typeof window === "undefined") return undefined;

        const root = layerRef.current;
        if (!root) return undefined;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

        const nodes = root.querySelectorAll("[data-whl-depth]");
        if (nodes.length === 0) return undefined;

        const movers = Array.from(nodes).map((node) => {
            const depth = Number(node.getAttribute("data-whl-depth")) || 8;
            return {
                depth,
                x: gsap.quickTo(node, "x", { duration: 0.8, ease: "power2.out" }),
                y: gsap.quickTo(node, "y", { duration: 0.8, ease: "power2.out" }),
            };
        });

        const handlePointerMove = (event) => {
            const offsetX = (event.clientX / window.innerWidth) - 0.5;
            const offsetY = (event.clientY / window.innerHeight) - 0.5;
            movers.forEach((item) => {
                item.x(offsetX * item.depth * 3.5);
                item.y(offsetY * item.depth * 2.8);
            });
        };

        const handlePointerLeave = () => {
            movers.forEach((item) => {
                item.x(0);
                item.y(0);
            });
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerleave", handlePointerLeave);
        };
    }, [lowMotion, resolvedSlots, shouldRender]);

    useEffect(() => {
        loopsRef.current.forEach((loop) => loop?.pause?.());
        loopsRef.current = [];

        if (!shouldRender || lowMotion) return undefined;
        const root = layerRef.current;
        if (!root) return undefined;

        const loops = [];
        const cardNodes = root.querySelectorAll(".whl-card .whl-item-img");
        if (cardNodes.length > 0) {
            loops.push(
                animate(cardNodes, {
                    scale: [1, 1.035, 1],
                    translateY: [0, -5, 0],
                }, {
                    duration: 3400,
                    delay: stagger(110),
                    ease: "inOutSine",
                    loop: true,
                })
            );
        }

        const cutoutNodes = root.querySelectorAll(".whl-cutout .whl-item-img");
        if (cutoutNodes.length > 0) {
            loops.push(
                animate(cutoutNodes, {
                    translateY: [0, -7, 0],
                    rotate: ["-0.35deg", "0.35deg", "-0.35deg"],
                }, {
                    duration: 3900,
                    delay: stagger(130, { start: 80 }),
                    ease: "inOutSine",
                    loop: true,
                })
            );
        }

        const glows = root.querySelectorAll(".whl-glow");
        if (glows.length > 0) {
            loops.push(
                animate(glows, {
                    opacity: [0.12, 0.26, 0.12],
                    scale: [0.96, 1.04, 0.96],
                }, {
                    duration: 2800,
                    delay: stagger(80),
                    ease: "inOutQuad",
                    loop: true,
                })
            );
        }

        loopsRef.current = loops;

        const handleVisibility = () => {
            loopsRef.current.forEach((loop) => {
                if (document.hidden) loop?.pause?.();
                else loop?.play?.();
            });
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            loops.forEach((loop) => loop?.pause?.());
            loopsRef.current = [];
        };
    }, [lowMotion, resolvedSlots, shouldRender]);

    if (!shouldRender) return null;

    return (
        <div
            ref={layerRef}
            className={`workforce-humanistic-layer whl--${scenario} whl-variant--${variantKey}`}
            data-whl-variant={variantKey}
            aria-hidden="true"
        >
            <div className="whl-shell" />
            <div className="whl-content-veil" />
            <div className="whl-rail whl-rail-left" />
            <div className="whl-rail whl-rail-right" />

            <div className="whl-glow whl-glow-left" />
            <div className="whl-glow whl-glow-right" />

            {resolvedSlots.map((slot) => (
                <div
                    key={slot.id}
                    className={`whl-item whl-${slot.type}${slotVisibilityClasses(slot)} ${slot.frameClass || ""}${slot.isFiller ? " whl-item--filler" : ""}`}
                    style={slotStyleVars(slot)}
                    data-whl-depth={slot.depth ?? 8}
                    data-aos={slot.aos || "fade-up"}
                    data-aos-delay={slot.delay ?? 100}
                    data-aos-duration={700}
                    data-aos-easing="ease-out-cubic"
                >
                    <img src={slot.src} alt="" className="whl-item-img" loading="eager" decoding="async" />
                </div>
            ))}
        </div>
    );
});

WorkforceHumanisticLayer.displayName = "WorkforceHumanisticLayer";
export default WorkforceHumanisticLayer;

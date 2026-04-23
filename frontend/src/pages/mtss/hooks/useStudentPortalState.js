import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import socketService from "@/services/socketService";
import {
    MTSS_REALTIME_ADMIN_ROLES,
    MTSS_REALTIME_MENTOR_ROLES,
    resolveMtssRealtimeScope,
} from "../utils/mtssRealtimeScope";
import {
    fetchMtssStudentById,
    fetchMtssStudents,
} from "@/services/mtssService";
import {
    buildGradeTierLabel,
    filterStudentsForViewer,
    mapStudentCard,
} from "../student/portal/studentPortalStateUtils";

export const useStudentPortalState = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);
    const [activeTab, setActiveTab] = useState("progress");

    const loadStudents = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) {
                setIsLoadingList(true);
            }
            setError(null);
            const payload = await fetchMtssStudents({ limit: 500 });
            const rawStudents = Array.isArray(payload?.students) ? payload.students : [];
            const scopedStudents = filterStudentsForViewer(rawStudents, user);
            const mapped = scopedStudents.map((student, index) => mapStudentCard(student, index));
            setStudents(mapped);
            if (!selectedStudent && mapped.length === 1) {
                setSelectedStudent(mapped[0].id);
            }
            if (selectedStudent && !mapped.some((student) => String(student.id) === String(selectedStudent))) {
                setSelectedStudent(mapped[0]?.id || null);
                setActiveTab("progress");
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load student portal");
            setStudents([]);
        } finally {
            if (!silent) {
                setIsLoadingList(false);
            }
        }
    }, [selectedStudent, user]);

    const loadStudentDetails = useCallback(
        async (studentId, { silent = false } = {}) => {
            if (!studentId) {
                setStudentDetails(null);
                return;
            }
            try {
                if (!silent) {
                    setIsLoadingDetail(true);
                }
                const payload = await fetchMtssStudentById(studentId);
                setStudentDetails(payload?.student || null);
            } catch (err) {
                setStudentDetails(null);
            } finally {
                if (!silent) {
                    setIsLoadingDetail(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    useEffect(() => {
        if (!selectedStudent) return;
        loadStudentDetails(selectedStudent);
    }, [loadStudentDetails, selectedStudent]);

    useEffect(() => {
        const refreshPortal = () => {
            loadStudents({ silent: true });
            if (selectedStudent) {
                loadStudentDetails(selectedStudent, { silent: true });
            }
        };

        const interval = setInterval(refreshPortal, 30000);
        return () => clearInterval(interval);
    }, [loadStudents, loadStudentDetails, selectedStudent]);

    useEffect(() => {
        const userId = user?.id || user?._id;
        const role = String(user?.role || "").trim().toLowerCase();
        const liveScope = resolveMtssRealtimeScope(user);
        if (!userId || !role) return;

        socketService.connect();
        socketService.joinMtssLive(liveScope);
        if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
            socketService.joinMtssAdmin();
        } else if (MTSS_REALTIME_MENTOR_ROLES.has(role)) {
            socketService.joinMtssMentor(userId);
        }

        const handleMtssRefresh = () => {
            loadStudents({ silent: true });
            if (selectedStudent) {
                loadStudentDetails(selectedStudent, { silent: true });
            }
        };

        socketService.onMtssRefresh(handleMtssRefresh);

        return () => {
            socketService.offMtssRefresh(handleMtssRefresh);
            socketService.leaveMtssLive(liveScope);
            if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
                socketService.leaveMtssAdmin();
            } else if (MTSS_REALTIME_MENTOR_ROLES.has(role)) {
                socketService.leaveMtssMentor(userId);
            }
        };
    }, [loadStudents, loadStudentDetails, selectedStudent, user]);

    const currentStudent = useMemo(() => {
        const base = students.find((student) => String(student.id) === String(selectedStudent))
            || students[0]
            || null;
        if (!base) return null;

        const merged = studentDetails
            ? {
                ...base,
                ...studentDetails,
                id: String(base.id),
                accent: base.accent,
                focus: studentDetails.primaryIntervention?.label || studentDetails.type || base.focus,
                mentor: studentDetails.mentor || studentDetails.profile?.mentor || base.mentor,
                gradeTierLabel: buildGradeTierLabel(studentDetails),
            }
            : base;

        return merged;
    }, [selectedStudent, studentDetails, students]);

    const handleBack = useCallback(() => {
        if (selectedStudent) {
            setSelectedStudent(null);
            setStudentDetails(null);
            setActiveTab("progress");
            return;
        }
        navigate("/mtss");
    }, [selectedStudent, navigate]);

    const handleSelectStudent = useCallback((studentId) => {
        setSelectedStudent(studentId);
        setActiveTab("progress");
    }, []);

    const refreshPortal = useCallback(async () => {
        await loadStudents();
        if (selectedStudent) {
            await loadStudentDetails(selectedStudent);
        }
    }, [loadStudentDetails, loadStudents, selectedStudent]);

    return {
        selectedStudent,
        activeTab,
        setActiveTab,
        currentStudent,
        isLoadingList,
        isLoadingDetail,
        error,
        handleBack,
        handleSelectStudent,
        refreshPortal,
        students,
    };
};

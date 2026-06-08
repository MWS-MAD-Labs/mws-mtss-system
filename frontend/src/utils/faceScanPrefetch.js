// No-op stub for mws-mtss-system.
//
// The MTSS product has no face-scan / emotional check-in flow, so there are no
// VerificationPage / StudentFaceScanPage / faceDetectionService modules to
// prefetch. The shared RoleSelectionPage still imports these helpers on hover
// intent, so we keep the exported API surface but make every call a no-op.
// This also keeps the heavy face-api / vision ML stack out of the MTSS bundle.

const resolved = () => Promise.resolve();

export const prefetchVisionStack = resolved;
export const prefetchStaffFaceScanOnIntent = resolved;
export const prefetchStudentFaceScanOnIntent = resolved;

import { memo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDefaultMtssRoute } from "@/utils/mtssAccess";

// This route used to be a "choose MTSS or Emotional Check-in" picker - that
// choice now belongs to Hub (app launcher across all MWS tools), so a staff
// member who lands here is sent straight to their MTSS dashboard instead of
// being asked to pick again. The route itself stays, since other screens
// (nav, profile, notifications, the AI assistant's known destinations) still
// link here as "home" - only what it does on arrival changed.
const SupportModeSelectionPage = memo(() => {
  const { user } = useSelector((state) => state.auth);
  const target = getDefaultMtssRoute(user) || "/select-role";

  return <Navigate to={target} replace />;
});

SupportModeSelectionPage.displayName = "SupportModeSelectionPage";
export default SupportModeSelectionPage;

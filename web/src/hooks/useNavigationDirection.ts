import { useNavigationType } from "react-router";

export function useNavigationDirection(): "forward" | "back" {
  const navType = useNavigationType();
  return navType === "POP" ? "back" : "forward";
}

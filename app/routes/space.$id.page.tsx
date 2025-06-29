import { Outlet } from "react-router";

export default function SpacePage() {
  return (
    <div className="flex flex-col items-start justify-start h-full w-full">
      <Outlet />
    </div>
  );
}

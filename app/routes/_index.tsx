import Header from "~/components/header";
import Welcome from "~/components/welcome";
import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_NETLIFY };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-start h-screen w-full">
      <Header />
      <Welcome />
    </div>
  );
}

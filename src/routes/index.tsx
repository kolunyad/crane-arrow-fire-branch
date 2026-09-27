import { createFileRoute } from "@tanstack/react-router";
import { Survivor } from "@/components/Survivor";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <Survivor />;
}

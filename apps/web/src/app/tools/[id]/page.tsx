"use client";
import { useParams } from "next/navigation";
import ToolPlayground from "@/components/tools/ToolPlayground";

export default function ToolsPage() {
  const params = useParams();
  const id = params.id as string;

  return <ToolPlayground id={id} embedded={false} />;
}

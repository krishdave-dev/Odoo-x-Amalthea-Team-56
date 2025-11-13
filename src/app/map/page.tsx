"use client";

import { DependencyMap } from "@/components/map/DependencyMap";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network } from "lucide-react";
import Link from "next/link";

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tasks
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0A1931]">
                    Dependency Map
                  </h1>
                  <p className="text-sm text-[#4A7FA7]">
                    Visualize project relationships and task dependencies
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative">
        <DependencyMap />
      </div>
    </div>
  );
}

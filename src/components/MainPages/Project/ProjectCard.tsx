import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar, MoreVertical, Edit3, Trash2, Flag } from "lucide-react";

interface ProjectCardProps {
  title: string;
  tags?: string[];
  images?: string[];
  deadline?: string;
  managerName?: string;
  managerAvatar?: string;
  tasksCount?: number;
}

export function ProjectCard({
  title,
  tags = [],
  images = [],
  deadline,
  managerName = "",
  managerAvatar,
  tasksCount = 0,
}: ProjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer p-4">
      <CardContent className="p-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex gap-2 mb-3 flex-wrap">
              {tags.map((t) => (
                <Badge key={t} className="bg-emerald-100 text-emerald-800" variant="outline">{t}</Badge>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-3">{title}</h3>

            {/* image thumbnails */}
            <div className="flex items-center gap-2 mb-4">
              {images.length ? (
                images.slice(0, 3).map((src, i) => (
                  <div key={i} className="w-20 h-14 overflow-hidden rounded-lg border">
                    <img src={src} alt={`img-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="w-20 h-14 bg-neutral-100 rounded-lg" />
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span>{deadline ?? "-"}</span>
              </div>

              <div className="flex items-center gap-2">
                {managerAvatar ? (
                  <img src={managerAvatar} alt={managerName} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-200" />
                )}
                <span>{tasksCount} tasks</span>
              </div>
            </div>
          </div>

          <div className="ml-4 shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="p-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <div className="flex flex-col">
                  <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded">
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                    <span className="ml-auto inline-block bg-muted text-muted-foreground px-3 py-0.5 rounded-full text-xs">{managerName || "Uncommon Hippopotamus"}</span>
                  </button>
                  <button className="flex items-center gap-2 p-2 mt-2 text-red-600 hover:bg-neutral-100 rounded">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-0 mt-4">
        {/* footer intentionally left minimal; kept for spacing */}
      </CardFooter>
    </Card>
  );
}

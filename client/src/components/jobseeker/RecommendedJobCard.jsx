import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RecommendedJobCard = ({ job }) => {
  return (
    <Card 
      className="min-w-[280px] w-[280px] rounded-[24px] border-border hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer group bg-card overflow-hidden"
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="w-14 h-14 rounded-2xl border border-border flex items-center justify-center p-2.5 shadow-sm overflow-hidden bg-background group-hover:border-primary/20 transition-colors">
            <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
          </div>
          <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
            {job.postedAt}
          </Badge>
        </div>

        <h4 className="text-[15px] font-extrabold text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1.5 leading-tight">
          {job.title}
        </h4>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-muted-foreground">{job.company}</span>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-0.5 text-xs font-black text-green-600">
            {job.rating} <Star size={10} className="fill-green-600" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
          <MapPin size={13} className="text-muted-foreground/60" />
          <span>{job.location}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendedJobCard;

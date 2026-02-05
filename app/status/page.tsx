"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Search, 
  FileText, 
  Users, 
  AlertCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/components/language-provider";

export default function StatusPage() {
  const { t } = useLanguage();
  const [searchCode, setSearchCode] = useState("");
  const [queryCode, setQueryCode] = useState("");

  const data = useQuery(api.applications.getByApplicationNumber, 
    queryCode ? { applicationNumber: queryCode } : "skip"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      setQueryCode(searchCode.trim().toUpperCase());
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Timeline Logic
  const getTimelineSteps = () => {
    if (!data) return [];

    const { application, referees } = data;
    const hasReferees = Array.isArray(referees) && referees.length > 0;
    const allGuarantorsConfirmed = hasReferees ? referees.every(r => r.acknowledged) : true;
    const isUnderReview = ["under_review", "approved", "rejected"].includes(application.status);
    const isDecided = ["approved", "rejected"].includes(application.status);
    const isApproved = application.status === "approved";

    const baseSteps = [
      {
        title: t.status.timeline.submitted.title,
        description: t.status.timeline.submitted.desc.replace("{date}", formatDate(application.submittedAt || application.createdAt)),
        status: "completed",
        icon: CheckCircle2,
      },
      {
        title: t.status.timeline.review.title,
        description: isUnderReview 
          ? t.status.timeline.review.desc 
          : t.status.timeline.review.waiting,
        status: isUnderReview ? (isDecided ? "completed" : "current") : "pending",
        icon: isUnderReview ? (isDecided ? CheckCircle2 : Clock) : Circle,
      },
      {
        title: t.status.timeline.decision.title,
        description: isDecided 
          ? (isApproved ? t.status.timeline.decision.descApproved : t.status.timeline.decision.descRejected)
          : t.status.timeline.decision.pending,
        status: isDecided ? (isApproved ? "completed" : "rejected") : "pending",
        icon: isDecided ? (isApproved ? CheckCircle2 : XCircle) : Circle,
      }
    ];

    // Include guarantor step only if referees exist
    if (hasReferees) {
      baseSteps.splice(1, 0, {
        title: t.status.timeline.guarantor.title,
        description: allGuarantorsConfirmed 
          ? t.status.timeline.guarantor.allConfirmed 
          : t.status.timeline.guarantor.partialConfirmed
              .replace("{count}", referees.filter(r => r.acknowledged).length.toString())
              .replace("{total}", referees.length.toString()),
        status: allGuarantorsConfirmed ? "completed" : "current",
        icon: allGuarantorsConfirmed ? CheckCircle2 : Clock,
      });
    }

    return baseSteps;
  };

  const timelineSteps = getTimelineSteps();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4 tracking-tight">{t.status.title}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.status.description}
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-md mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              placeholder={t.status.inputPlaceholder} 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="h-12 text-lg uppercase"
            />
            <Button type="submit" size="lg" className="h-12 px-6">
              <Search className="w-5 h-5 mr-2" />
              {t.status.trackButton}
            </Button>
          </form>
        </div>

        {/* Results Section */}
        {queryCode && data === null && (
          <div className="text-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-sm border inline-block max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.status.notFound.title}</h3>
              <p className="text-muted-foreground">
                {t.status.notFound.description.replace("{code}", queryCode)}
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Timeline */}
            <div className="lg:col-span-1">
              <Card className="h-full border-none shadow-md">
                <CardHeader>
                  <CardTitle>{t.status.timeline.title}</CardTitle>
                  <CardDescription>{t.status.timeline.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 ml-2">
                    {timelineSteps.map((step, index) => (
                      <div key={index} className="relative pl-6">
                        <div className={cn(
                          "absolute -left-[21px] top-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center",
                          step.status === "completed" ? "bg-green-100 text-green-600" :
                          step.status === "current" ? "bg-blue-100 text-blue-600" :
                          step.status === "rejected" ? "bg-red-100 text-red-600" :
                          "bg-slate-100 text-slate-400"
                        )}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <h3 className={cn(
                          "font-semibold text-sm mb-1",
                          step.status === "pending" && "text-muted-foreground"
                        )}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Validation Items & Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Rejection Notice */}
              {data.application.status === "rejected" && data.application.reviewNotes && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex gap-3 items-start">
                    <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold">{t.status.details.rejection.title}</h4>
                      <p className="text-sm mt-1">{data.application.reviewNotes}</p>
                    </div>
                 </div>
              )}

              {/* Application Details */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{t.status.details.title}</CardTitle>
                      <CardDescription>{t.status.details.reference} <span className="font-mono font-medium text-primary">{data.application.applicationNumber}</span></CardDescription>
                    </div>
                    <Badge variant={
                      data.application.status === "approved" ? "default" : 
                      data.application.status === "rejected" ? "destructive" : "secondary"
                    } className="text-sm px-3 py-1 capitalize">
                      {data.application.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t.status.details.loanType}</Label>
                    <div className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {data.loanType?.name || "N/A"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t.status.details.requestedAmount}</Label>
                    <div className="font-medium text-lg">
                      {(data.application.requestedAmount || 0).toLocaleString()} TZS
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t.status.details.purpose}</Label>
                    <p className="text-sm">{data.application.loanPurpose}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Items */}
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>{t.status.details.validation.title}</CardTitle>
                  <CardDescription>{t.status.details.validation.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Guarantors Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t.status.details.validation.guarantors}
                    </h4>
                    <div className="space-y-3">
                      {data.referees.map((referee) => (
                        <div key={referee._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div className="space-y-0.5">
                            <div className="font-medium text-sm">{referee.fullName}</div>
                            <div className="text-xs text-muted-foreground">{referee.relationship}</div>
                          </div>
                          {referee.acknowledged ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {t.status.details.validation.verified}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                              <Clock className="w-3 h-3" /> {t.status.details.validation.pending}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t.status.details.validation.documents}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.documents.length > 0 ? (
                        data.documents.map((doc) => (
                          <div key={doc._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                            <div className="bg-white p-2 rounded border">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate capitalize">{doc.type.replace("_", " ")}</div>
                              <div className="text-xs text-muted-foreground truncate">{doc.fileName}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                         <div className="col-span-2 text-sm text-muted-foreground italic">
                           {t.status.details.validation.noDocs}
                         </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

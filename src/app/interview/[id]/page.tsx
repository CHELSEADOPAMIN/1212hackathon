"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Loader2, Mic, Sparkles, Video } from "lucide-react";

type InterviewDetail = {
  _id?: string;
  status: "scheduled" | "completed";
  questions: string[];
  recordingUrl?: string;
  createdAt?: string;
  match?: {
    status?: string;
    job?: {
      title?: string;
      company?: string;
      type?: string;
      location?: string;
    } | null;
  } | null;
};

const FINAL_QUESTION = "Do you have any questions for us?";

export default function InterviewRoomPage() {
  const params = useParams<{ id: string }>();
  const interviewId = (params?.id || "") as string;
  const router = useRouter();

  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(-1);
  const [hasIntroPlayed, setHasIntroPlayed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const questions = useMemo(() => {
    const base = interview?.questions?.filter((q) => typeof q === "string" && q.trim()) || [];
    if (!base.length) return [];
    const trimmed = base.map((q) => q.trim());
    return trimmed[trimmed.length - 1] === FINAL_QUESTION ? trimmed : [...trimmed, FINAL_QUESTION];
  }, [interview?.questions]);

  const jobInfo = useMemo(() => interview?.match?.job || {}, [interview?.match]);

  const startRecorder = (stream: MediaStream) => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setError("Recording is not supported by your browser.");
      return;
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstart = () => setIsRecording(true);
    recorder.onstop = () => setIsRecording(false);
    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return new Blob();
    if (recorder.state === "inactive") {
      return new Blob(chunksRef.current, { type: "video/webm" });
    }
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    return new Blob(chunksRef.current, { type: "video/webm" });
  };

  const playSpeech = async (text: string) => {
    setIsLoadingAudio(true);
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Unable to generate speech");
      }
      const contentType = res.headers.get("Content-Type") || "audio/mpeg";
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    } finally {
      setIsSpeaking(false);
      setIsLoadingAudio(false);
    }
  };

  const handleComplete = async () => {
    if (!interviewId) return;
    try {
      setIsSubmitting(true);
      const blob = await stopRecording();
      if (!blob || blob.size === 0) {
        throw new Error("No recording captured; please check camera and microphone permissions.");
      }
      const formData = new FormData();
      formData.append("interviewId", interviewId);
      formData.append("file", blob, "interview.webm");

      const res = await fetch("/api/interview/complete", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data.error || "Upload failed");
      }
      toast.success("Interview submitted", { description: "Recording uploaded for HR review." });
      router.push("/candidate/dashboard/applications");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed.";
      setError(message);
      toast.error("Submission failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!questions.length) return;
    const isLast = currentQuestion >= questions.length - 1;
    if (isLast) {
      await handleComplete();
      return;
    }
    setCurrentQuestion((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handleExit = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    router.push("/candidate/dashboard/applications");
  };

  useEffect(() => {
    if (!interviewId) return;
    const fetchInterview = async () => {
      try {
        const res = await fetch(`/api/interview/upcoming?interviewId=${interviewId}`);
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          throw new Error(data.error || "Unable to fetch interview details");
        }
        const payload = data.data as InterviewDetail;
        if (!payload?.questions?.length) {
          throw new Error("Interview questions are not ready yet. Please try again later.");
        }
        setInterview(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load interview info";
        setError(message);
        toast.error("Load failed", { description: message });
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        startRecorder(stream);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to access camera or microphone";
        setError(message);
        toast.error("Device access denied", { description: message });
      }
    };

    setupMedia();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  useEffect(() => {
    if (!interview || !questions.length || hasIntroPlayed || interview.status !== "scheduled") return;
    const company = jobInfo?.company || "Lyrathon";
    const intro = `Hello and welcome to ${company}'s AI interview. Please keep your camera and microphone on while we begin.`;

    playSpeech(intro)
      .then(() => {
        setHasIntroPlayed(true);
        setCurrentQuestion(0);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Speech playback failed";
        toast.error("Speech playback failed", { description: message });
      });
  }, [interview, questions.length, hasIntroPlayed, jobInfo?.company]);

  useEffect(() => {
    if (!interview || !questions.length || currentQuestion < 0 || interview.status !== "scheduled") return;
    const speakQuestion = async () => {
      try {
        await playSpeech(questions[currentQuestion]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Speech playback failed";
        toast.error("Speech playback failed", { description: message });
      }
    };
    speakQuestion();
  }, [currentQuestion, interview, questions, interview?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
          <div className="flex items-center gap-3 text-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading interview room...
          </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4 px-6 text-center">
        <Sparkles className="w-10 h-10 text-amber-400" />
        <p className="text-lg font-semibold">Interview currently unavailable</p>
        <p className="text-slate-400 max-w-lg">{error || "Interview information not found. Please try again later."}</p>
        <Button onClick={() => router.push("/candidate/dashboard/applications")} className="bg-blue-600 hover:bg-blue-700">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isLastQuestion = currentQuestion >= questions.length - 1;
  const questionText =
    currentQuestion >= 0 && questions[currentQuestion] ? questions[currentQuestion] : "Please wait while we load the next question...";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-600 hover:bg-blue-600 border-0">AI Interview</Badge>
          <div>
            <p className="text-lg font-semibold">{jobInfo.title || "AI Interview"}</p>
            <p className="text-sm text-slate-400">
              {jobInfo.company || "Lyrathon"} · {jobInfo.location || "Remote"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isRecording && (
            <Badge className="bg-emerald-500 text-emerald-50 border-0">
              <span className="w-2 h-2 rounded-full bg-white inline-block mr-2 animate-ping" />
              Recording
            </Badge>
          )}
          <Button
            variant="outline"
            className="border-white/20 text-white bg-white/10 hover:bg-white/20"
            onClick={handleExit}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 px-6 pb-8">
        <Card className="bg-white/5 border-white/10 text-white shadow-2xl shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
                  AI Interviewer
                </CardTitle>
              <Badge variant="outline" className="border-white/20 text-white">
                {currentQuestion >= 0 ? `Question ${currentQuestion + 1}/${questions.length}` : "Preparing"}
              </Badge>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-2xl animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-blue-500/40 animate-ping" />
                <div className="relative h-full w-full rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Mic className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-300">AI is reading the question. Click 'Next' after answering.</p>
                <p className="text-xs text-slate-400 mt-1">
                  {isSpeaking || isLoadingAudio ? "Playing audio..." : "Ready when you are"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 min-h-[140px] flex items-center">
              <p className="text-lg leading-relaxed">{questionText}</p>
            </div>

            <Button
              size="lg"
              disabled={
                interview.status !== "scheduled" || isLoadingAudio || isSpeaking || isSubmitting || !questions.length
              }
              onClick={handleNext}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {isLastQuestion ? "Submit & Finish" : "Next Question"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

        <Card className="bg-white/5 border-white/10 text-white shadow-2xl shadow-emerald-500/10">
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-400" />
            Your Camera
          </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60">
              <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted autoPlay />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                <p className="text-xs text-slate-400">Status</p>
                <p className="font-semibold">
                  {interview.status === "scheduled" ? "Recording" : "Submitted"}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                <p className="text-xs text-slate-400">Questions</p>
                <p className="font-semibold">{questions.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                <p className="text-xs text-slate-400">Role</p>
                <p className="font-semibold">{jobInfo.title || "AI Interview"}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                <p className="text-xs text-slate-400">Company</p>
                <p className="font-semibold">{jobInfo.company || "Lyrathon"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

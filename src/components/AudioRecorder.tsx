import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadAudioRecording } from '../services/storage';
import { createRecordingMetadata } from '../services/firebaseCorpus';
import { auth } from '../services/firebase';

export type AudioSyncStatus = 'idle' | 'uploading' | 'saving_metadata' | 'synchronized' | 'failed';

interface AudioRecorderProps {
  onAudioRecorded: (audioDataUrl: string, durationSec: number, recordingId?: string) => void;
  initialAudioUrl?: string;
  onClearAudio?: () => void;
  contributionId?: string;
  contributorId?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  initialAudioUrl,
  onClearAudio,
  contributionId,
  contributorId
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | undefined>(initialAudioUrl);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<AudioSyncStatus>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setRecordedUrl(initialAudioUrl);
    if (!initialAudioUrl) {
      setSyncStatus('idle');
    }
  }, [initialAudioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setSyncStatus('idle');
    audioChunksRef.current = [];
    setDuration(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Audio recording is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedDuration = duration || 3;

        // Local data URL for instant playback preview
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setRecordedUrl(base64data);

          // Synchronize to Storage and Firestore metadata
          await syncAudioWorkflow(audioBlob, base64data, recordedDuration);
        };

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
      }, 500);

    } catch (err: unknown) {
      console.error('Error starting audio recording:', err);
      setErrorMessage(
        'Could not access microphone. Please ensure microphone permissions are granted.'
      );
      setIsRecording(false);
    }
  };

  /**
   * Executes the 2-step synchronization workflow:
   * 1. Check user authentication
   * 2. Generate unique recordingId
   * 3. Upload Blob to Firebase Storage (uploadAudioRecording)
   * 4. Create Firestore /recordings/{recordingId} metadata (createRecordingMetadata)
   * 5. Link recordingId to current contribution
   * 6. Report success only if BOTH succeed
   */
  const syncAudioWorkflow = async (
    audioBlob: Blob,
    base64data: string,
    recordedDuration: number
  ) => {
    const currentUser = auth.currentUser;
    const effectiveContributorId = contributorId || currentUser?.uid;

    // 1. Verify user is authenticated
    if (!currentUser || !effectiveContributorId || currentUser.uid !== effectiveContributorId) {
      setSyncStatus('failed');
      setErrorMessage('Audio synchronization failed: Contributor must be authenticated to sync audio to cloud.');
      onAudioRecorded(base64data, recordedDuration, undefined);
      return;
    }

    // 2. Generate unique recordingId
    const uniqueRecId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const effectiveContributionId = contributionId || `contrib_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      // 3. Upload audio Blob to Firebase Storage
      setSyncStatus('uploading');
      setErrorMessage(null);

      const uploadResult = await uploadAudioRecording(
        audioBlob,
        uniqueRecId,
        effectiveContributorId
      );

      // 4. Create Firestore /recordings/{recordingId} metadata
      setSyncStatus('saving_metadata');

      await createRecordingMetadata({
        recordingId: uniqueRecId,
        contributionId: effectiveContributionId,
        contributorId: effectiveContributorId,
        storagePath: uploadResult.storagePath,
        fileName: `${uniqueRecId}.webm`,
        mimeType: 'audio/webm',
        fileSizeBytes: audioBlob.size || (uploadResult.metadata?.size as number) || 0,
        durationSeconds: recordedDuration
      });

      // 5. Associate recordingId and report success after BOTH succeed
      setSyncStatus('synchronized');
      onAudioRecorded(base64data, recordedDuration, uniqueRecId);
    } catch (error: any) {
      console.error('Audio recording synchronization failed:', error);
      setSyncStatus('failed');
      setErrorMessage(`Audio synchronization failed: ${error?.message || 'Upload or metadata error'}`);
      onAudioRecorded(base64data, recordedDuration, undefined);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !recordedUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleClear = () => {
    if (isPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
    setRecordedUrl(undefined);
    setDuration(0);
    setSyncStatus('idle');
    setErrorMessage(null);
    if (onClearAudio) onClearAudio();
  };

  return (
    <div id="audio-recorder-widget" className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-4 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
              Audio Pronunciation & Speech Corpus
            </h4>
            <p className="text-xs text-[#888]">
              Preserve authentic spoken Indus-Kohistani pronunciation
            </p>
          </div>
        </div>

        {/* Dynamic UI Status Badges */}
        {syncStatus === 'uploading' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A66B] bg-[#C9A66B]/10 px-2.5 py-0.5 rounded-full border border-[#C9A66B]/30 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading audio...
          </span>
        )}

        {syncStatus === 'saving_metadata' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A66B] bg-[#C9A66B]/10 px-2.5 py-0.5 rounded-full border border-[#C9A66B]/30 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving recording metadata...
          </span>
        )}

        {syncStatus === 'synchronized' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Audio synchronized
          </span>
        )}

        {syncStatus === 'failed' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/60">
            <AlertCircle className="h-3.5 w-3.5" />
            Audio synchronization failed
          </span>
        )}

        {syncStatus === 'idle' && recordedUrl && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
            <CheckCircle2 className="h-3.5 w-3.5" /> Audio Ready
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-950/40 p-2.5 text-xs text-amber-300 border border-amber-800/40">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!recordedUrl && !isRecording && (
        <div className="flex items-center gap-3">
          <button
            id="start-audio-record-btn"
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-lg bg-[#C9A66B] px-4 py-2 text-xs font-semibold text-[#0C0C0C] shadow-sm hover:bg-[#D4B582] transition active:scale-95 cursor-pointer"
          >
            <Mic className="h-4 w-4" />
            Record Audio Now
          </button>
          <span className="text-xs text-[#888]">
            Click to record live native speaker pronunciation
          </span>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center justify-between rounded-lg bg-rose-950/40 p-3 border border-rose-800/40">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-rose-300">
              Recording Spoken IK... {duration}s
            </span>
          </div>
          <button
            id="stop-audio-record-btn"
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-700 transition cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop Recording
          </button>
        </div>
      )}

      {recordedUrl && !isRecording && (
        <div className="flex items-center justify-between rounded-lg bg-[#181818] p-3 border border-[#2A2A2A] shadow-xs">
          <div className="flex items-center gap-2">
            <button
              id="preview-recorded-audio-btn"
              type="button"
              onClick={togglePlayback}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A66B] text-[#0C0C0C] hover:bg-[#D4B582] transition cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <div className="text-xs">
              <p className="font-semibold text-[#E5E5E5]">Recorded Audio Clip</p>
              <p className="text-[#888]">Duration: ~{duration || '3'} seconds</p>
            </div>
            <audio
              ref={audioPlayerRef}
              src={recordedUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startRecording}
              className="text-xs font-medium text-[#C9A66B] hover:text-[#D4B582] underline px-2 cursor-pointer"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#777] hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
              title="Remove audio"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


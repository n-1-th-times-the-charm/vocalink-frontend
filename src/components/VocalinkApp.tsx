import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Editor from "@/components/Editor";
import Sidebar from "@/components/Sidebar";
import SidebarToggle from "@/components/SidebarToggle";
import { exportToDocx } from "@/lib/docx";
import axios from "axios";
import { Segment } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { generateUUID } from "@/lib/utils";
import { getUserCharacterUsage, updateUserCharacterUsage, hasExceededCharacterLimit } from "@/lib/usageTracking";
import { getUserDocuments, createDocument, updateDocument, deleteDocument, syncDocuments, Document as SupabaseDocument } from "@/lib/documentService";

interface Document {
  id: string;
  title: string;
  content?: string;
  createdAt?: Date;
  updatedAt: Date;
}

const VocalinkApp: React.FC = () => {
  const { toast } = useToast();
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [highlightedText, setHighlightedText] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [modifiedSentence, setModifiedSentence] = useState<string | undefined>(undefined);
  const [latestTranscription, setLatestTranscription] = useState("");
  const [partialTranscription, setPartialTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [characterUsage, setCharacterUsage] = useState<number>(0);
  const [previousCharacterUsage, setPreviousCharacterUsage] = useState<number>(0);
  const [reachedCharLimit, setReachedCharLimit] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const getDocumentText = () => segments.map(seg => seg.text).join(" ");
  const CHARACTER_LIMIT = 2_500;

  useEffect(() => {
    const loadCharacterUsage = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const usage = await getUserCharacterUsage();
          setCharacterUsage(usage);
          setReachedCharLimit(await hasExceededCharacterLimit());
          setPreviousCharacterUsage(usage);
        }
      } catch (error) {
        console.error("Error loading character usage:", error);
      }
    };
    loadCharacterUsage();
  }, []);

  useEffect(() => {
    const updateUsageInDB = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session && previousCharacterUsage !== characterUsage) {
          await updateUserCharacterUsage(characterUsage);
          setPreviousCharacterUsage(characterUsage);
        }
      } catch (error) {
        console.error("Error updating character usage:", error);
      }
    };
    updateUsageInDB();
  }, [characterUsage, previousCharacterUsage]);

  const trackCharacterAdded = useCallback((count: number) => {
    if (count > 0) {
      setCharacterUsage(prev => {
        const newTotal = Math.min(CHARACTER_LIMIT, prev + count);
        if (newTotal >= CHARACTER_LIMIT && prev < CHARACTER_LIMIT) {
          toast({
            title: "Character Limit Reached",
            description: "You've reached the 2500 character limit for trial accounts. Please upgrade to continue.",
            variant: "destructive",
          });
          setReachedCharLimit(true);
        }
        return newTotal;
      });
    }
  }, [CHARACTER_LIMIT]);

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }
    };
    getUserInfo();
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const userDocuments = await getUserDocuments();
        if (userDocuments.length > 0) {
          setDocuments(userDocuments);
        } else {
          try {
            const savedDocs = localStorage.getItem("aqua-voice-documents");
            if (savedDocs) {
              const parsedDocs = JSON.parse(savedDocs);
              if (Array.isArray(parsedDocs) && parsedDocs.length > 0) {
                const docsWithDates = parsedDocs.map(doc => ({
                  ...doc,
                  updatedAt: new Date(doc.updatedAt),
                  createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined
                }));
                setDocuments(docsWithDates);
                syncDocuments(docsWithDates);
              }
            }
          } catch (localError) {
            console.error("Error loading documents from localStorage:", localError);
          }
        }
      } catch (error) {
        console.error("Error loading documents from Supabase:", error);
      }
    };
    loadDocuments();
  }, []);

  useEffect(() => {
    const saveDocuments = async () => {
      try {
        await syncDocuments(documents);
      } catch (error) {
        console.error("Error saving documents to database:", error);
        toast({
          title: "Storage Error",
          description: "Could not save documents to database. Your changes may not persist.",
          variant: "destructive",
        });
      }
    };
    saveDocuments();
  }, [documents]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initWebSocket = async () => {
    const SAMPLE_RATE = 16000;
    let token = "";
    try {
      try {
        const response = await axios.get("https://api.vocalink.chat/get-token", {
          timeout: 5000
        });
        token = response.data.token;
        console.log("Realtime token from local API:", token);
      } catch (localError) {
        console.log("Local API call failed, trying external API...");
        const response = await axios.get("https://api.vocalink.chat/get-token", { 
          timeout: 5000,
          headers: {"Access-Control-Allow-Origin": "*"}
        });
        token = response.data.token;
        console.log("Realtime Token from external API:", token);
      }
    } catch (error) {
      console.error("Error fetching token:", error);
      toast({
        title: "Recording Unavailable",
        description: "Could not connect to the server. Recording function may be unavailable.",
        variant: "destructive",
        duration: 5000,
      });
      setIsRecording(false);
      return;
    }
    if (!token) {
      console.error("Failed to get a valid token");
      return;
    }
    const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${SAMPLE_RATE}&token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    socket.onmessage = (message) => {
      try {
        const res = JSON.parse(message.data);
        if (res.message_type === "PartialTranscript") {
          if (res.text && res.text.trim() !== "") {
            console.log("Received partial transcript:", res.text);
            setPartialTranscription(res.text);
          }
        } else if (res.message_type === "FinalTranscript") {
          if (res.text && res.text.trim() !== "") {
            console.log("Received final transcript:", res.text);
            const currentTextLength = segments.map(seg => seg.text).join(" ").length;
            const newTextLength = currentTextLength + res.text.length;
            if (newTextLength > CHARACTER_LIMIT) {
              const availableChars = Math.max(0, CHARACTER_LIMIT - currentTextLength);
              if (availableChars <= 0) {
                toast({
                  title: "Character Limit Reached",
                  description: "You've reached the 2500 character limit for trial accounts. Please upgrade to continue.",
                  variant: "destructive",
                });
                setReachedCharLimit(true);
                if (isRecording) {
                  handleStopRecording();
                }
                return;
              }
              const truncatedText = res.text.substring(0, availableChars);
              
              setSegments((prev) => {
                const oldContent = prev.map(seg => seg.text).join(" ");
                if (prev.length > 0 && prev[prev.length - 1].text === "") {
                  const updatedSegment: Segment = { ...prev[prev.length - 1], text: truncatedText, styles: {} };
                  streamWebResponse(updatedSegment, oldContent);
                  return [...prev.slice(0, prev.length - 1), updatedSegment];
                } else {
                  const newSegment: Segment = { id: generateUUID(), text: truncatedText, styles: {} };
                  streamWebResponse(newSegment, oldContent);
                  return [...prev, newSegment];
                }
              });
              setPartialTranscription("");
              setReachedCharLimit(true);
              toast({
                title: "Character Limit Reached",
                description: "You've reached the 2500 character limit for trial accounts. Please upgrade to continue.",
                variant: "destructive",
              });
              if (isRecording) {
                handleStopRecording();
              }
              setCharacterUsage(CHARACTER_LIMIT);
            } else {
              setSegments((prev) => {
                const oldContent = prev.map(seg => seg.text).join(" ");
                if (prev.length > 0 && prev[prev.length - 1].text === "") {
                  const updatedSegment: Segment = { ...prev[prev.length - 1], text: res.text, styles: {} };
                  streamWebResponse(updatedSegment, oldContent);
                  return [...prev.slice(0, prev.length - 1), updatedSegment];
                } else {
                  const newSegment: Segment = { id: generateUUID(), text: res.text, styles: {} };
                  streamWebResponse(newSegment, oldContent);
                  return [...prev, newSegment];
                }
              });
              setPartialTranscription("");
              setCharacterUsage((prev) => {
                const newTotal = Math.min(CHARACTER_LIMIT, prev + res.text.length);
                if (newTotal >= CHARACTER_LIMIT && prev < CHARACTER_LIMIT) {
                  toast({
                    title: "Character Limit Reached",
                    description: "You've reached the 2500 character limit for trial accounts. Please upgrade to continue.",
                    variant: "destructive",
                  });
                  setReachedCharLimit(true);
                  if (isRecording) {
                    handleStopRecording();
                  }
                }
                return newTotal;
              });
            }
          }
        } else {
          console.log("Ignoring message type:", res.message_type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
    };
    socket.onclose = (event) => {
      console.log("WebSocket closed:", event);
      setTimeout(() => {
        console.log("Reconnecting WebSocket...");
        initWebSocket();
      }, 3000);
    };
  };

  useEffect(() => {
    initWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording && partialTranscription.trim() !== "") {
      console.log("Finalizing leftover partial transcript:", partialTranscription);
      setLatestTranscription((prev) => prev + partialTranscription + " ");
      setPartialTranscription("");
    }
  }, [isRecording, partialTranscription]);

  const convertFloat32ToInt16 = (buffer: Float32Array) => {
    const len = buffer.length;
    const buf = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf.buffer;
  };

  const streamWebResponse = async (newSegment: Segment, context: string) => {
    try {
      console.log("Streaming response to FastAPI with context:", context);
      const response = await fetch("https://api.vocalink.chat/api/stream/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newSegment.text, current_file_state: context }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText: any = "";
      let expertMode = "";
      if (!reader) {
        throw new Error("Failed to read stream.");
      }
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        console.log("Received chunk:", chunk);
        chunk.trim().split("\n").forEach((line) => {
          try {
            const { expert, output } = JSON.parse(line);
            if (output) {
              console.log("Streamed output:", output);
              accumulatedText += output;
              expertMode = expert;
            }
          } catch (err) {
            console.error("Error parsing JSON:", err);
          }
        });
      }
      console.log("Final streamed text:", accumulatedText);
      accumulatedText = accumulatedText.split('\n');
      if (accumulatedText.length > 1) {
        accumulatedText = accumulatedText.join('<br>');
      } else {
        accumulatedText = accumulatedText[0];
      }
      if (expertMode === "modify") {
        setSegments((prevSegments) => {
          const idx = prevSegments.findIndex((seg) => seg.id === newSegment.id);
          if (idx === -1) return prevSegments;
          const startIdx = Math.max(0, idx - 2);
          const mergedSegment = { id: generateUUID(), text: accumulatedText, styles: {} };
          return [
            ...prevSegments.slice(0, startIdx),
            mergedSegment,
            ...prevSegments.slice(idx + 1),
          ];
        });
      } else if (expertMode === "execute") {
        console.log(segments);
        setSegments([{ id: generateUUID(), text: accumulatedText, styles: {} }]);
      } else if (expertMode === "transcribe") {}
    } catch (error) {
      console.error("Error streaming response:", error);
    }
  };

  const handleNewDocument = () => {
    setDocumentTitle("Untitled Document");
    setSegments([]);
    setCurrentDocumentId(null);
    toast({
      title: "New Document Created",
      description: "You can now start editing your new document.",
    });
  };

  const handleStartRecording = async () => {
    if (reachedCharLimit) {
      toast({
        title: "Character Limit Reached",
        description: "You've reached the 2500 character limit for trial accounts. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      await audioContext.audioWorklet.addModule("/worklets/pcm-processor.v2.js");
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNodeRef.current = workletNode;
      workletNode.port.onmessage = (event) => {
        const inputData = event.data;
        const pcmData = convertFloat32ToInt16(inputData);
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(pcmData);
        }
      };
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      setIsRecording(true);
      setHighlightedText("");
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone.",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Failed to Start Recording",
        description: "Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    toast({
      title: "Recording Stopped",
      description: "You can now edit your document.",
    });
  };

  const handleSaveDocument = async () => {
    try {
      const now = new Date();
      const contentToSave = getDocumentText();
      if (!contentToSave || contentToSave.trim() === "") {
        toast({
          title: "Empty Document",
          description: "Cannot save an empty document. Please add some content first.",
          variant: "destructive",
        });
        return;
      }
      try {
        if (currentDocumentId) {
          const updateResult = await updateDocument(currentDocumentId, {
            title: documentTitle,
            content: contentToSave,
            updatedAt: now
          });
          if (updateResult) {
            setDocuments(prev => 
              prev.map(doc => doc.id === currentDocumentId ? 
                { ...doc, title: documentTitle, content: contentToSave, updatedAt: now } : doc
              )
            );
          }
        } else {
          const newDocId = generateUUID();
          const newDoc = {
            id: newDocId,
            title: documentTitle,
            content: contentToSave,
            createdAt: now,
            updatedAt: now
          };
          const createResult = await createDocument(newDoc);
          if (createResult) {
            setDocuments(prev => [...prev, newDoc]);
            setCurrentDocumentId(newDocId);
          }
        }
        toast({
          title: "Document Saved",
          description: "Your document has been saved successfully.",
        });
      } catch (storageError) {
        console.error("Supabase storage error:", storageError);
        toast({
          title: "Storage Error",
          description: "Could not save to Supabase. Your changes may not persist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your document.",
        variant: "destructive",
      });
    }
  };

  const handleExportDocument = async () => {
    try {
      await exportToDocx({ title: documentTitle, segments });
      toast({
        title: "Document Exported",
        description: "Your document has been downloaded.",
      });
    } catch (error) {
      console.error("Failed to export document:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your document.",
        variant: "destructive",
      });
    }
  };

  const handleSelectDocument = (document: Document) => {
    setDocumentTitle(document.title);
    setSegments([{ id: generateUUID(), text: document.content, styles: {} }]);
    setCurrentDocumentId(document.id);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
      if (documentId === currentDocumentId) {
        setDocumentTitle("Untitled Document");
        setSegments([]);
        setCurrentDocumentId(null);
      }
      toast({
        title: "Document Deleted",
        description: "The document has been removed.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in">
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col relative">
        <Header
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onSave={handleSaveDocument}
          onExport={handleExportDocument}
          documentTitle={documentTitle}
          onTitleChange={setDocumentTitle}
          onToggleSidebar={toggleSidebar}
        />
        <div className="flex flex-1 overflow-hidden relative mt-4 items-start min-h-0">
          {isSidebarExpanded && (
            <div 
              className="fixed inset-0 bg-black/30 z-30 md:hidden" 
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}
          <div className={`hidden md:block transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-0'}`}>
            {isSidebarExpanded && (
              <Sidebar
                userEmail={userEmail}
                charsUsed={characterUsage}
                documents={documents}
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
                onNewDocument={handleNewDocument}
                onLogout={handleLogout}
              />
            )}
          </div>
          <aside 
            className={`
              fixed md:hidden left-0 z-40
              w-[280px] bg-card 
              transform transition-transform duration-300 ease-in-out
              ${isSidebarExpanded ? 'translate-x-0' : '-translate-x-full'}
              flex flex-col
              overflow-hidden
              border shadow-md
              mobile-sidebar
            `}
            style={{ 
              top: '0',
              bottom: '4rem',
              height: '100%',
              borderTopRightRadius: '1rem',
              borderBottomRightRadius: '1rem'
            }}
          >
            <Sidebar
              userEmail={userEmail}
              charsUsed={characterUsage}
              documents={documents}
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={handleDeleteDocument}
              onNewDocument={handleNewDocument}
              onLogout={handleLogout}
            />
          </aside>
          <main className="flex-1 flex flex-col overflow-hidden md:ml-4 min-h-0">
            <div className="flex-1 min-h-0">
              <Editor
                segments={segments}
                onSegmentsChange={setSegments}
                isRecording={isRecording}
                onExport={handleExportDocument}
                partialTranscript={partialTranscription}
                setSegments={setSegments}
                reachedCharLimit={reachedCharLimit}
                trackCharacterAdded={trackCharacterAdded}
              />
            </div>
          </main>
        </div>
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex justify-around items-center z-40 mobile-bottom-bar">
          <button 
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M9 3v18" />
            </svg>
            <span className="text-xs mt-1">Documents</span>
          </button>
          <button 
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`flex flex-col items-center justify-center p-2 rounded-md ${isRecording ? 'text-red-500' : 'hover:bg-muted'}`}
          >
            {isRecording ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 12a6 6 0 0 1-12 0v-4a6 6 0 0 1 12 0v4" />
                  <path d="M6 12v-2a6 6 0 0 1 12 0v2" />
                  <line x1="6" y1="8" x2="6" y2="8" />
                  <line x1="18" y1="8" x2="18" y2="8" />
                  <line x1="12" y1="20" x2="12" y2="20" />
                </svg>
                <span className="text-xs mt-1">Stop</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span className="text-xs mt-1">Record</span>
              </>
            )}
          </button>
          <button 
            onClick={handleSaveDocument}
            className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span className="text-xs mt-1">Save</span>
          </button>
          <button 
            onClick={handleExportDocument}
            className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="text-xs mt-1">Export</span>
          </button>
        </div>
        <div className="h-16 md:h-0 block md:hidden"></div>
      </div>
      <div className="text-center text-xs text-muted-foreground py-4 hidden md:block bg-background">
        Made with 💙 by
        <a href="https://www.linkedin.com/in/huzaifakhan04/" target="_blank" rel="noopener noreferrer" className="text-blue-500"> Huzaifa Khan</a>,
        <a href="https://www.linkedin.com/in/hashim-muhammad-nadeem4/" target="_blank" rel="noopener noreferrer" className="text-blue-500"> Hashim M. Nadeem</a>, and
        <a href="https://www.linkedin.com/in/ibrahim-akhtar-ab543823b/" target="_blank" rel="noopener noreferrer" className="text-blue-500"> Ibrahim Akhtar</a>.
      </div>
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <SidebarToggle
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
        />
      </div>
    </div>
  );
}

export default VocalinkApp;
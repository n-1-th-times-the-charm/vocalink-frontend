import React, { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import Toolbar from "./Toolbar";
import { Segment } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

interface EditorProps {
  segments: Segment[];
  onSegmentsChange: (segments: Segment[]) => void;
  isRecording: boolean;
  onExport?: () => void;
  partialTranscript: string;
  setSegments: any;
  reachedCharLimit?: boolean;
  trackCharacterAdded?: (count: number) => void;
}

const Editor: React.FC<EditorProps> = ({
  segments,
  onSegmentsChange,
  isRecording,
  onExport,
  partialTranscript,
  reachedCharLimit,
  trackCharacterAdded,
}) => {
  const { toast } = useToast();
  const mergedText = useMemo(() => segments.map(s => s.text).join(" "), [segments]);
  const editor = useEditor({
    extensions: [StarterKit, Underline, Highlight],
    content: mergedText,
    editable: !isRecording && !reachedCharLimit,
    editorProps: { attributes: { class: 'focus:outline-none' } },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      if (reachedCharLimit) {
        toast({ 
          title: "Character Limit Reached", 
          description: "You've reached the 2500 character limit for trial accounts. Please upgrade to continue.", 
          variant: "destructive" 
        });
        editor.commands.undo();
        return;
      }
      if (trackCharacterAdded) {
        const delta = text.length - mergedText.length;
        if (delta > 0) trackCharacterAdded(delta);
      }
      onSegmentsChange([{ id: segments[0]?.id || generateUUID(), text, styles: {} }]);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isRecording && !reachedCharLimit);
    }
  }, [reachedCharLimit, isRecording, editor]);

  useEffect(() => {
    if (!editor) return;
    if (editor.getText() !== mergedText) {
      editor.commands.setContent(mergedText);
    }
  }, [mergedText, editor]);

  useEffect(() => {
    if (!editor) return;
    if (isRecording && partialTranscript) {
      const html = mergedText +
        `<span class=\"text-blue-500 transition-colors duration-1000\" data-partial>${partialTranscript}</span>`;
      editor.commands.setContent(html, false);
    }
  }, [partialTranscript, isRecording, editor, mergedText]);

  const handleBold = () => editor?.chain().focus().toggleBold().run();
  const handleItalic = () => editor?.chain().focus().toggleItalic().run();
  const handleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const handleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const handleNumberedList = () => editor?.chain().focus().toggleOrderedList().run();
  const handleHighlight = () => editor?.chain().focus().toggleHighlight().run();
  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const wordCount = countWords(mergedText);
  return (
    <Card className="rounded-lg bg-white shadow-md border w-full h-full flex flex-col">
      <Toolbar
        isBold={editor?.isActive("bold") || false}
        isItalic={editor?.isActive("italic") || false}
        isUnderline={editor?.isActive("underline") || false}
        isBulletList={editor?.isActive("bulletList") || false}
        isNumberedList={editor?.isActive("orderedList") || false}
        isHighlighting={editor?.isActive("highlight") || false}
        onBold={handleBold}
        onItalic={handleItalic}
        onUnderline={handleUnderline}
        onBulletList={handleBulletList}
        onNumberedList={handleNumberedList}
        onHighlight={handleHighlight}
        onExport={onExport}
        wordCount={wordCount}
      />
      <div className="p-4 flex-1 overflow-auto focus:outline-none" data-network-safe="true">
        <EditorContent editor={editor} />
      </div>
    </Card>
  );
};

export default Editor;
import { json, type MetaFunction } from '@remix-run/cloudflare';
import React, { useState } from 'react';
import { loadModel, runModel } from '~/lib/llamaLocal';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setOutputText(""); // Clear previous output
    try {
      const buffer = await file.arrayBuffer();
      await loadModel(buffer);
      setModelLoaded(true);
      alert("تم تحميل نموذج gguf بنجاح");
    } catch (err: any) {
      // It's good practice to log the error for debugging
      console.error("Error loading model:", err);
      alert("فشل تحميل النموذج: " + (err instanceof Error ? err.message : String(err)));
      setModelLoaded(false);
    }
    setLoading(false);
  };

  const handleRun = async () => {
    if (!inputText.trim()) {
      alert("يرجى إدخال نص.");
      return;
    }
    if (!modelLoaded) {
      alert("يرجى رفع نموذج gguf أولاً.");
      return;
    }
    setLoading(true);
    try {
      const response = await runModel(inputText);
      setOutputText(response);
    } catch (err: any) {
      // Log the error for debugging
      console.error("Error running model:", err);
      alert("خطأ في تشغيل النموذج: " + (err instanceof Error ? err.message : String(err)));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      {/* Start of GGUF local model feature section */}
      <div
        className="p-4 flex flex-col gap-4 items-center w-full font-sans"
      >
        <h1 className="text-xl sm:text-2xl mb-4">
          bolt.diy مع دعم نموذج gguf محلي
        </h1>

        <input
          type="file"
          accept=".gguf"
          onChange={handleFileUpload}
          disabled={loading}
          className="w-[90%] max-w-sm sm:max-w-md p-2 text-sm sm:text-base box-border rounded border border-gray-300"
        />

        <textarea
          placeholder="أدخل النص هنا"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          className="w-[90%] max-w-sm sm:max-w-md text-sm sm:text-base p-2 rounded border border-gray-300 box-border"
        />

        <button
          onClick={handleRun}
          disabled={loading}
          className="w-[90%] max-w-sm sm:max-w-md p-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          {loading ? "جارِ التشغيل..." : "تشغيل النموذج"}
        </button>

        {outputText && (
          <pre
            className="w-[90%] max-w-sm sm:max-w-md bg-gray-100 p-3 sm:p-4 rounded whitespace-pre-wrap text-xs sm:text-sm mt-4 box-border"
          >
            {outputText}
          </pre>
        )}
      </div>
      {/* End of GGUF local model feature section */}
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}

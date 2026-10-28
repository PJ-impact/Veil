import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  History,
  Plus,
  Trash2,
  Clock,
  X,
  MessageSquare,
} from 'lucide-react';
import type { ChatMessage, Conversation, DocumentRecord, EvidenceCitation } from '../../types/index.ts';
import { useToast } from '../../context/ToastContext.tsx';

interface DocumentChatProps {
  documents: DocumentRecord[];
  selectedDocIds: string[];
  onOpenCitation: (citation: EvidenceCitation) => void;
  onNavigateToLibrary: () => void;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  documents,
  selectedDocIds,
  onOpenCitation,
  onNavigateToLibrary,
}) => {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('default-conv');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      conversationId: 'default-conv',
      role: 'assistant',
      content:
        'Welcome to Veil. I am your grounded document intelligence assistant. Ask questions about your scoped documents. Every factual claim is verified against exact passage references.',
      timestamp: new Date().toISOString(),
      groundingStatus: 'grounded',
      modelUsed: 'gemma',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scopedDocs = documents.filter((d) => selectedDocIds.includes(d.id));

  // Load conversations from backend
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/v1/conversations');
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
        // If current conversation exists in stored data, sync its messages
        const current = data.find((c) => c.id === activeConvId);
        if (current && current.messages.length > 0) {
          setMessages(current.messages);
        }
      }
    } catch (e) {
      console.error('Failed loading conversations', e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const currentId = activeConvId;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      conversationId: currentId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentId,
          message: text,
          selectedDocumentIds: selectedDocIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error (${response.status})`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        conversationId: currentId,
        role: 'assistant',
        content: data.content,
        citations: data.citations || [],
        groundingStatus: data.groundingStatus || 'grounded',
        modelUsed: data.modelUsed || 'gemma',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh conversation list to update titles/counts
      loadConversations();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversationId: currentId,
          role: 'assistant',
          content: `Failed to query model: ${err.message}. Ensure backend is running.`,
          timestamp: new Date().toISOString(),
          groundingStatus: 'unsupported_warning',
          modelUsed: 'local-guard',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a fresh new chat session
  const handleNewChat = () => {
    const newId = `conv-${Date.now().toString(36)}`;
    setActiveConvId(newId);
    setMessages([
      {
        id: `welcome-${newId}`,
        conversationId: newId,
        role: 'assistant',
        content: 'New grounded chat session started. Ask any question about your selected documents.',
        timestamp: new Date().toISOString(),
        groundingStatus: 'grounded',
        modelUsed: 'gemma',
      },
    ]);
    setShowHistoryDrawer(false);
    toast.info('Started a new conversation session.');
  };

  // Select a past conversation from history
  const handleSelectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(
      conv.messages.length > 0
        ? conv.messages
        : [
            {
              id: `welcome-${conv.id}`,
              conversationId: conv.id,
              role: 'assistant',
              content: 'Resumed conversation session.',
              timestamp: new Date().toISOString(),
              groundingStatus: 'grounded',
              modelUsed: 'gemma',
            },
          ]
    );
    setShowHistoryDrawer(false);
    toast.info(`Loaded chat: "${conv.title}"`);
  };

  // Delete a saved conversation
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        toast.info('Conversation deleted.');
        if (activeConvId === id) {
          handleNewChat();
        }
      }
    } catch (e: any) {
      toast.error(`Delete error: ${e.message}`);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        conversationId: activeConvId,
        role: 'assistant',
        content: 'Conversation messages cleared. What would you like to examine in your document scope?',
        timestamp: new Date().toISOString(),
        groundingStatus: 'grounded',
        modelUsed: 'gemma',
      },
    ]);
    toast.info('Cleared current message view.');
  };

  // Demo A Suggested Questions
  const sampleQuestions = [
    {
      title: 'Purchase Price & Escrow',
      query: 'What is the aggregate purchase price and escrow reserve amount?',
    },
    {
      title: 'Closing Date & Law',
      query: 'When is the closing scheduled and what is the governing jurisdiction?',
    },
    {
      title: 'Executive Salary (Elena)',
      query: 'What is the base salary and annual bonus for Dr. Elena Rostova?',
    },
    {
      title: 'Test Evidence Gap (Demo A)',
      query: 'What are the environmental remediation liabilities and hazardous waste clauses?',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] bg-slate-50/50 relative overflow-hidden">
      {/* Top Scope & History Status Bar */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800">Active Scope:</span>
          {scopedDocs.length === 0 ? (
            <span className="text-amber-700 font-medium">
              No documents selected (Assistant will decline out-of-scope queries)
            </span>
          ) : (
            <span className="text-slate-600 font-medium truncate max-w-sm">
              {scopedDocs.length === 1
                ? `"${scopedDocs[0].title}" (${scopedDocs[0].pageCount} pages)`
                : `${scopedDocs.length} documents selected (${scopedDocs.reduce(
                    (acc, d) => acc + d.pageCount,
                    0
                  )} total pages)`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* History Drawer Toggle Button */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              showHistoryDrawer
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Browse past conversations"
          >
            <History className="w-3.5 h-3.5" />
            <span>Chat History</span>
            {conversations.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-mono">
                {conversations.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
            title="Start a new chat session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          <span className="text-slate-300">·</span>

          <button
            onClick={onNavigateToLibrary}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            Change Scope
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={handleResetConversation}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Body with Slide-out Conversation History Drawer */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Slide-out History Drawer */}
        {showHistoryDrawer && (
          <div className="absolute inset-y-0 left-0 w-80 bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <span className="font-semibold text-xs text-slate-900">Saved Conversations</span>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Conversation</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No saved conversations yet.</p>
                  <p className="text-[11px] mt-1 text-slate-400">Conversations save automatically to local disk.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`group flex items-start justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      conv.id === activeConvId
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold truncate">{conv.title || 'Untitled Conversation'}</div>
                      <div
                        className={`text-[10px] mt-0.5 flex items-center gap-2 ${
                          conv.id === activeConvId ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        <span>{conv.messages.length} message(s)</span>
                        <span>·</span>
                        <span>{new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className={`p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-600 transition-all ${
                        conv.id === activeConvId ? 'text-slate-300' : 'text-slate-400'
                      }`}
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                {/* Assistant header tags */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                      <span>{msg.modelUsed || 'Gemma'}</span>
                    </div>

                    {msg.groundingStatus === 'grounded' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Supported by Document Passages</span>
                      </span>
                    ) : msg.groundingStatus === 'insufficient_evidence' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Evidence Gap Acknowledged</span>
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Main Text Content */}
                <p className="whitespace-pre-wrap select-text">{msg.content}</p>

                {/* Citations list for assistant claims */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-slate-500" />
                      <span>Verifiable Evidence Citations</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite) => (
                        <button
                          key={cite.id}
                          onClick={() => onOpenCitation(cite)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer group text-left"
                        >
                          <span className="font-mono font-bold text-slate-900">
                            [{cite.citationIndex}]
                          </span>
                          <span className="truncate max-w-[150px]">
                            Page {cite.pageNumber || 1}: {cite.sectionHeading || 'Passage'}
                          </span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic max-w-2xl bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <Sparkles className="w-4 h-4 text-slate-700 animate-spin" />
              <span>Scanning scoped passages and verifying grounded citations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Test Questions Bar (For Demo A verification) */}
      <div className="px-6 py-2 bg-slate-100/70 border-t border-slate-200 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-[11px]">
          <span className="text-slate-500 font-semibold shrink-0">Demo A Prompts:</span>
          {sampleQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sq.query)}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {sq.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center gap-3"
        >
          <input
            type="text"
            placeholder={
              scopedDocs.length === 0
                ? 'Select documents in the sidebar or library to enable grounded chat...'
                : `Ask a question grounded in ${scopedDocs.length} scoped document(s)...`
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};

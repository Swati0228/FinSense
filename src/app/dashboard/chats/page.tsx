"use client";

import { useState, useRef, useEffect } from "react";
import { 
  FiMessageSquare, 
  FiPieChart, 
  FiDollarSign, 
  FiSettings, 
  FiSend, 
  FiPaperclip 
} from "react-icons/fi";

export default function ChatsPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to FinSense support. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end",
      inline: "nearest"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "Thank you for your message! Our support team will get back to you shortly. Is there anything specific about your FinSense experience you'd like help with?",
        sender: "bot" as const,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200 pt-8 pb-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 mt-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30 flex items-center justify-center text-white text-2xl tracking-tighter ring-4 ring-teal-50">
              <FiMessageSquare strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Support Hub</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">We're here to help you get the most out of FinSense.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Support Online</span>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 scroll-smooth" id="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-6 py-4 rounded-3xl shadow-sm ${
                    message.sender === "user"
                      ? "bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold mt-2 ${
                      message.sender === "user" ? "text-teal-100" : "text-slate-400"
                    }`}
                  >
                    {isMounted ? message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : ""}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-sm px-6 py-4 shadow-sm">
                  <div className="flex items-center gap-1.5 h-5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to FinSense support..."
                  className="w-full pl-5 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                  onClick={() => {
                    // Placeholder for file attachment
                  }}
                  aria-label="Attach File"
                >
                  <FiPaperclip size={20} />
                </button>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl p-4 shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Send Message"
              >
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 text-center">Need instant answers? Check out quick help below</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-4 text-left p-5 rounded-2xl bg-white border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiPieChart size={20} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 mb-1">Expense Tracking</span>
                <span className="text-xs font-medium text-slate-500">Help with adding limits</span>
              </div>
            </button>
            
            <button className="flex items-center gap-4 text-left p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiDollarSign size={20} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 mb-1">Budget Planning</span>
                <span className="text-xs font-medium text-slate-500">Set up monthly goals</span>
              </div>
            </button>
            
            <button className="flex items-center gap-4 text-left p-5 rounded-2xl bg-white border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiSettings size={20} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 mb-1">Account Settings</span>
                <span className="text-xs font-medium text-slate-500">Profile and security</span>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
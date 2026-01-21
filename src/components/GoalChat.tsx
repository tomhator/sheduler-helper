"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, X, Loader2 } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
}

export default function GoalChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "bot", content: "안녕하세요! 어떤 목표를 이루고 싶으신가요? 제가 세부 단계로 쪼개드릴게요." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/generate-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal: input, messages: messages }),
            });

            const data = await response.json();

            if (data.message) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "bot",
                    content: data.message
                };
                setMessages(prev => [...prev, botMsg]);

                // If tasks are generated, we could pass them back to a parent state or store
                console.log("Generated tasks:", data.tasks);
            }
        } catch (error) {
            console.error("Failed to fetch:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: "죄송해요, 잠시 문제가 생겼어요. 다시 말씀해주시겠어요?"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-background flex flex-col max-w-md mx-auto"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-md">
                        <div>
                            <h2 className="font-bold text-lg text-foreground">AI Goal Planner</h2>
                            <p className="text-xs text-foreground/40">목표를 현실로 만들어보세요</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-muted"}`}>
                                        {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-primary text-white rounded-tr-none"
                                            : "bg-muted/50 text-foreground rounded-tl-none shadow-sm"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="flex gap-2 max-w-[85%] flex-row">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/50 text-foreground rounded-tl-none shadow-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-xs font-medium">생각 중...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border bg-card/50 backdrop-blur-md pb-8">
                        <div className="flex gap-2 bg-muted/50 p-2 rounded-2xl border border-border focus-within:border-primary transition-colors">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                placeholder="어떤 일을 시작해볼까요?"
                                className="flex-1 bg-transparent px-2 py-1 outline-none text-sm text-foreground"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-2 bg-primary text-white rounded-xl disabled:opacity-50 transition-opacity"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

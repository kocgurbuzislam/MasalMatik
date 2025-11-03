import React, { useState, useCallback, useEffect } from 'react';
import { generateStoryAndImage } from './services/geminiService';
import { saveStory, getAllStories, deleteStory, getTodayStoryCount, DAILY_STORY_LIMIT } from './services/storageService';
import { Story } from './types';
import { MagicWandIcon, BookOpenIcon, SparklesIcon, HistoryIcon, TrashIcon } from './components/icons';

const Header: React.FC<{ onHistoryClick: () => void; showBackButton?: boolean; onBackClick?: () => void }> = ({ onHistoryClick, showBackButton, onBackClick }) => (
    <header className="w-full text-center p-6 relative animate-fade-in-up">
        {showBackButton && onBackClick && (
            <button
                onClick={onBackClick}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 glass rounded-full p-3 text-slate-700 hover:bg-white/40 transition-all duration-300 hover:scale-110 shadow-lg"
                aria-label="Geri"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        )}
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 drop-shadow-lg flex items-center justify-center gap-3 animate-float">
            <span className="text-5xl md:text-6xl">✨</span>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
            Sihirli Hikayeler
            </span>
            <span className="text-5xl md:text-6xl">✨</span>
        </h1>
        {!showBackButton && (
            <button
                onClick={onHistoryClick}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 glass rounded-full p-3 text-slate-700 hover:bg-white/40 transition-all duration-300 hover:scale-110 shadow-lg"
                aria-label="Geçmiş Hikayeler"
                title="Geçmiş Hikayeler"
            >
                <HistoryIcon className="w-6 h-6" />
            </button>
        )}
    </header>
);

const StoryForm: React.FC<{
    onSubmit: (prompt: string) => void;
    isLoading: boolean;
    todayCount: number;
    dailyLimit: number;
}> = ({ onSubmit, isLoading, todayCount, dailyLimit }) => {
    const [prompt, setPrompt] = useState('');
    const suggestions = ["cesur bir sincap", "kaybolan yıldız", "konuşan bir bulut", "sihirli bir orman"];
    const remaining = dailyLimit - todayCount;
    const isLimitReached = remaining <= 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isLimitReached) {
            onSubmit(prompt);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (!isLimitReached) {
        setPrompt(suggestion);
        onSubmit(suggestion);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-6 md:p-8 glass-strong rounded-3xl shadow-2xl animate-fade-in-up">
            <div className={`mb-6 p-4 rounded-2xl border transition-all duration-300 ${
                isLimitReached 
                    ? 'bg-gradient-to-r from-rose-50/80 to-pink-50/80 border-rose-200/50 shadow-md' 
                    : 'bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-cyan-50/80 border-emerald-200/50 shadow-md'
            }`}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        Günlük Limit:
                    </span>
                    <span className={`text-sm font-black px-3 py-1.5 rounded-full ${
                        isLimitReached 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-700'
                    }`}>
                        {remaining} / {dailyLimit}
                    </span>
                </div>
                {isLimitReached && (
                    <p className="text-xs text-rose-600 mt-3 text-center font-semibold animate-pulse">
                        ⏰ Bugünlük limit doldu. Yarın tekrar deneyebilirsiniz!
                    </p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
                <label htmlFor="prompt" className="block text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Ne hakkında bir hikaye istersin?
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Örn: Uzayda macera yaşayan bir kedi..."
                    className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 resize-none text-slate-700 placeholder-slate-400 text-base font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || isLimitReached}
                />
                <button
                    type="submit"
                    className={`w-full mt-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/25 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg relative overflow-hidden ${
                        !isLoading && !isLimitReached && 'hover:shadow-2xl hover:shadow-indigo-500/40'
                    }`}
                    disabled={isLoading || !prompt.trim() || isLimitReached}
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></span>
                    <MagicWandIcon className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">
                        {isLimitReached ? '⏰ Günlük Limit Doldu' : isLoading ? '✨ Oluşturuluyor...' : '✨ Hikayeyi Oluştur'}
                    </span>
                </button>
            </form>
             <div className="mt-6">
                <p className="text-sm text-slate-600 font-semibold mb-3 text-center flex items-center justify-center gap-2">
                    <span>💡</span>
                    Ya da bunlardan birini seç:
                </p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading || isLimitReached}
                            className="bg-white text-slate-700 text-sm font-semibold py-2.5 px-5 rounded-full hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LoadingScreen: React.FC = () => (
    <div className="w-full max-w-lg mx-auto p-8 glass-strong rounded-3xl shadow-2xl text-center animate-fade-in-up">
        <div className="space-y-6">
            <div className="relative">
                <SparklesIcon className="w-20 h-20 mx-auto text-indigo-500 animate-float" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    ✨ Hikayen hazırlanıyor...
                </h2>
                <p className="text-slate-600 text-base font-medium">
                    Sihirli kelimeler bir araya geliyor ve resimler çiziliyor. Lütfen bekle...
                </p>
            </div>
            <div className="flex justify-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    </div>
);

const StoryDisplay: React.FC<{ story: Story; onReset: () => void; onDelete?: () => void }> = ({ story, onReset, onDelete }) => (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 glass-strong rounded-3xl shadow-2xl animate-fade-in-up">
        <div className="bg-gradient-to-br from-white to-indigo-50/20 rounded-2xl shadow-inner p-6 md:p-8 border border-slate-100">
            {story.imageUrl && (
                <div className="relative mb-6 rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200/50">
                    <img 
                        src={story.imageUrl} 
                        alt="Hikaye Resmi" 
                        className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
            )}
            <div className="prose prose-lg max-w-none">
                <p className="text-slate-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                    {story.text}
                </p>
            </div>
        </div>
        <div className="flex gap-3 mt-6">
        <button
            onClick={onReset}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-base"
        >
                <MagicWandIcon className="w-5 h-5" />
            Yeni Bir Hikaye Oluştur
        </button>
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-4 px-5 rounded-2xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                    aria-label="Sil"
                    title="Hikayeyi Sil"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    </div>
);

type View = 'home' | 'story' | 'history';

export default function App() {
    const [view, setView] = useState<View>('home');
    const [story, setStory] = useState<Story | null>(null);
    const [savedStories, setSavedStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [todayCount, setTodayCount] = useState(0);

    const loadSavedStories = useCallback(async () => {
        const stories = await getAllStories();
        setSavedStories(stories);
        const count = await getTodayStoryCount();
        setTodayCount(count);
    }, []);

    useEffect(() => {
        loadSavedStories();
    }, [loadSavedStories]);

    const handleGenerateStory = useCallback(async (prompt: string) => {
        // Check daily limit before generating
        const currentCount = await getTodayStoryCount();
        if (currentCount >= DAILY_STORY_LIMIT) {
            setError(`Günlük hikaye limitiniz dolmuş! Bugün ${DAILY_STORY_LIMIT} hikaye oluşturdunuz. Yarın tekrar deneyebilirsiniz.`);
            setTodayCount(currentCount);
            return;
        }

        setIsLoading(true);
        setError(null);
        setStory(null);
        try {
            const result = await generateStoryAndImage(prompt);
            const storyWithMetadata: Story = {
                ...result,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                prompt,
                createdAt: Date.now(),
            };
            setStory(storyWithMetadata);
            await saveStory(storyWithMetadata);
            await loadSavedStories();
            setView('story');
        } catch (err) {
            console.error(err);
            setError('Üzgünüz, hikaye oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    }, [loadSavedStories]);

    const handleReset = () => {
        setStory(null);
        setError(null);
        setView('home');
    };

    const handleViewStory = (selectedStory: Story) => {
        setStory(selectedStory);
        setView('story');
    };

    const handleDeleteStory = useCallback(async (storyId: string) => {
        await deleteStory(storyId);
        await loadSavedStories();
        if (story?.id === storyId) {
            handleReset();
        }
    }, [story, loadSavedStories]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('tr-TR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center p-4 md:p-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>
            
            <div className="relative z-10 w-full max-w-7xl">
                <Header 
                    onHistoryClick={() => setView('history')} 
                    showBackButton={view !== 'home'}
                    onBackClick={handleReset}
                />
                <div className="flex-grow flex items-center justify-center w-full min-h-[60vh]">
                {error && (
                        <div className="w-full max-w-lg p-6 glass-strong rounded-2xl shadow-xl border border-rose-200/50 animate-fade-in-up">
                            <div className="text-center">
                                <div className="text-4xl mb-3">⚠️</div>
                                <p className="text-rose-700 font-bold text-lg mb-4">{error}</p>
                                <button 
                                    onClick={handleReset} 
                                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                >
                                    Tekrar Dene
                                </button>
                            </div>
                    </div>
                )}
                {view === 'home' && !isLoading && !error && (
                    <StoryForm 
                        onSubmit={handleGenerateStory} 
                        isLoading={isLoading}
                        todayCount={todayCount}
                        dailyLimit={DAILY_STORY_LIMIT}
                    />
                )}
                {isLoading && <LoadingScreen />}
                {view === 'story' && story && !isLoading && (
                    <StoryDisplay 
                        story={story} 
                        onReset={handleReset}
                        onDelete={() => handleDeleteStory(story.id)}
                    />
                )}
                {view === 'history' && (
                    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
                        <div className="glass-strong rounded-3xl shadow-2xl p-6 md:p-8">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <span className="text-3xl">📚</span>
                                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                    Geçmiş Hikayeler
                                </span>
                            </h2>
                            {savedStories.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4 animate-float">📖</div>
                                    <p className="text-slate-700 font-bold text-lg mb-2">Henüz kaydedilmiş hikaye yok.</p>
                                    <p className="text-sm text-slate-500">Yeni bir hikaye oluşturduğunuzda burada görünecek!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                    {savedStories.map((s, index) => (
                                        <div
                                            key={s.id}
                                            className="glass rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/50 hover:border-indigo-300/50 hover:scale-[1.01] active:scale-[0.99] animate-fade-in-up"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                            onClick={() => handleViewStory(s)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 line-clamp-2 text-base mb-2">{s.prompt}</p>
                                                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                        <span>🕐</span>
                                                        {formatDate(s.createdAt)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Bu hikayeyi silmek istediğinizden emin misiniz?')) {
                                                            handleDeleteStory(s.id);
                                                        }
                                                    }}
                                                    className="ml-3 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                                                    aria-label="Sil"
                                                    title="Hikayeyi Sil"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{s.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            </div>
             <footer className="relative z-10 text-center py-6 text-slate-600 text-sm font-medium mt-auto">
                <p className="flex items-center justify-center gap-2">
                    <span>✨</span>
                    Yapay zeka ile sihirli dünyalar yaratın.
                    <span>✨</span>
                </p>
            </footer>
        </main>
    );
}


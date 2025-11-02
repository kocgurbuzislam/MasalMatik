import React, { useState, useCallback } from 'react';
import { generateStoryAndImage } from './services/geminiService';
import { Story } from './types';
import { MagicWandIcon, BookOpenIcon, SparklesIcon } from './components/icons';

const Header: React.FC = () => (
    <header className="w-full text-center p-4">
        <h1 className="text-3xl md:text-4xl font-black text-white text-shadow-lg flex items-center justify-center gap-3">
            <BookOpenIcon />
            Sihirli Hikayeler
        </h1>
    </header>
);

const StoryForm: React.FC<{
    onSubmit: (prompt: string) => void;
    isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const suggestions = ["cesur bir sincap", "kayıp yıldız", "konuşan bir bulut", "sihirli bir orman"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        onSubmit(suggestion);
    };

    return (
        <div className="w-full max-w-lg mx-auto p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
            <form onSubmit={handleSubmit}>
                <label htmlFor="prompt" className="block text-lg font-bold text-gray-700 mb-2">
                    Ne hakkında bir hikaye istersin?
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Örn: Uzayda macera yaşayan bir kedi..."
                    className="w-full h-28 p-3 bg-white/80 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-400 focus:border-purple-500 transition duration-300 resize-none text-gray-800 placeholder-gray-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading || !prompt.trim()}
                >
                    <MagicWandIcon />
                    Hikayeyi Oluştur
                </button>
            </form>
             <div className="mt-4">
                <p className="text-sm text-gray-600 font-semibold mb-2 text-center">Ya da bunlardan birini seç:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                            className="bg-purple-100 text-purple-700 text-sm font-semibold py-1 px-3 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50"
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
    <div className="w-full max-w-lg mx-auto p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl text-center">
        <div className="animate-pulse">
            <SparklesIcon className="w-16 h-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-700 mt-4">Hikayen hazırlanıyor...</h2>
            <p className="text-gray-600 mt-2">Sihirli kelimeler bir araya geliyor ve resimler çiziliyor. Lütfen bekle...</p>
        </div>
    </div>
);

const StoryDisplay: React.FC<{ story: Story; onReset: () => void }> = ({ story, onReset }) => (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl animate-fade-in">
        <div className="bg-white rounded-xl shadow-inner p-4">
            <img src={story.imageUrl} alt="Hikaye Resmi" className="w-full rounded-lg shadow-lg mb-6 border-4 border-yellow-300" />
            <p className="text-gray-800 text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">{story.text}</p>
        </div>
        <button
            onClick={onReset}
            className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
        >
            <MagicWandIcon />
            Yeni Bir Hikaye Oluştur
        </button>
    </div>
);

export default function App() {
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateStory = useCallback(async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        setStory(null);
        try {
            const result = await generateStoryAndImage(prompt);
            setStory(result);
        } catch (err) {
            console.error(err);
            setError('Üzgünüz, hikaye oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReset = () => {
        setStory(null);
        setError(null);
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-tr from-blue-200 via-purple-300 to-pink-300 flex flex-col items-center p-4">
            <Header />
            <div className="flex-grow flex items-center justify-center w-full">
                {error && (
                    <div className="w-full max-w-lg p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                        <p>{error}</p>
                        <button onClick={handleReset} className="mt-2 text-sm font-bold underline">Tekrar Dene</button>
                    </div>
                )}
                {!story && !isLoading && !error && (
                    <StoryForm onSubmit={handleGenerateStory} isLoading={isLoading} />
                )}
                {isLoading && <LoadingScreen />}
                {story && !isLoading && <StoryDisplay story={story} onReset={handleReset} />}
            </div>
             <footer className="text-center py-4 text-white/80 text-sm">
                <p>Yapay zeka ile sihirli dünyalar yaratın.</p>
            </footer>
        </main>
    );
}

"use client";

import { useState, useEffect } from "react";

const VISIBLE_MODELS_KEY = "b3_analyzer_visible_models";
const SELECTED_MODEL_KEY = "b3_analyzer_selected_model";
const DEFAULT_VISIBLE_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
    "llama-3.3-70b-specdec",
    "llama-3.3-70b-versatile"
];
const DEFAULT_SELECTED_MODEL = "gemini-2.5-flash-lite";

export function useAiSettings() {
    const [visibleModels, setVisibleModels] = useState<string[]>(DEFAULT_VISIBLE_MODELS);
    const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_SELECTED_MODEL);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const savedVisible = localStorage.getItem(VISIBLE_MODELS_KEY);
        const savedSelected = localStorage.getItem(SELECTED_MODEL_KEY);

        if (savedVisible) {
            try {
                setVisibleModels(JSON.parse(savedVisible));
            } catch (e) {
                console.error("Failed to parse visible models", e);
            }
        }

        if (savedSelected) {
            setSelectedModel(savedSelected);
        }

        setIsInitialized(true);
    }, []);

    const toggleModelVisibility = (modelId: string) => {
        setVisibleModels(prev => {
            const next = prev.includes(modelId)
                ? prev.filter(id => id !== modelId)
                : [...prev, modelId];

            localStorage.setItem(VISIBLE_MODELS_KEY, JSON.stringify(next));
            return next;
        });
    };

    const updateSelectedModel = (modelId: string) => {
        setSelectedModel(modelId);
        localStorage.setItem(SELECTED_MODEL_KEY, modelId);
    };

    const isVisible = (modelId: string) => visibleModels.includes(modelId);

    return {
        visibleModels,
        toggleModelVisibility,
        selectedModel,
        updateSelectedModel,
        isVisible,
        isInitialized
    };
}

import React, { useState } from 'react';
import type { ChecklistItem } from '@/types';

interface AddChecklistItemFormProps {
    onAddItem: (task: string) => void;
}

const AddChecklistItemForm: React.FC<AddChecklistItemFormProps> = ({ onAddItem }) => {
    const [task, setTask] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem(task);
        setTask('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 no-print">
            <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Dodaj nowe zadanie..."
                className="flex-grow px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:placeholder-slate-400"
                required
            />
            <button type="submit" className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">+</button>
        </form>
    );
};


interface EditableChecklistItemProps {
    item: ChecklistItem;
    onToggleItem: (itemId: number) => void;
    onUpdateItem: (itemId: number, newTask: string) => void;
    onDeleteItem: (itemId: number) => void;
}

const EditableChecklistItem: React.FC<EditableChecklistItemProps> = ({ item, onToggleItem, onUpdateItem, onDeleteItem }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(item.task);

    const handleSave = () => {
        if (editedTask.trim()) {
            onUpdateItem(item.id, editedTask);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditedTask(item.task);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <li className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-md no-print">
                <input
                    type="text"
                    value={editedTask}
                    onChange={(e) => setEditedTask(e.target.value)}
                    className="flex-grow px-2 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                />
                <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800" aria-label="Zapisz zmianę">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
                <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800" aria-label="Anuluj edycję">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </li>
        );
    }

    return (
        <li className="group flex items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <input
                type="checkbox"
                id={`checklist-${item.id}`}
                checked={item.done}
                onChange={() => onToggleItem(item.id)}
                className="h-5 w-5 rounded border-slate-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-600 dark:focus:ring-indigo-600 dark:focus:ring-offset-slate-800 cursor-pointer"
            />
            <label
                htmlFor={`checklist-${item.id}`}
                className={`ml-4 flex-grow text-sm font-medium ${item.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'} cursor-pointer`}
            >
                {item.task}
            </label>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity no-print">
                <button onClick={() => setIsEditing(true)} className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400" aria-label="Edytuj zadanie">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500" aria-label="Usuń zadanie">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </li>
    );
};

interface ChecklistProps {
    items: ChecklistItem[];
    onToggleItem: (itemId: number) => void;
    onAddItem: (task: string) => void;
    onUpdateItem: (itemId: number, newTask: string) => void;
    onDeleteItem: (itemId: number) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ items, onToggleItem, onAddItem, onUpdateItem, onDeleteItem }) => {
    const doneCount = items.filter(item => item.done).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md checklist-container">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Przed Wyjazdem (Checklista)</h2>
                {totalCount > 0 && (
                    <div className="mt-2 no-print">
                        <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                            <span>Postęp</span>
                            <span>{doneCount} / {totalCount}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            <ul className="space-y-2">
                {items.map(item => (
                    <EditableChecklistItem
                        key={item.id}
                        item={item}
                        onToggleItem={onToggleItem}
                        onUpdateItem={onUpdateItem}
                        onDeleteItem={onDeleteItem}
                    />
                ))}
            </ul>
            <AddChecklistItemForm onAddItem={onAddItem} />
        </div>
    );
};

export default Checklist;
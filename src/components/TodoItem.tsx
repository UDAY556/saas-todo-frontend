import { useState } from 'react';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
}

interface Props {
  todo: Todo;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, title: string, description: string) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');

  const handleSave = async () => {
    if (!title.trim()) return;
    await onUpdate(todo.id, title.trim(), description.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-3 bg-white rounded-md shadow-sm border">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-2 py-1 border rounded"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 px-2 py-1 border rounded"
          placeholder="Description"
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-800 text-sm font-medium">
          Save
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-700 text-sm">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-md shadow-sm border">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {todo.title}
        </p>
        {todo.description && (
          <p className={`text-sm ${todo.completed ? 'line-through text-gray-300' : 'text-gray-500'}`}>
            {todo.description}
          </p>
        )}
      </div>
      <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-blue-600 text-sm">
        Edit
      </button>
      <button onClick={() => onDelete(todo.id)} className="text-gray-400 hover:text-red-600 text-sm">
        Delete
      </button>
    </div>
  );
}

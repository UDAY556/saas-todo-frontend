import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import TodoForm from '../components/TodoForm';
import TodoItem from '../components/TodoItem';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { user, logout } = useAuth();

  const fetchTodos = async () => {
    const res = await client.get('/api/todos');
    setTodos(res.data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async (title: string, description: string) => {
    const res = await client.post('/api/todos', { title, description: description || null });
    setTodos([res.data, ...todos]);
  };

  const toggleTodo = async (id: number) => {
    const res = await client.patch(`/api/todos/${id}/toggle`);
    setTodos(todos.map((t) => (t.id === id ? res.data : t)));
  };

  const deleteTodo = async (id: number) => {
    await client.delete(`/api/todos/${id}`);
    setTodos(todos.filter((t) => t.id !== id));
  };

  const updateTodo = async (id: number, title: string, description: string) => {
    const res = await client.put(`/api/todos/${id}`, { title, description: description || null });
    setTodos(todos.map((t) => (t.id === id ? res.data : t)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Todo App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <TodoForm onAdd={addTodo} />
        <div className="space-y-2">
          {todos.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No todos yet. Add one above!</p>
          ) : (
            todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

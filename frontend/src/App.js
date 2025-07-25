import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios interceptor for auth
let token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Notification Component
const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg transition-all duration-300 ${getNotificationStyles()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const PinInput = ({ pin, setPin, disabled = false }) => {
  const handleChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = pin.split('');
      newPin[index] = value;
      setPin(newPin.join(''));
      
      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="flex space-x-2 justify-center">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          id={`pin-${index}`}
          type="text"
          value={pin[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="w-12 h-12 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xl font-bold disabled:bg-gray-100"
          maxLength="1"
        />
      ))}
    </div>
  );
};

const RichTextEditor = ({ content, onChange, disabled = false }) => {
  const insertText = (before, after = '') => {
    const textarea = document.getElementById('editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    onChange(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatButtons = [
    { label: 'B', action: () => insertText('**', '**'), title: 'Bold' },
    { label: 'I', action: () => insertText('*', '*'), title: 'Italic' },
    { label: 'H1', action: () => insertText('# '), title: 'Heading 1' },
    { label: 'H2', action: () => insertText('## '), title: 'Heading 2' },
    { label: '•', action: () => insertText('- '), title: 'Bullet List' },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-2 border-b border-gray-200 flex space-x-2">
        {formatButtons.map((btn, index) => (
          <button
            key={index}
            onClick={btn.action}
            disabled={disabled}
            title={btn.title}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 font-bold text-sm"
          >
            {btn.label}
          </button>
        ))}
      </div>
      <textarea
        id="editor"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-80 p-4 focus:outline-none disabled:bg-gray-50 resize-none"
        placeholder="Start writing your document..."
      />
    </div>
  );
};

const LoginForm = ({ onLogin, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password && pin.length === 4) {
      onLogin({ username, password, pin, isRegistering });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Document Disk</h1>
          <p className="text-gray-600 mt-2">Your secure document storage</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4-Digit PIN
            </label>
            <PinInput pin={pin} setPin={setPin} disabled={isLoading} />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password || pin.length !== 4}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DocumentList = ({ documents, onSelectDocument, onNewDocument, onDeleteDocument }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Your Documents</h2>
        <button
          onClick={onNewDocument}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Document</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No documents yet. Create your first document!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {doc.content.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(doc.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc.id);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentEditor = ({ document, onSave, onCancel, isLoading }) => {
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');

  const handleSave = () => {
    if (title.trim()) {
      onSave({ title: title.trim(), content });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {document ? 'Edit Document' : 'New Document'}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="Enter document title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'editor'
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
      fetchDocuments();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Failed to load documents');
    }
  };

  const handleLogin = async ({ username, password, pin, isRegistering }) => {
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        try {
          await axios.post(`${API}/register`, { username, password, pin });
        } catch (registerError) {
          if (registerError.response?.status === 400) {
            setError('Username is already taken. Please choose a different username.');
          } else if (registerError.response?.data?.detail) {
            if (typeof registerError.response.data.detail === 'string') {
              setError(registerError.response.data.detail);
            } else if (Array.isArray(registerError.response.data.detail)) {
              const firstError = registerError.response.data.detail[0];
              setError(firstError.msg || 'Invalid input. Please check your details.');
            } else {
              setError('Registration failed. Please check your details.');
            }
          } else {
            setError('Registration failed. Please try again.');
          }
          setIsLoading(false);
          return;
        }
      }
      
      try {
        const response = await axios.post(`${API}/login`, { username, password, pin });
        const { access_token } = response.data;
        
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        await fetchUser();
        await fetchDocuments();
        setError(''); // Clear any existing errors on successful login
        showNotification(`Welcome back, ${username}!`, 'success');
      } catch (loginError) {
        if (loginError.response?.status === 401) {
          setError('Invalid credentials. Please check your username, password, and PIN.');
        } else {
          setError('Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setDocuments([]);
    setCurrentView('list');
    setCurrentDocument(null);
  };

  const handleSaveDocument = async (documentData) => {
    setIsLoading(true);
    setError('');

    try {
      if (currentDocument) {
        await axios.put(`${API}/documents/${currentDocument.id}`, documentData);
      } else {
        await axios.post(`${API}/documents`, documentData);
      }
      
      await fetchDocuments();
      setCurrentView('list');
      setCurrentDocument(null);
      showNotification('Document saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save document:', error);
      setError('Failed to save document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${API}/documents/${documentId}`);
        await fetchDocuments();
        showNotification('Document deleted successfully!', 'success');
      } catch (error) {
        console.error('Failed to delete document:', error);
        showNotification('Failed to delete document', 'error');
      }
    }
  };

  const handleSelectDocument = (document) => {
    setCurrentDocument(document);
    setCurrentView('editor');
  };

  const handleNewDocument = () => {
    setCurrentDocument(null);
    setCurrentView('editor');
  };

  const handleCancel = () => {
    setCurrentView('list');
    setCurrentDocument(null);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Document Disk</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.username}</span>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {currentView === 'list' ? (
          <DocumentList
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onNewDocument={handleNewDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        ) : (
          <DocumentEditor
            document={currentDocument}
            onSave={handleSaveDocument}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}

export default App;
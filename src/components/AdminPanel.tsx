import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { Trash2, Ban, CheckCircle, Users, Activity, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

export default function AdminPanel() {
  const { lang } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [fireflies, setFireflies] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'fireflies' | 'stats'>('stats');
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  if (asyncError) {
    throw asyncError;
  }

  useEffect(() => {
    // Listen to users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers: any[] = [];
      let online = 0;
      const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        fetchedUsers.push({ id: doc.id, ...data });
        if (data.lastActive && data.lastActive > fiveMinsAgo) {
          online++;
        }
      });
      setUsers(fetchedUsers);
      setOnlineCount(online);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'users');
      } catch (formattedErr) {
        setAsyncError(formattedErr as Error);
      }
    });

    // Listen to fireflies
    const qFireflies = query(collection(db, 'fireflies'), orderBy('createdAt', 'desc'));
    const unsubscribeFireflies = onSnapshot(qFireflies, (snapshot) => {
      const fetchedFireflies: any[] = [];
      snapshot.forEach(doc => {
        fetchedFireflies.push({ id: doc.id, ...doc.data() });
      });
      setFireflies(fetchedFireflies);
      setLoading(false);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'fireflies');
      } catch (formattedErr) {
        setAsyncError(formattedErr as Error);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeFireflies();
    };
  }, []);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isDisabled: !currentStatus
      });
    } catch (err) {
      console.error("Error updating user:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      } catch (formattedErr) {
        setAsyncError(formattedErr as Error);
      }
    }
  };

  const deleteFirefly = async (fireflyId: string) => {
    if (!window.confirm("Are you sure you want to delete this firefly?")) return;
    try {
      await deleteDoc(doc(db, 'fireflies', fireflyId));
    } catch (err) {
      console.error("Error deleting firefly:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `fireflies/${fireflyId}`);
      } catch (formattedErr) {
        setAsyncError(formattedErr as Error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-sage-300 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-6 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h2>
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stats' ? 'bg-sage-100 text-sage-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Statistics
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-sage-100 text-sage-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('fireflies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'fireflies' ? 'bg-sage-100 text-sage-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Fireflies
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{users.length}</h3>
              <p className="text-sm text-slate-500 mt-1">Total Users</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <Activity size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{onlineCount}</h3>
              <p className="text-sm text-slate-500 mt-1">Users Online</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center col-span-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{fireflies.length}</h3>
              <p className="text-sm text-slate-500 mt-1">Total Fireflies</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{user.name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role || 'client'}
                    </span>
                    {user.isDisabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
                {user.role !== 'admin' && (
                  <button
                    onClick={() => toggleUserStatus(user.id, !!user.isDisabled)}
                    className={`p-2 rounded-lg transition-colors ${user.isDisabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    title={user.isDisabled ? "Enable User" : "Disable User"}
                  >
                    {user.isDisabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fireflies' && (
          <div className="space-y-3">
            {fireflies.map(firefly => (
              <div key={firefly.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-800 line-clamp-2">{firefly.text_vi || firefly.text_en}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(firefly.createdAt).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      By: {firefly.authorId}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteFirefly(firefly.id)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                  title="Delete Firefly"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

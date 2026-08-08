import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time data states
  const [collections, setCollections] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [bankCharges, setBankCharges] = useState([]);
  const [dpsEntries, setDpsEntries] = useState([]);
  const [profits, setProfits] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bank, setBank] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    balance: 0,
    transactions: []
  });

  const [lang, setLang] = useState('bn');

  // ──────────────────────────────────────────────
  // 1. Firebase Auth Listener
  // ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load user profile from Firestore "users" collection
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              uid: user.uid,
              name: data.name || user.displayName || 'ব্যবহারকারী',
              email: user.email,
              role: data.role || 'member',
              phone: data.phone || '',
              address: data.address || '',
              profileImage: data.profileImage || ''
            });
          } else {
            setUserProfile({
              uid: user.uid,
              name: user.displayName || user.email,
              email: user.email,
              role: 'member',
              phone: '',
              address: '',
              profileImage: ''
            });
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          setUserProfile({
            uid: user.uid,
            name: user.email,
            email: user.email,
            role: 'member',
            phone: '',
            address: '',
            profileImage: ''
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ──────────────────────────────────────────────
  // 2. Real-time Firestore Listeners (Triggers as soon as Auth settles)
  // ──────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser) {
      setCollections([]);
      setMembers([]);
      setExpenses([]);
      setInvestments([]);
      setBankCharges([]);
      setDpsEntries([]);
      setProfits([]);
      setNotifications([]);
      return;
    }

    // Listen to "collections" collection
    const unsubCollections = onSnapshot(collection(db, 'collections'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCollections(data);
    }, (err) => console.error('Collections listener error:', err));

    // Listen to "users" collection for members list
    const unsubMembers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort members by position ascending (position 1 comes first)
      data.sort((a, b) => {
        const posA = a.position !== undefined && a.position !== null && a.position !== '' ? Number(a.position) : 99999;
        const posB = b.position !== undefined && b.position !== null && b.position !== '' ? Number(b.position) : 99999;
        return posA - posB;
      });
      setMembers(data);
    }, (err) => console.error('Members listener error:', err));

    // Listen to "expenses" collection
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setExpenses(data);
    }, (err) => console.error('Expenses listener error:', err));

    // Listen to "investments" collection
    const unsubInvestments = onSnapshot(collection(db, 'investments'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvestments(data);
    }, (err) => console.error('Investments listener error:', err));

    // Listen to "bank_charges" collection
    const unsubBankCharges = onSnapshot(collection(db, 'bank_charges'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBankCharges(data);
    }, (err) => console.error('Bank charges listener error:', err));

    // Listen to "dps_entries" collection
    const unsubDps = onSnapshot(collection(db, 'dps_entries'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDpsEntries(data);
    }, (err) => console.error('DPS listener error:', err));

    // Listen to "profits" collection
    const unsubProfits = onSnapshot(collection(db, 'profits'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProfits(data);
    }, (err) => console.error('Profits listener error:', err));

    // Listen to "notifications" collection
    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(data);
    }, (err) => console.error('Notifications listener error:', err));

    // Listen to "bank" collection
    const unsubBank = onSnapshot(collection(db, 'bank'), (snapshot) => {
      if (!snapshot.empty) {
        const bankDoc = snapshot.docs[0];
        setBank({ id: bankDoc.id, ...bankDoc.data(), transactions: bankDoc.data().transactions || [] });
      }
    }, (err) => console.error('Bank listener error:', err));

    return () => {
      unsubCollections();
      unsubMembers();
      unsubExpenses();
      unsubInvestments();
      unsubBankCharges();
      unsubDps();
      unsubProfits();
      unsubNotifications();
      unsubBank();
    };
  }, [currentUser]);

  // Ensure every notification document in Firestore has createdAt so Android app orderBy("createdAt") query finds it!
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    notifications.forEach(async (n) => {
      if (!n.id || n.createdAt || n.createdAt?.hasPendingWrites) return;

      try {
        const ref = doc(db, 'notifications', n.id);
        const updates = {
          createdAt: n.time?.seconds ? n.time : serverTimestamp(),
          body: n.body || n.message || '',
          message: n.message || n.body || '',
          amount: Math.round(Number(n.amount || 0))
        };
        await updateDoc(ref, updates);
      } catch (err) {
        console.error('Error backfilling createdAt on notification doc:', err);
      }
    });
  }, [notifications]);

  // Deduplicate multicast notifications in Firestore database so Android & Web see exactly 1 notification per event
  useEffect(() => {
    if (!currentUser || !notifications || notifications.length < 2) return;

    const seenKeys = new Map();
    const duplicateIdsToDelete = [];

    notifications.forEach(n => {
      const title = (n.title || '').trim();
      const body = (n.body || n.message || n.reason || n.comment || '').trim();
      if (!body) return;

      // Group by title & body message to collapse multicast user copies
      const key = `${n.type || 'general'}_${title}_${body}`;

      if (seenKeys.has(key)) {
        duplicateIdsToDelete.push(n.id);
      } else {
        seenKeys.set(key, n.id);
      }
    });

    if (duplicateIdsToDelete.length > 0) {
      duplicateIdsToDelete.forEach(async (id) => {
        try {
          await deleteDoc(doc(db, 'notifications', id));
        } catch (err) {
          console.error('Error deleting duplicate notification:', err);
        }
      });
    }
  }, [currentUser, notifications?.length]);

  // ──────────────────────────────────────────────
  // 3. Auth Methods (Firebase)
  // ──────────────────────────────────────────────
  const login = async (email, password) => {
    if (!email || !password) throw new Error('ইমেইল ও পাসওয়ার্ড দিন');
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    setCurrentUser(user);

    // Fetch user profile immediately so user is authenticated before navigation
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          uid: user.uid,
          name: data.name || user.displayName || user.email,
          email: data.email || user.email,
          role: data.role || 'member',
          phone: data.phone || '',
          address: data.address || '',
          profileImage: data.profileImage || '',
          ...data
        });
      } else {
        setUserProfile({
          uid: user.uid,
          name: user.displayName || user.email,
          email: user.email,
          role: 'member',
          phone: '',
          address: '',
          profileImage: ''
        });
      }
    } catch (err) {
      console.error('Error fetching user profile during login:', err);
    }
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  // ──────────────────────────────────────────────
  // 4. Collection / Payment Actions
  // ──────────────────────────────────────────────
  const addCollection = async (newCollection) => {
    const mUid = newCollection.userId || currentUser?.uid;
    const foundMember = members.find(m => m.id === mUid || m.uid === mUid);
    const mName = foundMember?.name || newCollection.memberName || userProfile?.name || 'সদস্য';
    const amountNum = Math.round(Number(newCollection.amount || 0));

    const item = {
      userId: mUid,
      memberName: mName,
      amount: amountNum,
      year: String(newCollection.year || '2026'),
      month: newCollection.month || null,
      paymentType: newCollection.paymentType || (newCollection.month ? 'monthly' : 'yearly'),
      status: newCollection.status || 'pending',
      receiptUrl: newCollection.receiptUrl || '',
      time: Date.now(),
      date: newCollection.date || new Date().toISOString().split('T')[0],
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      addedBy: userProfile?.uid || ''
    };

    await addDoc(collection(db, 'collections'), item);
  };

  const approveCollection = async (id) => {
    const ref = doc(db, 'collections', id);
    const updates = { 
      status: 'approved',
      approvedAt: Date.now(),
      approvedBy: userProfile?.uid || currentUser?.uid || ''
    };
    await updateDoc(ref, updates);
  };

  const rejectCollection = async (id) => {
    const ref = doc(db, 'collections', id);
    await deleteDoc(ref);
  };

  const updateCollection = async (id, updatedData) => {
    const ref = doc(db, 'collections', id);
    await updateDoc(ref, updatedData);
  };

  const deleteCollection = async (id) => {
    const ref = doc(db, 'collections', id);
    await deleteDoc(ref);
  };

  // ──────────────────────────────────────────────
  // 5. Expense & Investment Actions (Firestore)
  // ──────────────────────────────────────────────
  const addExpense = async (newExpense) => {
    const item = {
      ...newExpense,
      amount: Number(newExpense.amount),
      addedBy: userProfile?.name || 'Admin',
      date: newExpense.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'expenses'), item);
  };

  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const addInvestment = async (item) => {
    const data = {
      ...item,
      amount: Number(item.amount),
      date: item.date || new Date().toISOString().split('T')[0],
      timestamp: SystemTime(),
      createdAt: serverTimestamp(),
      createdBy: userProfile?.uid || ''
    };
    await addDoc(collection(db, 'investments'), data);

    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'নতুন বিনিয়োগ',
        body: `${data.title || 'খাত'} খাতে ${data.amount} টাকা বিনিয়োগ করা হয়েছে`,
        message: `${data.title || 'খাত'} খাতে ${data.amount} টাকা বিনিয়োগ করা হয়েছে`,
        type: 'investment',
        amount: Number(data.amount),
        createdAt: serverTimestamp(),
        time: serverTimestamp()
      });
    } catch (e) {
      console.error('Notification write error:', e);
    }
  };

  const deleteInvestment = async (id) => {
    await deleteDoc(doc(db, 'investments', id));
  };

  const addBankCharge = async (item) => {
    const data = {
      ...item,
      amount: Number(item.amount),
      date: item.date || new Date().toISOString().split('T')[0],
      timestamp: SystemTime(),
      createdAt: serverTimestamp(),
      createdBy: userProfile?.uid || ''
    };
    await addDoc(collection(db, 'bank_charges'), data);

    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'ব্যাংক চার্জ',
        body: `${data.amount} টাকা ব্যাংক চার্জ কেটে নেয়া হয়েছে`,
        message: `${data.amount} টাকা ব্যাংক চার্জ কেটে নেয়া হয়েছে`,
        type: 'bank_charge',
        amount: Number(data.amount),
        createdAt: serverTimestamp(),
        time: serverTimestamp()
      });
    } catch (e) {
      console.error('Notification write error:', e);
    }
  };

  const deleteBankCharge = async (id) => {
    await deleteDoc(doc(db, 'bank_charges', id));
  };

  const addDpsEntry = async (item) => {
    const data = {
      ...item,
      amount: Number(item.amount),
      date: item.date || new Date().toISOString().split('T')[0],
      timestamp: SystemTime(),
      createdAt: serverTimestamp(),
      createdBy: userProfile?.uid || ''
    };
    await addDoc(collection(db, 'dps_entries'), data);

    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'ডিপিএস জমা',
        body: `${data.year || ''} সালের ${data.month || ''} মাসের DPS বাবদ ${data.amount} টাকা জমা করা হয়েছে`,
        message: `${data.year || ''} সালের ${data.month || ''} মাসের DPS বাবদ ${data.amount} টাকা জমা করা হয়েছে`,
        type: 'dps',
        amount: Number(data.amount),
        createdAt: serverTimestamp(),
        time: serverTimestamp()
      });
    } catch (e) {
      console.error('Notification write error:', e);
    }
  };

  const deleteDpsEntry = async (id) => {
    await deleteDoc(doc(db, 'dps_entries', id));
  };

  // Helper for timestamp
  function SystemTime() {
    return Date.now();
  }

  // ──────────────────────────────────────────────
  // 6. Profit Actions (Firestore)
  // ──────────────────────────────────────────────
  const addProfit = async (newProfit) => {
    const item = {
      ...newProfit,
      amount: Number(newProfit.amount || newProfit.totalProfitAmount || 0),
      totalProfitAmount: Number(newProfit.totalProfitAmount || newProfit.amount || 0),
      description: newProfit.description || newProfit.title || 'মুনাফা',
      title: newProfit.title || newProfit.description || 'মুনাফা',
      date: newProfit.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      createdBy: userProfile?.uid || ''
    };
    await addDoc(collection(db, 'profits'), item);
  };

  const updateProfit = async (id, updatedData) => {
    const ref = doc(db, 'profits', id);
    await updateDoc(ref, updatedData);
  };

  const deleteProfit = async (id) => {
    const ref = doc(db, 'profits', id);
    await deleteDoc(ref);
  };

  // ──────────────────────────────────────────────
  // 7. Member Actions (Firestore)
  // ──────────────────────────────────────────────
  const addMember = async (newMember) => {
    const item = {
      ...newMember,
      totalPaid: 0,
      status: 'active',
      role: 'member',
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'users'), item);
  };

  // Effective user falls back to currentUser if userProfile is loading
  const effectiveUser = userProfile || (currentUser ? {
    uid: currentUser.uid,
    name: currentUser.displayName || currentUser.email,
    email: currentUser.email,
    role: 'member',
    phone: '',
    address: '',
    profileImage: ''
  } : null);

  if (loading) {
    return <LoadingSpinner text="তথ্য লোড হচ্ছে..." fullScreen={true} />;
  }

  const updateNotification = async (id, updatedData) => {
    if (!id) return;
    try {
      const ref = doc(db, 'notifications', id);
      await updateDoc(ref, updatedData);
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };

  const deleteNotification = async (id) => {
    if (!id) return;
    try {
      const ref = doc(db, 'notifications', id);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser: effectiveUser,
      firebaseUser: currentUser,
      login,
      logout,
      updateUserProfile,
      collections,
      addCollection,
      approveCollection,
      rejectCollection,
      updateCollection,
      deleteCollection,
      members,
      addMember,
      expenses,
      addExpense,
      deleteExpense,
      investments,
      addInvestment,
      deleteInvestment,
      bankCharges,
      addBankCharge,
      deleteBankCharge,
      dpsEntries,
      addDpsEntry,
      deleteDpsEntry,
      profits,
      addProfit,
      updateProfit,
      deleteProfit,
      notifications,
      updateNotification,
      deleteNotification,
      bank,
      lang,
      setLang
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
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
      console.error('Error fetching user profile during login:', err);
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
    return user;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (updatedData) => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updatedData);
    setUserProfile(prev => ({ ...prev, ...updatedData }));
  };

  // ──────────────────────────────────────────────
  // 4. Collection Actions (Firestore)
  // ──────────────────────────────────────────────
  const addCollection = async (newCollection) => {
    const item = {
      ...newCollection,
      userId: newCollection.userId || newCollection.memberId || userProfile?.uid,
      amount: Number(newCollection.amount),
      status: newCollection.status || 'pending', // Always pending by default to require approval
      date: newCollection.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      addedBy: userProfile?.uid || ''
    };
    await addDoc(collection(db, 'collections'), item);

    // Save notification to Firestore "notifications" collection (for Android app & Web sync)
    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'নতুন জমা অনুরোধ',
        body: `${item.memberName || 'সদস্য'} এর ${item.month ? item.month + ' ' : ''}${item.year || ''} বাবদ ৳ ${item.amount} টাকা জমা অনুরোধ করা হয়েছে`,
        type: 'collection',
        userId: item.userId || '',
        month: item.month || '',
        year: item.year || '',
        amount: Number(item.amount),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error writing collection notification:', err);
    }
  };

  const approveCollection = async (id) => {
    const ref = doc(db, 'collections', id);
    await updateDoc(ref, { status: 'approved' });

    // Save approval notification to Firestore "notifications" collection
    try {
      const target = collections.find(c => c.id === id);
      if (target) {
        await addDoc(collection(db, 'notifications'), {
          title: 'পেমেন্ট অনুমোদিত',
          body: `${target.memberName || 'সদস্য'} এর ${target.month ? target.month + ' ' : ''}${target.year || ''} এর ৳ ${target.amount || 0} টাকা সফলভাবে অনুমোদন করা হয়েছে।`,
          type: 'approved',
          userId: target.userId || target.memberId || '',
          month: target.month || '',
          year: target.year || '',
          amount: Number(target.amount || 0),
          createdAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'notifications'), {
          title: 'পেমেন্ট অনুমোদিত',
          body: 'একটি জমার অনুরোধ সফলভাবে অনুমোদন করা হয়েছে।',
          type: 'approved',
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error writing approval notification:', err);
    }
  };

  const rejectCollection = async (id) => {
    const ref = doc(db, 'collections', id);
    await deleteDoc(ref);
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
        type: 'investment',
        amount: Number(data.amount),
        createdAt: serverTimestamp()
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
        type: 'bank_charge',
        amount: Number(data.amount),
        createdAt: serverTimestamp()
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
        type: 'dps',
        amount: Number(data.amount),
        createdAt: serverTimestamp()
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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl font-bengali">এস</span>
          </div>
          <p className="text-slate-400 text-sm font-bengali">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

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

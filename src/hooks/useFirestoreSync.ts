import { useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAgencyStore, Client, Post, CrisisEvent, SocialAccount, ScopeRequest, AgencySettings, UserProfile, ClientSocialConfig } from '../store/useAgencyStore';
import { useAuth } from '../contexts/AuthContext';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function useFirestoreSync() {
  const { user, profile } = useAuth();
  const { 
    setClients, 
    setPosts, 
    setCrisisEvents, 
    setSocialAccounts,
    setScopeRequests,
    setAgencySettings,
    setUsers,
    setNotifications,
    setClientSocialConfigs
  } = useAgencyStore();

  useEffect(() => {
    if (!user) return;

    // Sync Notifications
    const notificationTargets = [user.uid];
    if (profile?.role === 'admin' || profile?.role === 'manager') {
      notificationTargets.push('agency');
    }
    
    const notificationsQuery = profile?.role === 'client' && profile.clientId
      ? query(collection(db, 'notifications'), where('clientId', '==', profile.clientId))
      : query(collection(db, 'notifications'), where('userId', 'in', notificationTargets));

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNotifications(notificationsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    // Sync Users
    let unsubscribeUsers = () => {};
    if (profile?.role && profile.role !== 'client') {
      const usersQuery = query(collection(db, 'users'));
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });
    }

    // Sync Clients
    const clientsQuery = profile?.role === 'client' && profile.clientId
      ? query(collection(db, 'clients'), where('__name__', '==', profile.clientId))
      : query(collection(db, 'clients'));

    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
      
      // Automatically set current client for client role if not set
      if (profile?.role === 'client' && profile.clientId && clientsData.length > 0) {
        const myClient = clientsData.find(c => c.id === profile.clientId);
        if (myClient) {
          useAgencyStore.getState().setCurrentClient(myClient);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    });

    // Sync Posts
    const postsQuery = profile?.role === 'client' && profile.clientId
      ? query(collection(db, 'posts'), where('clientId', '==', profile.clientId))
      : query(collection(db, 'posts'));

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    // Sync Crisis Events
    const crisisQuery = profile?.role === 'client' && profile.clientId
      ? query(collection(db, 'crisis_events'), where('clientId', '==', profile.clientId))
      : query(collection(db, 'crisis_events'));

    const unsubscribeCrisis = onSnapshot(crisisQuery, (snapshot) => {
      const crisisData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CrisisEvent));
      setCrisisEvents(crisisData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'crisis_events');
    });

    // Sync Social Accounts
    const socialQuery = profile?.role === 'client' && profile.clientId
      ? query(collection(db, 'social_accounts'), where('clientId', '==', profile.clientId))
      : query(collection(db, 'social_accounts'));

    const unsubscribeSocial = onSnapshot(socialQuery, (snapshot) => {
      const socialData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialAccount));
      setSocialAccounts(socialData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'social_accounts');
    });

    // Sync Scope Requests
    const scopeQuery = profile?.role === 'client' && profile.clientId
      ? query(collection(db, 'scope_requests'), where('clientId', '==', profile.clientId))
      : query(collection(db, 'scope_requests'));

    const unsubscribeScope = onSnapshot(scopeQuery, (snapshot) => {
      const scopeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScopeRequest));
      setScopeRequests(scopeData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'scope_requests');
    });

    // Sync Agency Settings
    const agencyDoc = doc(db, 'config', 'agency');
    const unsubscribeAgency = onSnapshot(agencyDoc, (snapshot) => {
      if (snapshot.exists()) {
        setAgencySettings(snapshot.data() as AgencySettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/agency');
    });

    // Sync Client Social Configs
    const socialConfigsQuery = profile?.role === 'admin'
      ? query(collection(db, 'client_social_configs'))
      : profile?.clientId 
        ? query(collection(db, 'client_social_configs'), where('clientId', '==', profile.clientId))
        : null;

    let unsubscribeSocialConfigs = () => {};
    if (socialConfigsQuery) {
      unsubscribeSocialConfigs = onSnapshot(socialConfigsQuery, (snapshot) => {
        const configsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientSocialConfig));
        setClientSocialConfigs(configsData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'client_social_configs');
      });
    }

    return () => {
      unsubscribeNotifications();
      unsubscribeUsers();
      unsubscribeClients();
      unsubscribePosts();
      unsubscribeCrisis();
      unsubscribeSocial();
      unsubscribeScope();
      unsubscribeAgency();
      unsubscribeSocialConfigs();
    };
  }, [user, profile, setClients, setPosts, setCrisisEvents, setSocialAccounts, setScopeRequests, setAgencySettings, setUsers, setNotifications, setClientSocialConfigs]);
}

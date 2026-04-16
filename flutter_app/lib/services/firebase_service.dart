import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/client.dart';
import '../models/post.dart';
import '../models/crisis_event.dart';
import '../models/notification.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  late final FirebaseFirestore _db;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  FirebaseService() {
    // Use the specific database ID from your config
    _db = FirebaseFirestore.instanceFor(
      app: Firebase.app(),
      databaseId: 'ai-studio-fea3b390-d69d-4c49-9fc0-bc03b82a3ff0',
    );
    // Explicitly enable offline persistence
    _db.settings = const Settings(persistenceEnabled: true);
  }

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      if (userCredential.user != null) {
        // Save FCM token for push notifications
        await _saveFcmToken(userCredential.user!.uid);
      }
      return userCredential;
    } catch (e) {
      print('Error signing in with Google: $e');
      return null;
    }
  }

  Future<void> _saveFcmToken(String userId) async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        await _db.collection('users').doc(userId).set({
          'fcmToken': token,
          'lastTokenUpdate': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }
    } catch (e) {
      print('Error saving FCM token: $e');
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  Stream<List<Client>> getClients() {
    return _db.collection('clients').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Client.fromFirestore(doc)).toList();
    });
  }

  Stream<List<Post>> getPosts({String? clientId}) {
    Query query = _db.collection('posts');
    if (clientId != null) {
      query = query.where('clientId', isEqualTo: clientId);
    }
    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Post.fromFirestore(doc)).toList();
    });
  }

  Stream<List<CrisisEvent>> getCrisisEvents({String? clientId}) {
    Query query = _db.collection('crisis_events');
    if (clientId != null) {
      query = query.where('clientId', isEqualTo: clientId);
    }
    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => CrisisEvent.fromFirestore(doc)).toList();
    });
  }

  Stream<List<AppNotification>> getNotifications() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) return Stream.value([]);

    return _db.collection('notifications')
        .where('userId', isEqualTo: userId)
        .orderBy('time', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => AppNotification.fromFirestore(doc)).toList();
    });
  }

  Future<void> markNotificationAsRead(String notificationId) async {
    await _db.collection('notifications').doc(notificationId).update({'read': true});
  }

  Future<void> addPost(Post post) async {
    await _db.collection('posts').add(post.toMap());
  }

  Future<void> updatePost(Post post) async {
    await _db.collection('posts').doc(post.id).update(post.toMap());
  }

  Future<void> deletePost(String postId) async {
    await _db.collection('posts').doc(postId).delete();
  }
}

import 'package:cloud_firestore/cloud_firestore.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final DateTime time;
  final bool read;
  final String priority;
  final String? clientId;
  final String? userId;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.time,
    required this.read,
    required this.priority,
    this.clientId,
    this.userId,
  });

  factory AppNotification.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return AppNotification(
      id: doc.id,
      type: data['type'] ?? 'system',
      title: data['title'] ?? '',
      message: data['message'] ?? '',
      time: (data['time'] as Timestamp?)?.toDate() ?? DateTime.now(),
      read: data['read'] ?? false,
      priority: data['priority'] ?? 'low',
      clientId: data['clientId'],
      userId: data['userId'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'type': type,
      'title': title,
      'message': message,
      'time': Timestamp.fromDate(time),
      'read': read,
      'priority': priority,
      'clientId': clientId,
      'userId': userId,
    };
  }
}
